import React from 'react';
import { connect } from 'react-redux';
import * as model from '../../model';
import ChartWrapper from '../charts/chart_wrapper';
import QuerySqlCard, { sqlOfPlan, uirProfilerAvailable } from './query_sql_card';

const cellItemFixedContentClasses = "flex w-full flex-none flex-col items-center justify-center p-[7px]";
const cellItemStretchContentUpdClasses = "flex w-full max-h-[1400px] min-h-[200px] flex-[1_1_auto] flex-col items-center justify-center p-[7px]";
const chartContainerClasses = "flex h-full max-h-full min-h-0 max-w-full min-w-0 flex-col items-center justify-center";
const chartBoxActivityHistogramClasses = "box-border flex h-[84px] w-full flex-col justify-center rounded-[10px] bg-card p-[3px]";
const chartBoxStretchClasses = "box-border flex w-full flex-[1_1_0%] flex-col justify-center overflow-hidden rounded-[10px] bg-card p-[3px]";

interface Props {
    queryplanJson: object | undefined;
}

type LeftTab = 'uir' | 'sql';

interface State {
    tab: LeftTab | undefined;  // undefined until the user picks; default derived
}

// The left box hosts the UIR profiler and the profiled SQL as two tabs of ONE
// surface (both are read-only Monaco panes with the same 11px code font).
// Which tabs exist follows the trace: non-JIT queries (plan uirLines == 0)
// have no UIR to profile, so only the SQL tab appears; packages predating the
// plan-root sql key have no SQL tab.
//
// Both panes stay MOUNTED; tabs only flip visibility on an absolutely-stacked
// pair. Unmounting is not an option: a remounted ChartWrapper allocates a
// fresh chartId whose data request only fires on an input-data change — after
// the initial load none ever comes, so the profiler would spin forever on
// return. visibility (not display:none) so the hidden pane keeps its real
// box: ChartWrapper's resize path reads offsetWidth, and a 0-width remeasure
// would stick.
class DashboardUir extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = { tab: undefined };
    }

    public render() {

        const hasUir = uirProfilerAvailable(this.props.queryplanJson);
        const hasSql = sqlOfPlan(this.props.queryplanJson) !== undefined;
        const tab: LeftTab = this.state.tab ?? (hasUir ? 'uir' : 'sql');

        const tabButton = (id: LeftTab, label: string) => {
            const active = tab === id;
            return <button
                key={id}
                onClick={() => this.setState({ tab: id })}
                className={"cursor-pointer border-0 bg-transparent px-[8px] font-['Segoe_UI'] text-[11px] font-bold "
                    + (active
                        ? "text-foreground underline decoration-2 underline-offset-4"
                        : "text-brand-tertiary")}
            >{label}</button>;
        };

        return <div className="flex w-full flex-[1_0_auto] flex-col">
            <div className={`${cellItemFixedContentClasses} order-1 w-full`}>
                <div className={chartBoxActivityHistogramClasses}>
                    <div className={chartContainerClasses}>
                        <ChartWrapper chartType={model.ChartType.BAR_CHART_ACTIVITY_HISTOGRAM} />
                    </div>
                </div>
            </div>

            <div className="max-h-[1400px] min-h-[200px] flex-1 order-2 flex w-full flex-wrap">
                <div className={`${cellItemStretchContentUpdClasses} order-2 lg:order-1 w-full lg:w-9/12`}>
                    <div className={chartBoxStretchClasses}>
                        {/* Non-JIT queries have no UIR tab and no explanatory
                            note — the absent tab IS the statement. */}
                        <div className="flex flex-row items-center justify-center pt-[2px]">
                            {hasUir && tabButton('uir', 'UIR Profiler')}
                            {hasSql && tabButton('sql', 'SQL')}
                        </div>
                        <div className={chartContainerClasses} style={{ position: 'relative' }}>
                            {hasUir &&
                                <div style={{ position: 'absolute', inset: 0,
                                              visibility: tab === 'uir' ? 'visible' : 'hidden' }}>
                                    <div className={chartContainerClasses}>
                                        <ChartWrapper chartType={model.ChartType.UIR_VIEWER} />
                                    </div>
                                </div>}
                            {hasSql &&
                                <div style={{ position: 'absolute', inset: 0,
                                              visibility: tab === 'sql' ? 'visible' : 'hidden' }}>
                                    <QuerySqlCard />
                                </div>}
                        </div>
                    </div>
                </div>
                <div className={`${cellItemStretchContentUpdClasses} order-1 lg:order-2 w-full lg:w-3/12`}>
                    <div className={chartBoxStretchClasses}>
                        <div className={chartContainerClasses}>
                            <ChartWrapper chartType={model.ChartType.QUERY_PLAN} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    }
}

const mapStateToProps = (state: model.AppState) => ({
    queryplanJson: state.queryplanJson,
});

export default connect(mapStateToProps)(DashboardUir);
