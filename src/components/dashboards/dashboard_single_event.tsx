import React from 'react';
import * as model from '../../model';
import ChartWrapper from '../charts/chart_wrapper';
import MetalDispatchesCard from './metal_dispatches_card';
import RooflineCard from './roofline_card';
import { connect } from 'react-redux';

const cellItemClasses = "flex w-full flex-col items-center justify-center p-[7px]";
const chartContainerClasses = "flex h-full max-h-full min-h-0 max-w-full min-w-0 flex-col items-center justify-center";
const chartContainerStaticWidthSmallClasses = "max-[900px]:mx-auto max-[900px]:block max-[900px]:w-full max-[900px]:max-w-[500px]";
const chartBoxActivityHistogramClasses = "box-border flex h-[84px] w-full flex-col justify-center rounded-[10px] bg-card p-[3px]";
const chartBoxMainVisualizationsClasses = "box-border flex h-[200px] w-full flex-col justify-center rounded-[10px] bg-card p-[3px]";
// Self-sized cards (Metal, Roofline) render tables/plots of intrinsic height;
// the fixed 200px box silently clipped them (the Metal timeline and the
// roofline axes were cut off — screenshots for the paper caught it).
const chartBoxSelfSizedClasses = "box-border flex w-full flex-col justify-center rounded-[10px] bg-card p-[3px]";
const chartBoxDoublerowVisualizationsClasses = "box-border flex h-[400px] w-full flex-[1_1_0%] flex-col justify-center rounded-[10px] bg-card p-[3px] max-[1200px]:max-h-[200px] max-[1200px]:min-h-[200px]";

interface Props {
    metalDispatches: Array<model.IMetalDispatch> | undefined;
    rooflineData: model.IRooflineData | undefined;
    chartData: model.IChartDataKeyValue;
}

class DashboardSingleEvent extends React.Component<Props> {

    // TMAM is optional (HeliosTrace writes a header-only tmam.csv). The cell
    // must stay mounted until the response arrives (ChartWrapper issues the
    // request), then collapse when the trace turns out to have no TMAM rows.
    tmamKnownEmpty(): boolean {
        return Object.values(this.props.chartData).some(elem =>
            elem.chartData.chartType === model.ChartType.SWIM_LANES_TMAM
            && (elem.chartData.data as model.ISwimlanesTmamData).buckets.length === 0);
    }

    public render() {

        return <div className="flex w-full flex-wrap">

            <div className={`${cellItemClasses} order-1 w-full`}>
                <div className={chartBoxActivityHistogramClasses}>
                    <div className={chartContainerClasses}>
                        <ChartWrapper chartType={model.ChartType.BAR_CHART_ACTIVITY_HISTOGRAM} />
                    </div>
                </div>
            </div>

            <div className={`${cellItemClasses} order-2 w-full md:w-6/12 lg:w-4/12`}>
                <div className={chartBoxMainVisualizationsClasses}>
                    <div className={`${chartContainerClasses} ${chartContainerStaticWidthSmallClasses}`}>
                        <ChartWrapper chartType={model.ChartType.BAR_CHART} />
                    </div>
                </div>
            </div>
            <div className={`${cellItemClasses} order-4 lg:order-3 w-full lg:w-8/12`}>
                <div className={chartBoxMainVisualizationsClasses}>
                    <div className={chartContainerClasses}>
                        <ChartWrapper chartType={model.ChartType.QUERY_PLAN} />
                    </div>
                </div>
            </div>

            <div className={`${cellItemClasses} max-h-[430px] min-h-[200px] flex-[1_1_0%] order-3 lg:order-4 w-full md:w-6/12 lg:w-4/12`}>
                <div className={chartBoxDoublerowVisualizationsClasses}>
                    <div className={`${chartContainerClasses} ${chartContainerStaticWidthSmallClasses}`}>
                        <ChartWrapper chartType={model.ChartType.SUNBURST_CHART} />
                    </div>
                </div>
            </div>
            <div className="max-h-[430px] order-5 flex w-full flex-col lg:w-8/12">
                <div className={cellItemClasses}>
                    <div className={chartBoxMainVisualizationsClasses}>
                        <div className={chartContainerClasses}>
                            <ChartWrapper chartType={model.ChartType.SWIM_LANES_MULTIPLE_PIPELINES} />
                        </div>
                    </div>
                </div>
                <div className={cellItemClasses}>
                    <div className={chartBoxMainVisualizationsClasses}>
                        <div className={chartContainerClasses}>
                            <ChartWrapper chartType={model.ChartType.SWIM_LANES_MULTIPLE_PIPELINES_ABSOLUTE} />
                        </div>
                    </div>
                </div>
            </div>

            {!this.tmamKnownEmpty() &&
                <div className={`${cellItemClasses} order-6 w-full`}>
                    <div className={chartBoxMainVisualizationsClasses}>
                        <div className={chartContainerClasses}>
                            <ChartWrapper chartType={model.ChartType.SWIM_LANES_TMAM} />
                        </div>
                    </div>
                </div>
            }

            {/* Metal GPU view (M5): only rendered when the trace has metal.json */}
            {this.props.metalDispatches && this.props.metalDispatches.length > 0 &&
                <div className={`${cellItemClasses} order-7 w-full`}>
                    <div className={chartBoxSelfSizedClasses}>
                        <MetalDispatchesCard />
                    </div>
                </div>
            }

            {/* Analytic roofline: only rendered when the trace has roofline.json */}
            {this.props.rooflineData &&
                <div className={`${cellItemClasses} order-8 w-full`}>
                    <div className={chartBoxSelfSizedClasses}>
                        <RooflineCard />
                    </div>
                </div>
            }

        </div>
    }
}

const mapStateToProps = (state: model.AppState) => ({
    metalDispatches: state.metalDispatches,
    rooflineData: state.rooflineData,
    chartData: state.chartData,
});

export default connect(mapStateToProps)(DashboardSingleEvent);
