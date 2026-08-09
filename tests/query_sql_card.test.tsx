import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import * as model from '../src/model';
import QuerySqlCard, { sqlOfPlan, uirProfilerAvailable } from '../src/components/dashboards/query_sql_card';
import { renderWithStore, cleanupDom, waitFor } from './helpers';

// The plan payload's root-level annotations (helios trace.cpp / pack):
// "sql" = the statement being profiled, "uirLines" = uir.json's line count.
// Both are optional — packages predating them must keep the old behaviour.

const SQL = "SELECT p_name\nFROM part\nORDER BY pgml.cosine_similarity(pv_embedding, qe) DESC\nLIMIT 10;";

describe('QuerySqlCard', () => {
    afterEach(cleanupDom);

    it('renders nothing without a plan or without a sql key', () => {
        const store = model.createStore();
        let container = renderWithStore(<QuerySqlCard />, store);
        expect(container.innerHTML).toBe('');

        cleanupDom();
        store.dispatch({ type: model.StateMutationType.SET_QUERYPLAN_JSON,
                         data: { operator: 'sort', input: 0 } });
        container = renderWithStore(<QuerySqlCard />, store);
        expect(container.innerHTML).toBe('');
    });

    it('shows the statement when the plan carries one', async () => {
        const store = model.createStore();
        store.dispatch({ type: model.StateMutationType.SET_QUERYPLAN_JSON,
                         data: { operator: 'sort', input: 0, sql: SQL } });
        const container = renderWithStore(
            <div style={{ height: 300 }}><QuerySqlCard /></div>, store);
        // The statement renders inside a real (read-only) Monaco editor — the
        // same locally-bundled instance the UIR profiler uses — so the text
        // arrives asynchronously once the editor mounts.
        await waitFor(() =>
            (container.textContent ?? '').includes('cosine_similarity')
            && (container.textContent ?? '').includes('LIMIT'));
        expect(container.querySelector('.monaco-editor')).not.toBeNull();
    });
});

describe('uirProfilerAvailable', () => {
    it('drops the profiler only on an explicit uirLines of 0', () => {
        // Non-JIT trace: pack counted zero UIR lines.
        expect(uirProfilerAvailable({ uirLines: 0 })).toBe(false);
        // JIT trace with UIR.
        expect(uirProfilerAvailable({ uirLines: 1704 })).toBe(true);
        // Packages predating the annotation keep the old behaviour.
        expect(uirProfilerAvailable({ operator: 'sort' })).toBe(true);
        expect(uirProfilerAvailable(undefined)).toBe(true);
    });
});

describe('sqlOfPlan', () => {
    it('accepts only a non-empty string', () => {
        expect(sqlOfPlan({ sql: SQL })).toBe(SQL);
        expect(sqlOfPlan({ sql: '   ' })).toBeUndefined();
        expect(sqlOfPlan({ sql: 42 })).toBeUndefined();
        expect(sqlOfPlan({})).toBeUndefined();
        expect(sqlOfPlan(undefined)).toBeUndefined();
    });
});
