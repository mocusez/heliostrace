import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import React from 'react';
import * as model from '../src/model';
import { renderWithStore, cleanupDom } from './helpers';

// the memory dashboard only calls Controller.setEvent; mocking the controller
// module keeps the wasm worker (pulled in via request_controller) out of the test
const { setEventSpy } = vi.hoisted(() => ({ setEventSpy: vi.fn() }));
vi.mock('../src/controller', () => ({
    setEvent: setEventSpy,
}));

vi.mock('../src/components/charts/chart_wrapper', async () => {
    const ReactModule = await import('react');
    return {
        default: (props: { chartType: string }) =>
            ReactModule.default.createElement('div', { 'data-testid': `chart-${props.chartType}` }),
    };
});

import DashboardMemoryAccesses from '../src/components/dashboards/dashboard_memory_accesses';

describe('DashboardMemoryAccesses event selection', () => {
    beforeEach(() => setEventSpy.mockClear());
    afterEach(cleanupDom);

    it('falls back to the first available event when the trace has no memory-load event', () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_EVENTS, data: ['Cycles', 'gpu_time'] });
        renderWithStore(<DashboardMemoryAccesses />, store);
        expect(setEventSpy).toHaveBeenCalledWith('Cycles');
        expect(setEventSpy).not.toHaveBeenCalledWith('mem_inst_retired.all_loads');
    });

    it('uses the memory-load event when the trace provides it', () => {
        const store = model.createStore();
        store.dispatch({
            type: model.StateMutationType.SET_EVENTS,
            data: ['Cycles', 'mem_inst_retired.all_loads'],
        });
        renderWithStore(<DashboardMemoryAccesses />, store);
        expect(setEventSpy).toHaveBeenCalledWith('mem_inst_retired.all_loads');
    });

    it('moves off the missing event once events finish loading after mount', () => {
        const store = model.createStore();
        renderWithStore(<DashboardMemoryAccesses />, store);
        expect(setEventSpy).toHaveBeenCalledWith('mem_inst_retired.all_loads');

        store.dispatch({ type: model.StateMutationType.SET_EVENTS, data: ['Cycles', 'gpu_time'] });
        expect(setEventSpy).toHaveBeenCalledWith('Cycles');
    });
});
