import * as profiler_core from '../crate/pkg/shell';
import * as bindings from './worker_bindings';
import * as BackendApi from './model/backend_queries';

// wasm-facing callbacks, response types and worker-side state live in
// worker_bindings.ts (imported by the wasm module via raw_module); re-export
// the message types for main-thread consumers.
export {
  WorkerResponseType,
} from './worker_bindings';
export type {
  WorkerResponse,
  WorkerResponseVariant,
  IStoreResultResponseData,
  IStoreQueryplanResponseData,
  IStoreMetalDispatchesResponseData,
  IStoreRooflineResponseData,
} from './worker_bindings';


//worker requests:

export enum WorkerRequestType {
  REGISTER_FILE = 'REGISTER_FILE',
  CALCULATE_CHART_DATA = 'CALCULATE_CHART_DATA',
};

export type WorkerRequest<T, P> = {
  readonly messageId: number;
  readonly type: T;
  readonly data: P;
};

export interface ICalculateChartDataRequestData {
  readonly requestId: number | undefined;
  readonly backendQuery: string,
  readonly metaRequest: boolean,
  readonly backendQueryType: BackendApi.BackendQueryType;
}

export type WorkerRequestVariant =
  WorkerRequest<WorkerRequestType.REGISTER_FILE, File> |
  WorkerRequest<WorkerRequestType.CALCULATE_CHART_DATA, ICalculateChartDataRequestData>
  ;


interface IRequestWorker {
  onmessage: (message: MessageEvent<WorkerRequestVariant>) => void;
}

const worker: IRequestWorker = self as any;

// Receive from the main thread
worker.onmessage = (message) => {

  if (!message.type) return;

  const messageType = message.data.type;
  const messageData = message.data.data;

  switch (messageType) {

    case WorkerRequestType.REGISTER_FILE: {

      const fileId = bindings.registerFile(messageData as File);
      profiler_core.analyzeFile(bindings.fileSize(fileId));
      break;
    }

    case WorkerRequestType.CALCULATE_CHART_DATA: {
      const requestData = messageData as ICalculateChartDataRequestData;
      bindings.setRequestContext(requestData.requestId, requestData.metaRequest, requestData.backendQueryType);
      profiler_core.requestChartData(requestData.backendQuery);
      break;
    }

    default:
  }

};
