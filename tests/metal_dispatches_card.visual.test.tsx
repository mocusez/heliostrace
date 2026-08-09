import { describe, it, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import React from 'react';
import * as model from '../src/model';
import MetalDispatchesCard from '../src/components/dashboards/metal_dispatches_card';
import { renderWithStore, cleanupDom } from './helpers';

// The card was rewritten without anyone ever looking at it. These render it
// with the shape of each real showcase package and save a screenshot, so the
// layout can be reviewed rather than assumed: a table that renders "correctly"
// can still be unreadable — labels clipped, bars invisible, a 900k input count
// overflowing its column.
//
// Screenshots land in tests/__screenshots__/ ; the assertions here are the
// cheap structural ones, the picture is for the human.

function dispatches(
    n: number, runs: number, kernel: string, kind: string, mdl: string,
    items: number, durMs: number, startMs: number,
): Array<model.IMetalDispatch> {
    return Array.from({ length: n }, (_, i) => ({
        run: i % runs,
        kernel,
        kind,
        model: mdl,
        items,
        rel_start_ns: (startMs + Math.floor(i / runs) * durMs * 1.1) * 1e6,
        dur_ns: durMs * 1e6,
    }));
}

function kpis(execTimeMs: number): Array<model.IKpiData> {
    return [{ id: 'execTime', title: 'Query Execution Time',
              value: [execTimeMs] as unknown as string }];
}

// Shapes mirror representative model and engine dispatch patterns.
const CASES = [
    {
        file: 'card-S2-predict.png',
        // 900k inputs, GPU is a rounding error of the query — the case where
        // the card must not imply the model was the cost.
        data: dispatches(18, 10, 'predict(revenue)', 'predict', 'revenue', 914963, 3.8, 866),
        exec: 1400,
    },
    {
        file: 'card-S4-embed.png',
        // items = 1 because embed deduplicates: the number that would read as
        // "20000" if we had reported rows instead.
        data: dispatches(80, 40, 'embed(qe)', 'embed', 'qe', 1, 14.2, 62),
        exec: 180,
    },
    {
        file: 'card-S6a-generate.png',
        // 96 dispatches, GPU-bound: the bar should fill and the timeline should
        // look dense rather than like a few slivers.
        data: dispatches(96, 2, 'generate(qwen)', 'generate', 'qwen', 12, 88.4, 17),
        exec: 4400,
    },
    {
        file: 'card-S4-fused.png',
        // The unified-Metal-context shape (post-UMA S4): the embedding forward
        // and the similarity kernel interleave on one queue. What to review:
        // the two consumers get distinct colors, the timeline shows which
        // engine owned each stretch, the shared-queue line is present, and the
        // sim kernel's 20,000-row input count sits in the inputs column.
        data: [
            ...dispatches(80, 40, 'embed(qe)', 'embed', 'qe', 1, 14.2, 55),
            ...dispatches(40, 40, 'vector_sim_f32', '', '', 20000, 0.96, 100)
                .map(d => ({ run: d.run, kernel: d.kernel, items: 20000,
                             rel_start_ns: d.rel_start_ns, dur_ns: d.dur_ns })),
        ],
        exec: 96,
    },
    {
        file: 'card-helios-kernels.png',
        // helios's own Metal lane: MSL names, no ML fields at all.
        data: [
            ...dispatches(30, 30, 'fact_filter_pack_dense_grouped', '', '', -1, 4.1, 12),
            ...dispatches(30, 30, 'decode_fixed_to_i64', '', '', -1, 1.4, 6),
        ].map(d => ({ run: d.run, kernel: d.kernel,
                      rel_start_ns: d.rel_start_ns, dur_ns: d.dur_ns })),
        exec: 26,
    },
];

describe('MetalDispatchesCard (visual)', () => {
    afterEach(cleanupDom);

    for (const c of CASES) {
        it(`renders ${c.file}`, async () => {
            // The default browser-mode viewport is phone-sized; the card lives
            // in a dashboard cell on a desktop. Shooting at the default width
            // shows clipping that the real layout never has.
            await page.viewport(1280, 720);
            const store = model.createStore();
            store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: c.data });
            store.dispatch({ type: model.StateMutationType.SET_KPIS, data: kpis(c.exec) });
            const container = renderWithStore(<MetalDispatchesCard />, store);

            // structural: something rendered, and the consumer is named
            expect(container.textContent).toContain('Metal GPU');
            expect(container.textContent).toContain(c.data[0].kernel);

            await page.screenshot({ element: container, path: `__screenshots__/${c.file}` });
        });
    }

    // ...and once narrow, because the dashboard cell shrinks on small screens
    // and a table that silently clips its last column is worse than one that
    // scrolls.
    it('renders card-S2-narrow.png at a phone width', async () => {
        await page.viewport(420, 720);
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_METAL_DISPATCHES, data: CASES[0].data });
        store.dispatch({ type: model.StateMutationType.SET_KPIS, data: kpis(CASES[0].exec) });
        const container = renderWithStore(<MetalDispatchesCard />, store);
        await page.screenshot({ element: container, path: '__screenshots__/card-S2-narrow.png' });
    });
});

// Not a Metal case, but the same harness: the SQL card renders through a real
// read-only Monaco with the 'sql' tokenizer — the screenshot is what proves
// the highlighting actually shows up (keywords colored, code font applied).
import QuerySqlCard from '../src/components/dashboards/query_sql_card';

describe('QuerySqlCard (visual)', () => {
    afterEach(cleanupDom);

    it('renders card-sql.png', async () => {
        await page.viewport(1280, 720);
        const store = model.createStore();
        store.dispatch({
            type: model.StateMutationType.SET_QUERYPLAN_JSON,
            data: {
                operator: 'sort', input: 0,
                sql: "-- S4  Semantic search over materialised vectors\n"
                    + "SELECT pv_partkey, p_type, p_retailprice,\n"
                    + "       pgml.cosine_similarity(pv_embedding,\n"
                    + "           pgml.embed('qe', 'polished brass part shipped in a small box')) AS sim\n"
                    + "FROM part_vec, part\n"
                    + "WHERE pv_partkey = p_partkey\n"
                    + "ORDER BY sim DESC\n"
                    + "LIMIT 10;",
            },
        });
        // The pane is chrome-less and fills its parent (it lives behind a tab
        // in the dashboard's left box) — give it the box it would get there.
        const container = renderWithStore(
            <div style={{ height: 240, width: 900 }}><QuerySqlCard /></div>, store);
        await new Promise<void>((resolve, reject) => {
            const start = Date.now();
            const tick = () => {
                if ((container.textContent ?? '').includes('LIMIT')) return resolve();
                if (Date.now() - start > 30_000) return reject(new Error('monaco never rendered'));
                setTimeout(tick, 100);
            };
            tick();
        });
        await page.screenshot({ element: container, path: '__screenshots__/card-sql.png' });
    });
});
