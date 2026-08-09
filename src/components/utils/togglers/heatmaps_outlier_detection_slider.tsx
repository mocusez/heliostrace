import * as model from '../../../model';
import * as Controller from '../../../controller';
import * as Context from '../../../app_context';
import React from 'react';
import { connect } from 'react-redux';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface Props {
    appContext: Context.IAppContext;
    memoryHeatmapsDifferenceRepresentation: boolean,
    currentHeatmapsOutlierDetection: model.HeatmapsOutlierDetectionDegrees,
}


function HeatmapsOutlierDetectionSlider(props: Props) {

    const getSliderValue = () => {
        return props.currentHeatmapsOutlierDetection;
    }

    const [value, setValue] = React.useState<model.HeatmapsOutlierDetectionDegrees>(getSliderValue());

    const valueText = (value: number): string => {
        const stepLables: { [outlierDetectionDegree: number]: string } = {
            0: "off",
            1: "very weak",
            2: "weak",
            3: "medium",
            4: "strong",
            5: "very strong",
        }
        return stepLables[value];
    }

    const handleChange = (newValue: number | readonly number[]) => {
        const singleValue = Array.isArray(newValue) ? newValue[0] : newValue;
        setValue(singleValue as model.HeatmapsOutlierDetectionDegrees);
    };

    const handleChangeCommitted = (newValue: number | readonly number[]) => {
        //commit changes of slider to redux after mouseup
        const singleValue = Array.isArray(newValue) ? newValue[0] : newValue;
        Controller.handleHeatmapsOutlierDetectionSelection(singleValue as model.HeatmapsOutlierDetectionDegrees);
    }


    return (
        <div className="mx-[5px]">
            <div className="m-0 flex items-center gap-2">
                <span className="align-middle text-[11px] text-brand-tertiary">
                    Outlier Detection Degree:
                </span>
                <Tooltip>
                    <TooltipTrigger render={<span className="flex grow items-center" />}>
                        <Slider
                            className="ml-[10px] w-[100px]"
                            value={[value]}
                            min={0}
                            max={5}
                            step={1}
                            onValueChange={handleChange}
                            onValueCommitted={handleChangeCommitted}
                        />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        {valueText(value)}
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}



const mapStateToProps = (state: model.AppState) => ({
    currentHeatmapsOutlierDetection: state.currentHeatmapsOutlierDetection,
    memoryHeatmapsDifferenceRepresentation: state.memoryHeatmapsDifferenceRepresentation,
});

export default connect(mapStateToProps)(Context.withAppContext(HeatmapsOutlierDetectionSlider));
