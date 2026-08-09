import { describe, it, expect, afterEach, vi } from 'vitest';
import React from 'react';
import * as model from '../src/model';
import { renderWithStore, cleanupDom } from './helpers';

// stub the chart cells: this test is about the dashboard's conditional layout,
// not the charts (which would spawn the wasm worker); the factory is hoisted,
// so React must be imported inside it
vi.mock('../src/components/charts/chart_wrapper', async () => {
    const ReactModule = await import('react');
    return {
        default: (props: { chartType: string }) =>
            ReactModule.default.createElement('div', { 'data-testid': `chart-${props.chartType}` }),
    };
});

import DashboardSingleEvent from '../src/components/dashboards/dashboard_single_event';

function tmamChartData(buckets: Array<number>): model.IChartDataKeyValue {
    return {
        7: model.createChartDataObject(7, {
            chartType: model.ChartType.SWIM_LANES_TMAM,
            data: { buckets, category: [], frequency: [] },
        }),
    };
}

describe('DashboardSingleEvent optional cells', () => {
    afterEach(cleanupDom);

    it('keeps the TMAM cell mounted before the TMAM result arrives', () => {
        const store = model.createStore();
        const container = renderWithStore(<DashboardSingleEvent />, store);
        expect(container.querySelector(`[data-testid="chart-${model.ChartType.SWIM_LANES_TMAM}"]`)).not.toBeNull();
    });

    it('collapses the TMAM cell when the loaded TMAM result is empty', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_CHART_DATA, data: tmamChartData([]) });
        const container = renderWithStore(<DashboardSingleEvent />, store);
        expect(container.querySelector(`[data-testid="chart-${model.ChartType.SWIM_LANES_TMAM}"]`)).toBeNull();
    });

    it('keeps the TMAM cell when the loaded TMAM result has rows', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_CHART_DATA, data: tmamChartData([0, 1, 2]) });
        const container = renderWithStore(<DashboardSingleEvent />, store);
        expect(container.querySelector(`[data-testid="chart-${model.ChartType.SWIM_LANES_TMAM}"]`)).not.toBeNull();
    });

    it('hides the Metal cell without dispatches and shows it with them', () => {
        const store = model.createStore();
        const container = renderWithStore(<DashboardSingleEvent />, store);
        expect(container.textContent).not.toContain('GPU consumer');

        store.dispatch({
            type: model.StateMutationType.SET_METAL_DISPATCHES,
            data: [{ run: 0, kernel: 'k', rel_start_ns: 0, dur_ns: 1_000_000 }],
        });
        expect(container.textContent).toContain('GPU consumer');
    });
});
