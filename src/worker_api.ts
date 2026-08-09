import * as Controller from './controller';
import * as model from './worker';
import * as ArrowTable from "apache-arrow";
import { ICalculateChartDataRequestData } from './worker';
import * as BackendApi from './model/backend_queries';



const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

export class WorkerAPI {
    worker!: Worker;

    constructor() {
        this.worker = worker;
    }

    //Requests from Main to Worker:

    public registerFile(file: File) {
        this.worker.postMessage({
            type: model.WorkerRequestType.REGISTER_FILE,
            data: file
        });
    }

    public calculateChartData(backendQuery: string, requestId: number, metaRequest: boolean, backendQueryType: BackendApi.BackendQueryType) {
        console.log("REQ: " + backendQueryType + ", " + requestId);
        const requestData: ICalculateChartDataRequestData = {
            backendQuery: backendQuery,
            metaRequest: metaRequest,
            requestId: requestId,
            backendQueryType: backendQueryType,
        }

        this.worker.postMessage({
            type: model.WorkerRequestType.CALCULATE_CHART_DATA,
            data: requestData,
        });
    }

}

//Responses from Worker to Main:
worker.addEventListener('message', message => {

    if (!message.type) return;

    const messageType = message.data.type;
    const messageData = message.data.data;

    switch (messageType) {

        case model.WorkerResponseType.HELIOS_FILE_READING_FINISHED:
            Controller.setHeliosFileReadingFinished();
            break;

        case model.WorkerResponseType.STORE_RESULT: {
            console.log("RESP: " + messageData.backendQueryType + ", " + messageData.requestId);
            const resultRequestId = messageData.requestId;
            const resultChartData = messageData.chartData;
            const resultArrowTable = ArrowTable.Table.from(resultChartData);
            const resultBackendQueryType = messageData.backendQueryType;
            const metaRequest = messageData.metaRequest;
            Controller.storeResultFromRust(resultRequestId, resultArrowTable, metaRequest, resultBackendQueryType);
            break;
        }

        case model.WorkerResponseType.STORE_QUERYPLAN_JSON:
            Controller.setQueryPlanJson(messageData.queryPlanData);
            break;

        case model.WorkerResponseType.STORE_METAL_DISPATCHES:
            Controller.setMetalDispatches(messageData.metalDispatches);
            break;

        case model.WorkerResponseType.STORE_ROOFLINE:
            Controller.setRoofline(messageData.roofline);
            break;

        default:
            console.log("Unknown message type from worker.");

    }
});
