import React from 'react';
import { connect } from 'react-redux';
import * as model from '../../model';

interface Props {
    metalDispatches: Array<model.IMetalDispatch> | undefined;
    kpis: Array<model.IKpiData> | undefined;
}

// A row of the summary table: one GPU consumer, aggregated over every run.
interface Consumer {
    label: string;       // "embed(qe)" or an MSL kernel name
    detail: string;      // what it is, in words
    isModel: boolean;    // ggml/llama inference lane (kind/model present)
    dispatches: number;
    totalNs: number;
    // Per-invocation input count. Shown only when every interval of the
    // consumer carries the same value — a mix has no single honest number, so
    // it renders as '—' instead of silently picking one.
    items?: number;
}

// Stable per-consumer colors, assigned by GPU-time rank. The table rows double
// as the legend: each carries its chip, and the timeline bars reuse the same
// color, so a fused query reads as "which engine owned which stretch of GPU".
const CONSUMER_COLORS = ['#e07b39', '#4477aa', '#66a61e', '#8c5aa8', '#b3b3b3'];

// Metal GPU view. Two lanes reach this: helios's own bulk-columnar kernels
// (label = the MSL function) and the ggml/llama inference lane behind
// pgml.embed / pgml.predict / pgml.generate (label = "kind(model)", plus an
// item count). Renders nothing when the trace has no metal.json, so traces that
// never touched the GPU are unaffected.
class MetalDispatchesCard extends React.Component<Props> {

    formatMs(ns: number): string {
        const ms = ns / 1e6;
        if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
        if (ms >= 10) return `${ms.toFixed(0)} ms`;
        return `${ms.toFixed(2)} ms`;
    }

    // Query wall time for ONE iteration, in ms. The sample timeline is folded —
    // every loop iteration is laid over the same window — so max(time) is a
    // single iteration, and GPU time must be divided by the run count to match.
    queryMs(): number | undefined {
        const kpi = this.props.kpis?.find(k => k.id === "execTime");
        if (!kpi) return undefined;
        const v = Number(Array.isArray(kpi.value) ? kpi.value[0] : kpi.value);
        return Number.isFinite(v) && v > 0 ? v : undefined;
    }

    public render() {
        const dispatches = this.props.metalDispatches;
        if (!dispatches || dispatches.length === 0) {
            return null;
        }

        const runs = new Set(dispatches.map(d => d.run));
        const nRuns = Math.max(runs.size, 1);

        const byLabel = new Map<string, Consumer>();
        dispatches.forEach(d => {
            const label = d.kernel;
            let c = byLabel.get(label);
            if (!c) {
                c = {
                    label,
                    detail: d.kind && d.model
                        ? `${d.kind} via model '${d.model}'`
                        : 'helios Metal kernel',
                    isModel: !!(d.kind && d.model),
                    dispatches: 0,
                    totalNs: 0,
                    items: d.items,
                };
                byLabel.set(label, c);
            } else if (c.items !== d.items) {
                c.items = undefined;
            }
            c.dispatches += 1;
            c.totalNs += d.dur_ns;
        });
        const consumers = Array.from(byLabel.values()).sort((a, b) => b.totalNs - a.totalNs);
        const colorOf = new Map<string, string>();
        consumers.forEach((c, i) =>
            colorOf.set(c.label, CONSUMER_COLORS[Math.min(i, CONSUMER_COLORS.length - 1)]));

        // Model inference AND database kernels in one trace can only come from
        // the unified-Metal-context engine: since its M1, registering a model
        // adopts the database's MTLCommandQueue (and refuses to register at all
        // once ggml has a queue of its own), and the database's sim kernel —
        // the only engine kernel these queries dispatch — postdates that. So a
        // mixed trace implies one shared queue; no per-dispatch queue id needed.
        const fused = consumers.some(c => c.isModel) && consumers.some(c => !c.isModel);

        const totalNs = consumers.reduce((s, c) => s + c.totalNs, 0);
        const perRunMs = totalNs / 1e6 / nRuns;
        const queryMs = this.queryMs();
        const share = queryMs ? Math.min(perRunMs / queryMs, 1) : undefined;

        // Timeline of the run with the most dispatches, on the folded timeline.
        const byRun = new Map<number, Array<model.IMetalDispatch>>();
        dispatches.forEach(d => {
            const arr = byRun.get(d.run) || [];
            arr.push(d);
            byRun.set(d.run, arr);
        });
        let timelineRun = dispatches[0].run;
        let best = 0;
        byRun.forEach((arr, run) => {
            if (arr.length > best) { best = arr.length; timelineRun = run; }
        });
        const timeline = (byRun.get(timelineRun) || [])
            .slice()
            .sort((a, b) => a.rel_start_ns - b.rel_start_ns);
        // Scale the timeline to the query window when we know it, so the GPU
        // bars sit where they actually happened rather than being stretched to
        // fill the width — the gap before the first dispatch is information.
        const spanNs = queryMs
            ? queryMs * 1e6
            : timeline.reduce((m, d) => Math.max(m, d.rel_start_ns + d.dur_ns), 1);

        const maxNs = consumers.length > 0 ? consumers[0].totalNs : 1;
        const cell: React.CSSProperties = { padding: '2px 8px 2px 0', fontSize: '12px' };
        const num: React.CSSProperties = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' };

        return (
            <div className="flex h-full max-h-full min-h-0 max-w-full min-w-0 flex-col">
                {/* border-box on purpose: with content-box the 12px padding is
                    added to width:100%, pushing the last column and the right
                    timeline label past the edge where they are silently
                    clipped rather than scrolled. */}
                <div style={{ padding: '12px', width: '100%', boxSizing: 'border-box',
                              overflowX: 'auto' }}>
                    <h4 style={{ margin: '0 0 2px 0' }}>Metal GPU</h4>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                        {share !== undefined
                            ? <>
                                <b>{(share * 100).toFixed(1)}%</b> of the query ran on the GPU
                                {' '}— {perRunMs.toFixed(1)} ms of {queryMs!.toFixed(1)} ms
                              </>
                            : <>{perRunMs.toFixed(1)} ms of GPU time per query</>}
                        {nRuns > 1 && <> · averaged over {nRuns} runs</>}
                        {fused && <div style={{ marginTop: '2px' }}>
                            database kernels and model inference share one Metal queue
                        </div>}
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ fontSize: '11px', color: '#666', textAlign: 'left' }}>
                                <th style={cell}>GPU consumer</th>
                                <th style={cell}></th>
                                <th style={num}>per query</th>
                                <th style={num}>dispatches</th>
                                <th style={num}>items</th>
                                {/* "dispatches" is the total across every run;
                                    per-run it would read as a fraction. */}
                            </tr>
                        </thead>
                        <tbody>
                            {consumers.map(c => (
                                <tr key={c.label}>
                                    <td style={{ ...cell, maxWidth: '240px' }} title={c.label}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {/* The chip is the legend for the timeline below. */}
                                            <span style={{ display: 'inline-block', width: '8px', height: '8px',
                                                           background: colorOf.get(c.label), marginRight: '5px' }} />
                                            {c.label}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#888' }}>{c.detail}</div>
                                    </td>
                                    <td style={{ ...cell, width: '35%' }}>
                                        <div style={{ background: '#eeeeee', height: '12px', position: 'relative' }}>
                                            <div style={{ width: `${(c.totalNs / maxNs) * 100}%`, background: colorOf.get(c.label), height: '100%' }} />
                                        </div>
                                    </td>
                                    <td style={num}>{this.formatMs(c.totalNs / nRuns)}</td>
                                    <td style={num}>{c.dispatches}</td>
                                    <td style={num}>{c.items !== undefined ? c.items.toLocaleString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h4 style={{ margin: '16px 0 4px 0', fontSize: '13px' }}>
                        When the GPU was busy (run {timelineRun})
                    </h4>
                    <div style={{ position: 'relative', height: '20px', background: '#eeeeee' }}>
                        {timeline.map((d, i) => (
                            <div
                                key={i}
                                title={`${d.kernel}: ${this.formatMs(d.dur_ns)} at ${(d.rel_start_ns / 1e6).toFixed(1)} ms`}
                                style={{
                                    position: 'absolute',
                                    left: `${Math.min((d.rel_start_ns / spanNs) * 100, 100)}%`,
                                    width: `${Math.max((d.dur_ns / spanNs) * 100, 0.4)}%`,
                                    top: 0,
                                    bottom: 0,
                                    // Same color as the consumer's table row, so a
                                    // fused query shows which engine owned each stretch.
                                    // The seam keeps back-to-back dispatches of one
                                    // consumer (the old alternating colors' only job)
                                    // countable without stealing width from thin bars.
                                    background: colorOf.get(d.kernel),
                                    boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.65)',
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#888' }}>
                        <span>0 ms</span>
                        <span title={queryMs ? 'the full query window' : undefined}>
                            {(spanNs / 1e6).toFixed(0)} ms
                        </span>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: model.AppState) => ({
    metalDispatches: state.metalDispatches,
    kpis: state.kpis,
});

export default connect(mapStateToProps)(MetalDispatchesCard);
