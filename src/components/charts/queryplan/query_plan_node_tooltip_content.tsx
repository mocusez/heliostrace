import * as model from '../../../model';
import * as Context from '../../../app_context';
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type QueryplanNodeTooltipData = {
    uirLines: Array<string>,
    uirLineNumber: Array<number>,
    eventOccurrences: Array<number>,
    totalEventOccurrence: number,
    estimatedCardinality: number | undefined,
}

interface Props {
    appContext: Context.IAppContext;
    operatorName: string,
    operatorId: string,
    tooltipData: QueryplanNodeTooltipData,
}

class QueryPlanNodeTooltipContent extends React.Component<Props> {


    constructor(props: Props) {
        super(props);
    }

    createContentTable() {

        const DenseTable = (tooltipData: QueryplanNodeTooltipData) => {

            function createData(lineNumber: number, uirLine: string, eventOccurrence: string) {
                return { lineNumber, uirLine, eventOccurrence };
            }

            function truncateUirLine(uirLine: string, length: number) {
                if (uirLine.length > length) {
                    return uirLine.substring(0, length - 1) + "...";
                } else {
                    return uirLine;
                }
            }

            const tableRows = [];
            if (tooltipData.uirLineNumber && tooltipData.uirLineNumber.length > 0) {
                const numberTableRows = tooltipData.uirLineNumber.length > 5 ? 5 : tooltipData.uirLineNumber.length;
                for (let i = 0; i < numberTableRows; i++) {
                    if (tooltipData.eventOccurrences[i] !== 0) {
                        tableRows.push(createData(tooltipData.uirLineNumber[i], truncateUirLine(tooltipData.uirLines[i], 65), tooltipData.eventOccurrences[i] + "%"));
                    }
                }
            }

            return (
                <div
                    className="bg-inherit"
                >
                    {tableRows.length > 0 ?
                        (<Table
                            aria-label="tooltip table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="px-[5px]! py-[3px]! text-xs text-right">No.</TableHead>
                                    <TableHead className="px-[5px]! py-[3px]! text-xs text-left">UIR Line</TableHead>
                                    <TableHead className="px-[5px]! py-[3px]! text-xs text-right">Freq.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableRows.map((row) => (
                                    <TableRow key={row.lineNumber}>
                                        <TableCell className="px-[5px]! py-[3px]! text-right">
                                            <div className="block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-popover-foreground">
                                                {row.lineNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-[5px]! py-[3px]! text-left">
                                            <div className="block w-[215px] overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-popover-foreground">
                                                {row.uirLine}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-[5px]! py-[3px]! text-right">
                                            <div className="block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-popover-foreground">
                                                {row.eventOccurrence}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>)
                        :
                        (<p
                            className="mt-2.5 text-[9px] font-medium"
                        >
                            No occurrences in current selection.

                        </p>)
                    }

                </div>
            );
        }

        return DenseTable(this.props.tooltipData);
    }

    createNodeSubtitleLine() {
        return <div
            className="mt-2.5 mb-[3px] flex w-full flex-row flex-nowrap items-center justify-center"
        >
            {this.props.tooltipData.estimatedCardinality && this.createEstimatedCardinalityLine()}
            {this.props.operatorId !== "root" && this.createTotalSumLine()}
        </div>
    }

    createTotalSumLine() {
        return <p
            className="flex-1 text-right text-[11px] font-medium"
        >
            Total Frequency: {this.props.tooltipData.totalEventOccurrence}%

        </p>
    }

    createEstimatedCardinalityLine() {
        return <p
            className="flex-1 text-left text-[11px] font-medium"
        >
            Estimated Cardinality: {model.chartConfiguration.nFormatter(this.props.tooltipData.estimatedCardinality!, 1)}

        </p>
    }

    createHeaderOperatorName() {
        const showOperatorId = () => {
            return this.props.operatorName === this.props.operatorId.replace(/\d+/g, '') ? "" : ` (${this.props.operatorId})`;
        }

        return <p
            className="my-[3px] text-left text-xs font-medium"
        >
            {this.props.operatorName} {showOperatorId()}

        </p>
    }

    createNodeTooltip() {
        return <div>
            {this.createHeaderOperatorName()}
            {this.createContentTable()}
            {this.createNodeSubtitleLine()}
        </div >
    }

    public render() {
        return this.createNodeTooltip();
    }

}

export default (Context.withAppContext(QueryPlanNodeTooltipContent));
