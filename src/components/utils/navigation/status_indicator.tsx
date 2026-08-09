import * as model from '../../../model';
import MiniSpinner from '../spinner/mini_spinner';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { CheckCircle2, AlertCircle } from 'lucide-react';


interface Props {
    fileLoading: boolean;
    file: undefined | File;
    resultLoading: model.IResultLoading;
    events: Array<string> | undefined;
    pipelines: Array<string> | undefined;
    operators: model.IOperatorsData | undefined;
    kpis: Array<model.IKpiData> | undefined;
    loadingChartReadableName: model.IResultLoadingReadableName;
}


function StatusIndicator(props: Props) {

    enum LoadingState {
        NO_FILE_SELECTED = 'NO_FILE_SELECTED',
        LOADING = 'LOADING',
        DONE = 'DONE',
    }

    const [isLoading, setIsLoading] = useState(LoadingState.NO_FILE_SELECTED);

    const truncateString = (text: string) => {
        const length = 20;
        return text.length > length ? text.substring(0, length - 1) + '...' : text;
    }

    const getCurrentStatusString = () => {
        const loading = isResultLoading();
        if (undefined === props.file && false === props.fileLoading) {
            if (isLoading !== LoadingState.NO_FILE_SELECTED) {
                setIsLoading(LoadingState.NO_FILE_SELECTED);
            }
            return "No file selected.";
        }
        if (true === props.fileLoading && props.file) {
            if (isLoading !== LoadingState.LOADING) {
                setIsLoading(LoadingState.LOADING);
            }
            return `Reading file... (${truncateString(props.file.name)})`;
        }

        if ((loading && props.resultLoading[-1] === true) ||
            undefined === props.events ||
            undefined === props.pipelines ||
            undefined === props.operators ||
            undefined === props.kpis) {
            if (isLoading !== LoadingState.LOADING) {
                setIsLoading(LoadingState.LOADING);
            }
            return "Fetching metadata..."
        }
        if (loading) {
            if (isLoading !== LoadingState.LOADING) {
                setIsLoading(LoadingState.LOADING);
            }
            return `Rendering "${getLoadingChartName()}"...`
        }
        if (!loading && Object.keys(props.resultLoading).length > 0 && props.file) {
            if (isLoading !== LoadingState.DONE) {
                setIsLoading(LoadingState.DONE);
            }
            return `Done. (${truncateString(props.file.name)})`;
        }
        return "Loading...";
    }

    const isResultLoading = () => {
        for (const resultId in props.resultLoading) {
            if (true === props.resultLoading[resultId]) {
                return true;
            }
        }
        return false;
    }

    const getLoadingChartName: () => model.ChartTypeReadable = () => {
        const currentLoadingIndex = Object.values(props.resultLoading).indexOf(true, 0) + 1;
        return props.loadingChartReadableName[currentLoadingIndex];
    }

    // const getCurrentStatusString = () => {
    //     return "Status: " + getCurrentStatus();
    // }

    const getCurrentStatusSymbol = () => {
        switch (isLoading) {
            case LoadingState.NO_FILE_SELECTED:
                return <AlertCircle className="size-5" />;
            case LoadingState.LOADING:
                return <MiniSpinner />;
            case LoadingState.DONE:
                return <CheckCircle2 className="size-5" />;
        }
    }

    return (
        <div className="flex basis-[300px] grow-0 shrink-0 items-center justify-end text-[11px] max-[650px]:basis-[50px]">
            <div className="flex items-center pr-[7px] max-[650px]:hidden">
                {getCurrentStatusString()}
            </div>
            <div className="flex items-center">
                {getCurrentStatusSymbol()}
            </div>
        </div>
    );
}

const mapStateToProps = (state: model.AppState) => ({
    file: state.file,
    fileLoading: state.fileLoading,
    resultLoading: state.resultLoading,
    events: state.events,
    pipelines: state.pipelines,
    operators: state.operators,
    kpis: state.kpis,
    loadingChartReadableName: state.loadingChartReadableName,
});


export default connect(mapStateToProps)(StatusIndicator);