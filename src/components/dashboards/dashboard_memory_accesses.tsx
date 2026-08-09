import * as model from '../../model';
import * as Controller from '../../controller';
import ChartWrapper from '../charts/chart_wrapper';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

const cellItemClasses = "flex w-full flex-col items-center justify-center p-[7px]";
const chartContainerClasses = "flex h-full max-h-full min-h-0 max-w-full min-w-0 flex-col items-center justify-center";

interface Props {
    events: Array<string> | undefined;
    currentEvent: string,
}


class DashboardMemoryAccesses extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
        //switch current event to memory loads; fall back to the first available
        //event when the trace has no memory-load event (e.g. HeliosTrace files
        //only carry Cycles/gpu_time), otherwise every query filters to 0 rows
        if (props.events && !props.events.includes("mem_inst_retired.all_loads")) {
            Controller.setEvent(props.events[0]);
        } else {
            Controller.setEvent("mem_inst_retired.all_loads");
        }
    }

    componentDidUpdate(prevProps: Props) {
        //if events finish loading after mount and do not contain memory loads,
        //move off the missing event to the first available one
        if (
            !_.isEqual(prevProps.events, this.props.events)
            && this.props.events
            && !this.props.events.includes("mem_inst_retired.all_loads")) {
            Controller.setEvent(this.props.events[0])
        }
    }

    public render() {

        return <div className="flex w-full flex-wrap">
            <div className={`${cellItemClasses} order-1 w-full`}>
                <div className="box-border flex h-[84px] w-full flex-col justify-center rounded-[10px] bg-card p-[3px]">
                    <div className={chartContainerClasses}>
                        <ChartWrapper chartType={model.ChartType.BAR_CHART_ACTIVITY_HISTOGRAM} />
                    </div>
                </div>
            </div>

            <div className={`${cellItemClasses} order-2 w-full`}>
                <div className="box-border flex h-auto w-full flex-col justify-center rounded-[10px] bg-card p-[3px] pt-[5px] pb-[20px]">
                    <div className={chartContainerClasses}>
                        <ChartWrapper chartType={model.ChartType.MEMORY_ACCESS_HEATMAP_CHART} />
                    </div>
                </div>
            </div>
        </div>
    }

}

const mapStateToProps = (state: model.AppState) => ({
    events: state.events,
    currentEvent: state.currentEvent,
});

export default connect(mapStateToProps)(DashboardMemoryAccesses);
