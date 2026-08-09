import * as Controller from '../../../controller';
import React from 'react';
import { FlowGraphElements, FlowGraphNode } from './query_plan_wrapper';
import ReactFlow, { ConnectionLineType, Controls, ReactFlowProvider } from 'react-flow-renderer';
import QueryplanNode from './query_plan_node';

// react-flow-renderer v9 ships React 17 typings (implicit children, ReactNode-based
// nodeTypes); shim them until the library is upgraded to reactflow v11.
const FlowProvider = ReactFlowProvider as unknown as React.FC<{ children?: React.ReactNode }>;
const queryplanNodeType = QueryplanNode as unknown as React.ReactNode;


interface Props {
    key: number; //trigers complete rerender for repositioning
    height: number;
    width: number;
    graphElements: FlowGraphElements,
}

class QueryPlanViewer extends React.Component<Props> {


    constructor(props: Props) {
        super(props);
    }

    handleNodeClick(event: React.MouseEvent, element: FlowGraphNode) {
        Controller.handleOperatorSelection(element.id);
    }

    onLoad(reactFlowInstance: any) {
        //Fit graph to view after load
        reactFlowInstance.fitView();
    }

    createReactFlowGraph() {

        const nodeTypes = {
            queryplanNode: queryplanNodeType,
        };

        return <div
            className="box-border h-full w-full cursor-grab p-0.5 active:cursor-grabbing"
        >
            <FlowProvider>
                <ReactFlow
                    elements={this.props.graphElements}
                    minZoom={0.1}
                    maxZoom={3}
                    // onNodeMouseEnter={(event, element) => this.handleNodeMouseEnter(event, element as FlowGraphNode)}
                    //onNodeMouseLeave={(event, element) => this.handleNodeMouseLeave(event, element as FlowGraphNode)}
                    nodesConnectable={false}
                    nodesDraggable={true}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    onLoad={this.onLoad}
                    onElementClick={(event, element) => this.handleNodeClick(event, element as FlowGraphNode)}
                    nodeTypes={nodeTypes}
                >
                    <Controls className="opacity-50 transition-opacity duration-500 hover:opacity-100" />
                </ReactFlow>


            </FlowProvider>
        </div>
    }

    public render() {
        return this.createReactFlowGraph();
    }

}

export default QueryPlanViewer;
