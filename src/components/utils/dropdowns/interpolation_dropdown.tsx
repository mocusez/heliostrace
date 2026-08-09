import * as model from '../../../model';
import * as Controller from '../../../controller';
import * as Context from '../../../app_context';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { connect } from 'react-redux';

interface BucketsizeDropdwnProps{
    disabled: boolean,
}

interface AppstateProps {
    appContext: Context.IAppContext;
    currentInterpolation: string;
}

type Props = AppstateProps & BucketsizeDropdwnProps;

function InterpolationDropdown(props: Props) {

    const interpolations = ["linear", "linear-closed", "step", "step-before", "step-after", "basis", "basis-open", "basis-closed", "cardinal", "cardinal-open", "cardinal-closed", "bundle", "monotone"];

    const handleOnItemClick = (elem: string) => {
        Controller.setCurrentInterpolation(elem);
    };


    return (
        <div className="m-[10px]">
            <Label className="pl-[1px] text-[11px]" style={{ color: props.appContext.tertiaryColor }} id="interpolation-selector-label">Interpolation:</Label>
            <Select
                value={props.currentInterpolation as string}
                onValueChange={(value) => {
                    if (value !== null) {
                        handleOnItemClick(value);
                    }
                }}
                disabled={props.disabled}
            >
                <SelectTrigger className="w-[150px] text-left"
                    id="interpolation-selector"
                    aria-labelledby="interpolation-selector-label"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {interpolations.map((elem, index) =>
                        (<SelectItem key={index} value={elem}>{elem}</SelectItem>)
                    )}
                </SelectContent>
            </Select>

        </div>
    );
}

const mapStateToProps = (state: model.AppState) => ({
    currentInterpolation: state.currentInterpolation,
});

export default connect(mapStateToProps)(Context.withAppContext(InterpolationDropdown));
