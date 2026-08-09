import * as model from '../../../model';
import * as Controller from '../../../controller';
import * as Context from '../../../app_context';
import React from 'react';
import { connect } from 'react-redux';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


interface Props {
    appContext: Context.IAppContext;
    memoryHeatmapsDifferenceRepresentation: boolean,
}

function HeatmapsDiffToggler(props: Props) {

    const handleHeatmapsDiffTogglerChange = (checked: boolean) => {
        Controller.handleHeatmapsDifferenceRepresentationSelection(checked);
        Controller.resetSelectionHeatmapsOutlierDetectionSelection();
    }

    return (
        <div className="mx-[5px]">
            <div className="m-0 flex items-center gap-2">
                <Label
                    className="align-middle text-[11px] text-brand-tertiary"
                    htmlFor="heatmaps-diff-toggler"
                >
                    Show Memory Access Differences:
                </Label>
                <Switch
                    id="heatmaps-diff-toggler"
                    checked={props.memoryHeatmapsDifferenceRepresentation}
                    onCheckedChange={handleHeatmapsDiffTogglerChange}
                    name="HeatmapsDiffToggler"
                    size="sm"
                />
            </div>
        </div>
    );
}

const mapStateToProps = (state: model.AppState) => ({
    memoryHeatmapsDifferenceRepresentation: state.memoryHeatmapsDifferenceRepresentation,
});


export default connect(mapStateToProps)(Context.withAppContext(HeatmapsDiffToggler));
