import React from 'react';
import { connect } from 'react-redux';
import * as model from '../../model';

interface Props {
    rooflineData: model.IRooflineData | undefined;
    metalDispatches: Array<model.IMetalDispatch> | undefined;
}

// One point on a log-log roofline panel.
interface PlotPoint {
    label: string;
    x: number;      // intensity (flop/byte or instr/byte)
    y: number;      // achieved rate (GFLOP/s or Ginstr/s)
    color: string;
}

// Same palette as the Metal card, and — for GPU kernels — the SAME color per
// kernel: rank by total GPU time from metalDispatches, exactly how the Metal
// card ranks its consumers, so a kernel keeps one color across both cards.
const CONSUMER_COLORS = ['#e07b39', '#4477aa', '#66a61e', '#8c5aa8', '#b3b3b3'];
const CPU_COLOR = '#2b7a78';

const PANEL_W = 340;
const PANEL_H = 220;
const MARGIN = { left: 46, right: 12, top: 14, bottom: 30 };

function fmtRate(v: number, unit: string): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1)} T${unit}`;
    if (v >= 10) return `${v.toFixed(0)} G${unit}`;
    return `${v.toFixed(1)} G${unit}`;
}

function fmtBytes(b: number): string {
    if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`;
    if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
    if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`;
    return `${b.toFixed(0)} B`;
}

// A log-log roofline panel: a bandwidth diagonal (y = bw·x) and a compute
// ceiling (y = peak), both optional (drawn only when roofs are known), plus
// the achieved points. Pure SVG — no chart library.
function RooflinePanel(props: {
    title: string;
    points: Array<PlotPoint>;
    bw?: number;            // GB/s -> diagonal
    peak?: number;          // GFLOP/s or Gips -> ceiling
    xUnit: string;          // "flop/B" | "instr/B"
    yUnit: string;          // "FLOP/s" | "instr/s"
}) {
    const { points, bw, peak } = props;
    if (points.length === 0) return null;

    // Log domains padded around data; roofs pull the y-domain up so the
    // ceiling is visible, and the ridge x = peak/bw stays in frame.
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    let xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    let yMax = Math.max(...ys);
    if (peak !== undefined) yMax = Math.max(yMax, peak);
    if (bw !== undefined && peak !== undefined) {
        const ridge = peak / bw;
        xMin = Math.min(xMin, ridge);
        xMax = Math.max(xMax, ridge);
    }
    const lx0 = Math.floor(Math.log10(xMin) - 0.35);
    const lx1 = Math.ceil(Math.log10(xMax) + 0.35);
    const ly0 = Math.floor(Math.log10(yMin) - 0.35);
    const ly1 = Math.ceil(Math.log10(yMax) + 0.2);

    const plotW = PANEL_W - MARGIN.left - MARGIN.right;
    const plotH = PANEL_H - MARGIN.top - MARGIN.bottom;
    const px = (x: number) =>
        MARGIN.left + ((Math.log10(x) - lx0) / (lx1 - lx0)) * plotW;
    const py = (y: number) =>
        MARGIN.top + plotH - ((Math.log10(y) - ly0) / (ly1 - ly0)) * plotH;

    // Bandwidth diagonal clipped to the plot: y = bw * x on log axes is a
    // straight segment between the domain intersections.
    let bwSeg: { x1: number, y1: number, x2: number, y2: number } | undefined;
    if (bw !== undefined) {
        const yCap = peak !== undefined ? Math.min(peak, Math.pow(10, ly1)) : Math.pow(10, ly1);
        const xa = Math.max(Math.pow(10, lx0), Math.pow(10, ly0) / bw);
        const xb = Math.min(Math.pow(10, lx1), yCap / bw);
        if (xb > xa) bwSeg = { x1: px(xa), y1: py(bw * xa), x2: px(xb), y2: py(bw * xb) };
    }
    let peakSeg: { x1: number, x2: number, y: number } | undefined;
    if (peak !== undefined) {
        const xa = bw !== undefined ? Math.max(Math.pow(10, lx0), peak / bw) : Math.pow(10, lx0);
        peakSeg = { x1: px(xa), x2: px(Math.pow(10, lx1)), y: py(peak) };
    }

    const decades = (a: number, b: number) => {
        const out: Array<number> = [];
        for (let d = a; d <= b; ++d) out.push(d);
        return out;
    };
    const fmtPow = (d: number) =>
        d === 0 ? '1' : d === 1 ? '10' : d === -1 ? '0.1' : `1e${d}`;

    return (
        <div>
            <div style={{ fontSize: '12px', fontWeight: 600, margin: '6px 0 0 4px' }}>
                {props.title}
            </div>
            <svg width={PANEL_W} height={PANEL_H} style={{ display: 'block' }}>
                {/* grid + axis labels at decade ticks */}
                {decades(lx0, lx1).map(d => (
                    <g key={`x${d}`}>
                        <line x1={px(Math.pow(10, d))} x2={px(Math.pow(10, d))}
                              y1={MARGIN.top} y2={MARGIN.top + plotH}
                              stroke="#e8e8e8" />
                        <text x={px(Math.pow(10, d))} y={MARGIN.top + plotH + 14}
                              textAnchor="middle" fontSize="9" fill="#888">
                            {fmtPow(d)}
                        </text>
                    </g>
                ))}
                {decades(ly0, ly1).map(d => (
                    <g key={`y${d}`}>
                        <line y1={py(Math.pow(10, d))} y2={py(Math.pow(10, d))}
                              x1={MARGIN.left} x2={MARGIN.left + plotW}
                              stroke="#e8e8e8" />
                        <text x={MARGIN.left - 4} y={py(Math.pow(10, d)) + 3}
                              textAnchor="end" fontSize="9" fill="#888">
                            {fmtPow(d)}
                        </text>
                    </g>
                ))}
                <text x={MARGIN.left + plotW / 2} y={PANEL_H - 2} textAnchor="middle"
                      fontSize="9" fill="#666">{props.xUnit} (log)</text>
                <text x={10} y={MARGIN.top + plotH / 2} textAnchor="middle" fontSize="9"
                      fill="#666" transform={`rotate(-90 10 ${MARGIN.top + plotH / 2})`}>
                    G{props.yUnit} (log)
                </text>

                {/* roofs */}
                {bwSeg &&
                    <line {...bwSeg} stroke="#666" strokeWidth={1.5} />}
                {peakSeg &&
                    <line x1={peakSeg.x1} x2={peakSeg.x2} y1={peakSeg.y} y2={peakSeg.y}
                          stroke="#666" strokeWidth={1.5} />}
                {bw !== undefined && bwSeg &&
                    <text x={bwSeg.x1 + 6} y={bwSeg.y1 - 8} fontSize="9" fill="#666"
                          transform={`rotate(${-Math.atan2(bwSeg.y1 - bwSeg.y2, bwSeg.x2 - bwSeg.x1) * 180 / Math.PI} ${bwSeg.x1 + 6} ${bwSeg.y1 - 8})`}>
                        {bw.toFixed(0)} GB/s
                    </text>}
                {peak !== undefined && peakSeg &&
                    <text x={peakSeg.x2 - 4} y={peakSeg.y - 4} textAnchor="end"
                          fontSize="9" fill="#666">
                        {fmtRate(peak, props.yUnit)}
                    </text>}

                {/* achieved points */}
                {points.map(p => (
                    <g key={p.label}>
                        <circle cx={px(p.x)} cy={py(p.y)} r={4} fill={p.color}>
                            <title>{`${p.label}: ${p.x.toFixed(2)} ${props.xUnit}, ${fmtRate(p.y, props.yUnit)}`}</title>
                        </circle>
                        <text x={px(p.x) + 6} y={py(p.y) - 5} fontSize="9" fill="#444">
                            {p.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

// Analytic roofline card (roofline.json). GPU kernels with flops land on a
// classic FLOP roofline; integer-only kernels (flops = 0) have no meaningful
// intensity and are shown as bandwidth-utilization bars instead. The CPU point
// is an instruction roofline (measured PMC instructions vs analytic scanned
// bytes). Renders nothing when the trace has no roofline.json.
class RooflineCard extends React.Component<Props> {

    // Metal-card color parity: rank kernels by total GPU time.
    gpuColorOf(): Map<string, string> {
        const totals = new Map<string, number>();
        (this.props.metalDispatches || []).forEach(d => {
            totals.set(d.kernel, (totals.get(d.kernel) || 0) + d.dur_ns);
        });
        const ranked = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
        const colorOf = new Map<string, string>();
        ranked.forEach(([k], i) =>
            colorOf.set(k, CONSUMER_COLORS[Math.min(i, CONSUMER_COLORS.length - 1)]));
        return colorOf;
    }

    public render() {
        const rl = this.props.rooflineData;
        if (!rl || (!rl.gpu?.length && !rl.cpu?.length)) return null;

        const colorOf = this.gpuColorOf();
        const colorFor = (k: string, i: number) =>
            colorOf.get(k) || CONSUMER_COLORS[Math.min(i, CONSUMER_COLORS.length - 1)];

        const gpuFlopPts: Array<PlotPoint> = (rl.gpu || [])
            .filter(p => p.flops > 0 && p.achieved_gflops !== undefined)
            .map((p, i) => ({
                label: p.kernel, x: p.intensity, y: p.achieved_gflops as number,
                color: colorFor(p.kernel, i),
            }));
        const gpuBwOnly = (rl.gpu || []).filter(p => !(p.flops > 0));
        const cpuPts: Array<PlotPoint> = (rl.cpu || []).map(p => ({
            label: p.label, x: p.intensity_ipb, y: p.achieved_gips, color: CPU_COLOR,
        }));

        const gpuBwRoof = rl.roofs?.gpu?.bw_gbs;
        const cell: React.CSSProperties = { padding: '2px 8px 2px 0', fontSize: '12px' };
        const num: React.CSSProperties = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' };

        return (
            <div className="flex h-full max-h-full min-h-0 max-w-full min-w-0 flex-col">
                <div style={{ padding: '12px', width: '100%', boxSizing: 'border-box',
                              overflowX: 'auto' }}>
                    <h4 style={{ margin: '0 0 2px 0' }}>
                        Roofline
                        <span style={{ fontSize: '10px', fontWeight: 400, color: '#888',
                                       border: '1px solid #ccc', borderRadius: '3px',
                                       padding: '0 4px', marginLeft: '6px',
                                       verticalAlign: 'middle' }}>
                            analytic
                        </span>
                    </h4>
                    <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                        bytes/flops from kernel formulas and scan widths, not counters;
                        times are measured{rl.roofs?.device ? ` · roofs: ${rl.roofs.device}` : ''}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        <RooflinePanel title="GPU (Metal kernels)" points={gpuFlopPts}
                                       bw={gpuBwRoof} peak={rl.roofs?.gpu?.fp32_gflops}
                                       xUnit="flop/B" yUnit="FLOP/s" />
                        <RooflinePanel title="CPU (instruction roofline, execute phase)"
                                       points={cpuPts} bw={rl.roofs?.cpu?.bw_gbs}
                                       peak={rl.roofs?.cpu?.gips}
                                       xUnit="instr/B" yUnit="instr/s" />
                    </div>

                    {gpuBwOnly.length > 0 && <>
                        <h4 style={{ margin: '10px 0 4px 0', fontSize: '13px' }}>
                            Integer kernels — bandwidth utilization
                        </h4>
                        <table style={{ borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ fontSize: '11px', color: '#666', textAlign: 'left' }}>
                                    <th style={cell}>kernel</th>
                                    <th style={cell}></th>
                                    <th style={num}>achieved</th>
                                    <th style={num}>bytes/query</th>
                                    {gpuBwRoof !== undefined && <th style={num}>of roof</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {gpuBwOnly
                                    .slice()
                                    .sort((a, b) => b.achieved_gbs - a.achieved_gbs)
                                    .map((p, i) => {
                                        const share = gpuBwRoof
                                            ? Math.min(p.achieved_gbs / gpuBwRoof, 1)
                                            : undefined;
                                        return (
                                            <tr key={p.kernel}>
                                                <td style={{ ...cell, maxWidth: '220px' }}>
                                                    <span style={{ display: 'inline-block', width: '8px',
                                                                   height: '8px', marginRight: '5px',
                                                                   background: colorFor(p.kernel, i) }} />
                                                    {p.kernel}
                                                </td>
                                                <td style={{ ...cell, width: '160px' }}>
                                                    <div style={{ background: '#eeeeee', height: '10px' }}>
                                                        <div style={{
                                                            width: `${(share !== undefined ? share : 1) * 100}%`,
                                                            background: colorFor(p.kernel, i),
                                                            height: '100%' }} />
                                                    </div>
                                                </td>
                                                <td style={num}>{p.achieved_gbs.toFixed(1)} GB/s</td>
                                                <td style={num}>{fmtBytes(p.bytes)}</td>
                                                {gpuBwRoof !== undefined &&
                                                    <td style={num}>{share !== undefined
                                                        ? `${(share * 100).toFixed(0)}%` : '—'}</td>}
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </>}
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: model.AppState) => ({
    rooflineData: state.rooflineData,
    metalDispatches: state.metalDispatches,
});

export default connect(mapStateToProps)(RooflineCard);
