import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import React, { memo, useContext } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { ctx } from '../../../app_context';
import CSS from 'csstype';
import QueryPlanNodeTooltipContent, { QueryplanNodeTooltipData } from './query_plan_node_tooltip_content';

export type QueryplanNodeData = {
    label: string,
    tooltipData: QueryplanNodeTooltipData,
}

interface QueryplanNodeProps {
    id: string,
    data: QueryplanNodeData,
    type: string,
    selected: boolean,
    sourcePosition: Position,
    targetPosition: Position,
}

export default memo(function QueryplanNode(props: QueryplanNodeProps) {

    const handleStyle = (handlerType: "source" | "target"): CSS.Properties => {
        return {
            background: context!.accentBlack,
            visibility: ((handlerType === "source" && props.id.includes("root")) || (handlerType === "target" && (props.id.includes("tablescan") || props.id.includes("groupbyscan")))) ? "hidden" : "visible",
        }
    }

    const context = useContext(ctx);

    const createNodeContent = () => {
        return <div
            className="flex h-full w-full items-center justify-center"
        >
            {props.data.label.length > 15 ? props.data.label.substring(0, 14) + "..." : props.data.label}
        </div>
    }

    return (
        <>
            <Tooltip>
                <TooltipTrigger render={createNodeContent()} />
                <TooltipContent side="top" className="w-[300px] max-w-none rounded-[7px] border border-solid border-border bg-popover text-popover-foreground">
                    <QueryPlanNodeTooltipContent
                        operatorName={props.data.label}
                        operatorId={props.id}
                        tooltipData={props.data.tooltipData}
                    />
                </TooltipContent>
            </Tooltip>

            <Handle
                type="target"
                position={props.targetPosition}
                style={handleStyle("target")}
                isConnectable={false}
            />
            <Handle
                type="source"
                position={props.sourcePosition}
                style={handleStyle("source")}
                isConnectable={false}
            />
        </>
    );
});
