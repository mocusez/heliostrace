import React from 'react';
import * as model from '../../model';
import ChartWrapper from '../charts/chart_wrapper';

const cellItemFixedContentClasses = "flex w-full flex-none flex-col items-center justify-center p-[7px]";
const cellItemStretchContentMedClasses = "flex w-full max-h-[700px] min-h-[200px] flex-[1_1_auto] flex-col items-center justify-center p-[7px]";
const chartContainerClasses = "flex h-full max-h-full min-h-0 max-w-full min-w-0 flex-col items-center justify-center";
const chartContainerStaticWidthSmallClasses = "max-[900px]:mx-auto max-[900px]:block max-[900px]:w-full max-[900px]:max-w-[500px]";
const chartBoxActivityHistogramClasses = "box-border flex h-[84px] w-full flex-col justify-center rounded-[10px] bg-card p-[3px]";
const chartBoxMainVisualizationsClasses = "box-border flex h-[200px] w-full flex-col justify-center rounded-[10px] bg-card p-[3px]";
const chartBoxStretchClasses = "box-border flex w-full flex-[1_1_0%] flex-col justify-center overflow-hidden rounded-[10px] bg-card p-[3px]";

class DashboardMultipleEvents extends React.Component {

    public render() {

        return <div className="flex w-full flex-[1_0_auto] flex-col">
            <div className={`${cellItemFixedContentClasses} order-1 w-full`}>
                <div className={chartBoxActivityHistogramClasses}>
                    <div className={chartContainerClasses}>
                        <ChartWrapper chartType={model.ChartType.BAR_CHART_ACTIVITY_HISTOGRAM} />
                    </div>
                </div>
            </div>


            <div className="order-2 flex w-full flex-wrap">
                <div className={`${cellItemFixedContentClasses} order-1 w-full md:w-6/12 lg:w-4/12`}>
                    <div className={chartBoxMainVisualizationsClasses}>
                        <div className={`${chartContainerClasses} ${chartContainerStaticWidthSmallClasses}`}>
                            <ChartWrapper chartType={model.ChartType.SUNBURST_CHART} />
                        </div>
                    </div>
                </div>
                <div className={`${cellItemFixedContentClasses} order-2 w-full md:w-6/12 lg:w-8/12`}>
                    <div className={chartBoxMainVisualizationsClasses}>
                        <div className={chartContainerClasses}>
                            <ChartWrapper chartType={model.ChartType.QUERY_PLAN} />
                        </div>
                    </div>
                </div>
            </div>


            <div className={`${cellItemStretchContentMedClasses} order-3 w-full`}>
                <div className={chartBoxStretchClasses}>
                    <div className={chartContainerClasses}>
                        <ChartWrapper chartType={model.ChartType.SWIM_LANES_COMBINED_MULTIPLE_PIPELINES_ABSOLUTE} />
                    </div>
                </div>
            </div>

        </div>
    }

}


export default DashboardMultipleEvents;
