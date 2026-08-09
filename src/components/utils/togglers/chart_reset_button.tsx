import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';


interface Props {
    chartResetButtonFunction: () => void;
}

function ChartResetButton(props: Props) {

    const chartResetButtonClicked = () => {
        props.chartResetButtonFunction();
    }


    return (
        <Button
            className="absolute left-[11px] z-10"
            onClick={() => chartResetButtonClicked()}
            variant="ghost"
            size="icon-sm"
        >
            <RotateCcw />
        </Button>
    );
}


export default ChartResetButton;
