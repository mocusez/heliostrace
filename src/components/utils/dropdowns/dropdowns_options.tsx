import * as model from '../../../model';
import React from 'react';
import InterpolationDropdown from './interpolation_dropdown';
import BucketsizeDropdwn from './bucketsize_dropdown';
import { connect } from 'react-redux';

interface Props {
    currentView: model.ViewType;
}

function DropdownsOptions(props: Props) {

    const isDropdownDisabled = (dropdownType: "interpolationDropdown" | "bucketsizeDropdown") => {
        if(dropdownType === "interpolationDropdown" && props.currentView === model.ViewType.DASHBOARD_MEMORY_BEHAVIOR){
            return true;
        }
        if (props.currentView === model.ViewType.DASHBOARD_UIR_PROFILING) {
            return true;
        }
        return false;
    }

    return <div className="flex h-full flex-row items-center justify-center">
        <InterpolationDropdown disabled={isDropdownDisabled("interpolationDropdown")} />
        <BucketsizeDropdwn disabled={isDropdownDisabled("bucketsizeDropdown")} />
    </div>

}

const mapStateToProps = (state: model.AppState) => ({
    currentView: state.currentView,
});

export default connect(mapStateToProps)(DropdownsOptions);