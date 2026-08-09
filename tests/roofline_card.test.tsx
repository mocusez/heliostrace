import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import * as model from '../src/model';
import RooflineCard from '../src/components/dashboards/roofline_card';
import { renderWithStore, cleanupDom } from './helpers';

// Shapes mirror what pack_cli.cpp emits (roofline.json): a fused S4b-style
// package (one fp32 kernel + roofs) and an SSB-style one (integer kernels
// that must land in the bandwidth table, never on the FLOP scatter).

const S4B: model.IRooflineData = {
    analytic: true,
    gpu: [{
        kernel: 'vector_sim_f32', dispatches: 40,
        bytes: 82_000_000, flops: 41_000_000, dur_ns: 990_000,
        achieved_gbs: 82.8, intensity: 0.5, achieved_gflops: 41.4,
    }],
    cpu: [{
        label: 'query', instructions: 3.1e8, bytes: 1.4e8, dur_ns: 2.9e7,
        intensity_ipb: 2.214, achieved_gips: 10.69, achieved_gbs: 4.83,
    }],
    roofs: {
        device: 'Apple M4',
        cpu: { bw_gbs: 105.0, gips: 131.4, threads: 10 },
        gpu: { bw_gbs: 105.2, fp32_gflops: 3502.3 },
    },
};

const SSB_INT: model.IRooflineData = {
    analytic: true,
    gpu: [{
        kernel: 'fact_filter_pack_dense', dispatches: 40,
        bytes: 240_000_000, flops: 0, dur_ns: 4_000_000,
        achieved_gbs: 60.0, intensity: 0,
    }],
    cpu: [],
    roofs: { device: 'Apple M4', gpu: { bw_gbs: 105.2, fp32_gflops: 3502.3 } },
};

describe('RooflineCard', () => {
    afterEach(cleanupDom);

    it('renders nothing when the trace has no roofline.json', () => {
        const store = model.createStore();
        const container = renderWithStore(<RooflineCard />, store);
        expect(container.innerHTML).toBe('');
    });

    it('renders both panels, the analytic badge and the roofs device', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_ROOFLINE, data: S4B });
        const container = renderWithStore(<RooflineCard />, store);

        // The honesty label is not optional decoration.
        expect(container.textContent).toContain('analytic');
        expect(container.textContent).toContain('not counters');
        expect(container.textContent).toContain('Apple M4');
        expect(container.textContent).toContain('GPU (Metal kernels)');
        expect(container.textContent).toContain('CPU (instruction roofline');
        expect(container.textContent).toContain('vector_sim_f32');
        // Roof annotations: bandwidth diagonal + fp32 ceiling.
        expect(container.textContent).toContain('105 GB/s');
        expect(container.textContent).toContain('3.5 TFLOP/s');
    });

    it('puts integer kernels on the bandwidth table, not the FLOP scatter', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_ROOFLINE, data: SSB_INT });
        const container = renderWithStore(<RooflineCard />, store);

        expect(container.textContent).toContain('bandwidth utilization');
        expect(container.textContent).toContain('fact_filter_pack_dense');
        expect(container.textContent).toContain('60.0 GB/s');
        // 60 / 105.2 of the measured roof.
        expect(container.textContent).toContain('57%');
        // No FLOP scatter and no CPU panel: neither has a point.
        expect(container.querySelectorAll('svg').length).toBe(0);
    });
});
