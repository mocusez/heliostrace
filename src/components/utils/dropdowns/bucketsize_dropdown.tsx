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
    currentBucketSize: number;
}

type Props = AppstateProps & BucketsizeDropdwnProps;

function BucketsizeDropdwn(props: Props) {

    const bucketsizes = [0.1, 0.2, 0.5, 0.7, 1, 2.5, 5, 7.5, 10, 50, 100];

    const handleOnItemClick = (elem: number) => {
        Controller.setCurrentBucketSize(elem);
    };


    return (
        <div className="m-[10px]">
            <Label className="pl-[1px] text-[11px]" style={{ color: props.appContext.tertiaryColor }} id="bucketsize-selector-label">Bucket-Size:</Label>
            <Select
                value={props.currentBucketSize}
                onValueChange={(value) => {
                    if (value !== null) {
                        handleOnItemClick(value);
                    }
                }}
                disabled={props.disabled}
            >
                <SelectTrigger className="w-[150px] text-left"
                    id="bucketsize-selector"
                    aria-labelledby="bucketsize-selector-label"
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {bucketsizes.map((elem, index) =>
                        (<SelectItem key={index} value={elem}>{elem}</SelectItem>)
                    )}
                </SelectContent>
            </Select>

        </div>
    );
}

const mapStateToProps = (state: model.AppState) => ({
    currentBucketSize: state.currentBucketSize,
});

export default connect(mapStateToProps)(Context.withAppContext(BucketsizeDropdwn));
