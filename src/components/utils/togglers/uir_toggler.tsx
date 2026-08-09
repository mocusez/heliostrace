import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


interface Props {
    togglerState: boolean,
    togglerLabelText: string,
    uirViewerTogglerChangeFunction: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function UirToggler(props: Props) {

    const handleUirTogglerChange = (checked: boolean) => {
        //synthesize a minimal change event, callers only read event.target.checked
        const event = { target: { checked } } as React.ChangeEvent<HTMLInputElement>;
        props.uirViewerTogglerChangeFunction(event);
    }


    return (
        <div>
            <div className="flex items-center gap-2">
                <Label className="align-middle text-[11px] text-brand-tertiary">
                    {props.togglerLabelText}
                    <Switch
                        checked={props.togglerState}
                        onCheckedChange={handleUirTogglerChange}
                        name="HeatmapsDiffToggler"
                        size="sm"
                    />
                </Label>
            </div>
        </div>
    );
}


export default UirToggler;
