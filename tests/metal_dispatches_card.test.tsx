import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import * as model from '../src/model';
import MetalDispatchesCard from '../src/components/dashboards/metal_dispatches_card';
import { renderWithStore, cleanupDom } from './helpers';

// helios's own bulk-columnar lane: MSL kernel names, no model attribution.
const KERNELS: Array<model.IMetalDispatch> = [
    { run: 0, kernel: 'agg_kernel', rel_start_ns: 0, dur_ns: 2_000_000 },
    { run: 0, kernel: 'scan_kernel', rel_start_ns: 2_500_000, dur_ns: 1_000_000 },
    { run: 1, kernel: 'agg_kernel', rel_start_ns: 0, dur_ns: 1_500_000 },
];

// The ggml/llama inference lane behind pgml.embed: labelled by model, with the
// number of inputs the call actually ran (embed deduplicates, so a constant
// query string is ONE forward pass however many rows it serves).
const EMBED: Array<model.IMetalDispatch> = [
    { run: 0, kernel: 'embed(qe)', rel_start_ns: 50_000_000, dur_ns: 2_000_000, kind: 'embed', model: 'qe', items: 1 },
    { run: 0, kernel: 'embed(qe)', rel_start_ns: 52_000_000, dur_ns: 20_000_000, kind: 'embed', model: 'qe', items: 1 },
];

// The app stores KPI values as the arrow column array, not the scalar its type
// declaration claims — so exercise the shape the real pipeline produces.
function kpis(execTimeMs: number): Array<model.IKpiData> {
    return [{ id: 'execTime', title: 'Query Execution Time',
              value: [execTimeMs] as unknown as string }];
}

describe('MetalDispatchesCard', () => {
    afterEach(cleanupDom);

    it('renders nothing when the trace has no metal dispatches', () => {
        const store = model.createStore();
        const container = renderWithStore(<MetalDispatchesCard />, store);
        expect(container.innerHTML).toBe('');
    });

    it('aggregates helios kernels per query, not per trace', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: KERNELS });
        const container = renderWithStore(<MetalDispatchesCard />, store);

        expect(container.textContent).toContain('agg_kernel');
        expect(container.textContent).toContain('scan_kernel');
        // agg_kernel is 3.5ms across 2 runs -> 1.75ms per query. Reporting the
        // raw 3.5ms would overstate a loop-folded trace by the loop count.
        expect(container.textContent).toContain('1.75 ms');
        expect(container.textContent).toContain('averaged over 2 runs');
        expect(container.textContent).toContain('helios Metal kernel');
    });

    it('names the model behind a ggml dispatch and reports its input count', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: EMBED });
        const container = renderWithStore(<MetalDispatchesCard />, store);

        expect(container.textContent).toContain('embed(qe)');
        expect(container.textContent).toContain("embed via model 'qe'");
        expect(container.textContent).toContain('22 ms');   // 2ms + 20ms, one run
    });

    // items is per-invocation metadata repeated onto every interval a call
    // submits, so the summary row may only show it while the values agree —
    // a mix has no single honest number and must render as '—', never a sum
    // or a silently-picked survivor.
    it('shows items only when every interval of a consumer agrees', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: EMBED });
        const container = renderWithStore(<MetalDispatchesCard />, store);

        // Uniform items=1 across 2 dispatches -> "1", not 2 and not '—'.
        const cells = Array.from(container.querySelectorAll('td')).map(td => td.textContent);
        expect(cells).toContain('1');
        expect(cells).not.toContain('—');
    });

    it('renders — for a consumer whose intervals carry mixed items', () => {
        const MIXED: Array<model.IMetalDispatch> = [
            { run: 0, kernel: 'embed(qe)', rel_start_ns: 0, dur_ns: 1_000_000, kind: 'embed', model: 'qe', items: 1 },
            { run: 0, kernel: 'embed(qe)', rel_start_ns: 2_000_000, dur_ns: 1_000_000, kind: 'embed', model: 'qe', items: 2 },
            { run: 0, kernel: 'embed(qe)', rel_start_ns: 4_000_000, dur_ns: 1_000_000, kind: 'embed', model: 'qe', items: 1 },
        ];
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: MIXED });
        const container = renderWithStore(<MetalDispatchesCard />, store);

        const cells = Array.from(container.querySelectorAll('td')).map(td => td.textContent);
        expect(cells).toContain('—');
        // Neither first-seen (1), max (2) nor sum (4) is shown.
        expect(cells).not.toContain('1');
        expect(cells).not.toContain('2');
        expect(cells).not.toContain('4');
    });

    it('states the GPU share of the query when execution time is known', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: EMBED });
        store.dispatch({ type: model.StateMutationType.SET_KPIS, data: kpis(176) });
        const container = renderWithStore(<MetalDispatchesCard />, store);

        // 22ms of GPU inside a 176ms query.
        expect(container.textContent).toContain('12.5%');
        expect(container.textContent).toContain('of the query ran on the GPU');
    });

    it('claims no share when execution time is unavailable', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: EMBED });
        const container = renderWithStore(<MetalDispatchesCard />, store);

        expect(container.textContent).not.toContain('of the query ran on the GPU');
        expect(container.textContent).toContain('22.0 ms of GPU time per query');
    });

    it('shows a timeline for the run with the most dispatches', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: KERNELS });
        const container = renderWithStore(<MetalDispatchesCard />, store);
        expect(container.textContent).toContain('When the GPU was busy (run 0)');
    });

    // The unified-Metal-context lane: one query whose embedding forward (ggml)
    // and similarity kernel (helios) both hit the GPU. Since the engine's M1 a
    // model registration adopts the database's queue or refuses to register, so
    // a mixed trace can only mean one shared queue — the card says so.
    const FUSED: Array<model.IMetalDispatch> = [
        { run: 0, kernel: 'embed(qe)', rel_start_ns: 50_000_000, dur_ns: 20_000_000, kind: 'embed', model: 'qe', items: 1 },
        { run: 0, kernel: 'vector_sim_f32', rel_start_ns: 90_000_000, dur_ns: 1_000_000, items: 20000 },
    ];

    it('declares the shared queue only for a fused trace', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: FUSED });
        const container = renderWithStore(<MetalDispatchesCard />, store);
        expect(container.textContent).toContain(
            'database kernels and model inference share one Metal queue');

        // Single-lane traces make no such claim.
        for (const single of [KERNELS, EMBED]) {
            cleanupDom();
            const s = model.createStore();
            s.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: single });
            const c = renderWithStore(<MetalDispatchesCard />, s);
            expect(c.textContent).not.toContain('share one Metal queue');
        }
    });

    it('reports the row count of an engine kernel that carries one', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: FUSED });
        const container = renderWithStore(<MetalDispatchesCard />, store);
        expect(container.textContent).toContain('20,000');
    });

    it('colors timeline bars by consumer, matching the table legend', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: FUSED });
        const container = renderWithStore(<MetalDispatchesCard />, store);

        const colorsIn = (sel: string) =>
            Array.from(container.querySelectorAll<HTMLElement>(sel))
                .map(el => el.style.background || el.style.backgroundColor)
                .filter(c => c && !c.includes('238, 238, 238'));  // drop the #eee track
        const bars = Array.from(container.querySelectorAll<HTMLElement>('div[title*=":"]'))
            .map(el => el.style.background);
        // Two consumers -> two distinct bar colors, and each bar color must
        // appear somewhere in the table (chip or usage bar) as its legend.
        expect(new Set(bars).size).toBe(2);
        const tableColors = new Set(colorsIn('td div, td span'));
        for (const b of bars) expect(tableColors.has(b)).toBe(true);
    });
});
