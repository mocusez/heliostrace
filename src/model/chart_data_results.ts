import { ChartType } from '.';

export interface IChartDataKeyValue {
    [chartId: number]: IChartDataObject;
}

export interface IChartDataObject {
    readonly chartId: number;
    readonly chartData: ChartDataVariant;
}

export type ChartData<T, P> = {
    readonly chartType: T;
    readonly data: P;
};

export type ChartDataVariant =
    | ChartData<ChartType.BAR_CHART, IBarChartData>
    | ChartData<ChartType.SWIM_LANES_MULTIPLE_PIPELINES, ISwimlanesData>
    | ChartData<ChartType.SWIM_LANES_MULTIPLE_PIPELINES_ABSOLUTE, ISwimlanesData>
    | ChartData<ChartType.SWIM_LANES_TMAM, ISwimlanesTmamData>
    | ChartData<ChartType.SWIM_LANES_COMBINED_MULTIPLE_PIPELINES, ISwimlanesCombinedData>
    | ChartData<ChartType.SWIM_LANES_COMBINED_MULTIPLE_PIPELINES_ABSOLUTE, ISwimlanesCombinedData>
    | ChartData<ChartType.BAR_CHART_ACTIVITY_HISTOGRAM, IBarChartActivityHistogramData>
    | ChartData<ChartType.SUNBURST_CHART, ISunburstChartData>
    | ChartData<ChartType.MEMORY_ACCESS_HEATMAP_CHART, IMemoryAccessHeatmapChartData>
    | ChartData<ChartType.UIR_VIEWER, IUirViewerData>
    | ChartData<ChartType.QUERY_PLAN, IQueryPlanData>
    ;

export function createChartDataObject(chartId: number, chartData: ChartDataVariant): IChartDataObject {
    return {
        chartId: chartId,
        chartData: chartData,
    };
}

export interface IBarChartData {
    operators: Array<string>,
    frequency: Array<number>,
}

export interface ISwimlanesData {
    buckets: Array<number>,
    operators: Array<string>,
    operatorsNice: Array<string>,
    frequency: Array<number>,
}

export interface ISwimlanesTmamData {
    buckets: Array<number>,
    category: Array<string>,
    frequency: Array<number>,
}

export interface ISwimlanesCombinedData {
    buckets: Array<number>,
    operators: Array<string>,
    operatorsNice: Array<string>,
    frequency: Array<number>,
    bucketsNeg: Array<number>,
    operatorsNeg: Array<string>,
    operatorsNiceNeg: Array<string>,
    frequencyNeg: Array<number>,
}

export interface IBarChartActivityHistogramData {
    buckets: Array<number>,
    occurrences: Array<number>,
}

export interface ISunburstChartData {
    operator: Array<string>;
    pipeline: Array<string | null>;
    opOccurrences: Array<number | null>;
    pipeOccurrences: Array<number | null>;
}

export interface IMemoryAccessHeatmapChartSingleData {
    operator: Array<string>,
    buckets: Array<number>,
    memoryAdress: Array<number>,
    occurrences: Array<number>
}

export interface IMemoryAccessHeatmapChartDomainData {
    memoryDomain: {
        max: number,
        min: number
    },
    timeDomain: {
        max: number,
        min: number
    },
    frequencyDomain: {
        max: number,
        min: number
    },
    numberOperators: number,
}

export interface IMemoryAccessHeatmapChartData {
    domain: IMemoryAccessHeatmapChartDomainData,
    heatmapsData: Array<IMemoryAccessHeatmapChartSingleData>,
}

export interface IUirViewerData {
    uirLines: Array<string>;
    eventsFrequency: {
        [eventId: number]: Array<number>;
    }
    eventsRelativeFrequency: {
        [eventId: number]: Array<number>;
    }
    operators: Array<string>;
    pipelines: Array<string>;
    isFunction: Array<number>;
}

export interface IQueryPlanData {
    queryplanData: object | undefined;
    nodeTooltipData: IQueryPlanNodeTooltipData;
}
export interface IQueryPlanNodeTooltipData {
    uirLineNumbers: Array<number>;
    uirLines: Array<string>;
    eventOccurrences: Array<number>;
    operatorTotalFrequency: Array<number>;
    operators: Array<string>;
}

// Metal GPU dispatches (optional: absent traces have no metal.json, which is
// pushed to JS as an empty array rather than not sent at all). Not part of
// ChartDataVariant since it arrives as a one-shot push (like queryplanJson),
// not via the request/response chart-data query protocol.
export interface IMetalDispatch {
    run: number,
    kernel: string,
    rel_start_ns: number,
    dur_ns: number,
    // Present only on the ggml/llama inference lane (pgml.embed / predict /
    // generate). helios's own bulk-columnar kernels name themselves via
    // `kernel` and carry neither of these, and neither do traces packed before
    // the model-call attribution landed.
    kind?: string,
    model?: string,
    // Inputs the dispatch processed. ML lane: inputs of the model call. Engine
    // lane: rows, on kernels that report it (vector_sim_f32 since the
    // unified-Metal-context work); older traces omit it everywhere.
    items?: number,
}

// Analytic roofline (optional 7th member roofline.json). bytes/flops are
// call-site formulas (GPU) or scan-cardinality × tuple-width (CPU) — NOT
// hardware-counter measurements; times are measured dispatch residency /
// execute-phase wall time. One-shot push like metalDispatches.
export interface IRooflineGpuPoint {
    kernel: string,
    dispatches: number,
    bytes: number,           // per query (averaged over runs)
    flops: number,           // 0 on integer-only kernels
    dur_ns: number,
    achieved_gbs: number,
    intensity: number,       // flop/byte; 0 when flops == 0
    achieved_gflops?: number, // only when flops > 0
}

export interface IRooflineCpuPoint {
    label: string,
    instructions: number,    // measured (PMC deltas), execute phase only
    bytes: number,
    dur_ns: number,
    intensity_ipb: number,   // instructions/byte
    achieved_gips: number,
    achieved_gbs: number,
}

export interface IRooflineRoofs {
    probe?: string,
    version?: number,
    device?: string,
    cpu?: { bw_gbs: number, gips: number, threads?: number },
    gpu?: { bw_gbs: number, fp32_gflops: number },
}

export interface IRooflineData {
    analytic: boolean,
    gpu: Array<IRooflineGpuPoint>,
    cpu: Array<IRooflineCpuPoint>,
    roofs?: IRooflineRoofs,
}
