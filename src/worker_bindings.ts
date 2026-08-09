// Functions and state the wasm module imports directly (see
// crate/src/utils/bindings.rs `raw_module`). This must NOT live in worker.ts:
// the worker entry module is served under a different URL
// (worker.ts?worker_file&type=module) than a plain import of worker.ts, so
// keeping the wasm-facing state in the entry module would create two module
// instances with separate state in dev mode.

import * as BackendApi from './model/backend_queries';
import { IMetalDispatch, IRooflineData } from './model/chart_data_results';


//worker responses:

export enum WorkerResponseType {
  HELIOS_FILE_READING_FINISHED = 'HELIOS_FILE_READING_FINISHED',
  STORE_RESULT = 'STORE_RESULT',
  STORE_QUERYPLAN_JSON = 'STORE_QUERYPLAN_JSON',
  STORE_METAL_DISPATCHES = 'STORE_METAL_DISPATCHES',
  STORE_ROOFLINE = 'STORE_ROOFLINE',
};

export type WorkerResponse<T, P> = {
  readonly type: T;
  readonly data: P;
  readonly messageId: number;
};

export interface IStoreResultResponseData {
  requestId: number,
  chartData: any,
  backendQueryType: BackendApi.BackendQueryType,
  metaRequest: boolean,
}

export interface IStoreQueryplanResponseData {
  queryPlanData: object,
}

export interface IStoreMetalDispatchesResponseData {
  metalDispatches: Array<IMetalDispatch>,
}

export interface IStoreRooflineResponseData {
  roofline: IRooflineData | undefined,
}

export type WorkerResponseVariant =
  WorkerResponse<WorkerResponseType.HELIOS_FILE_READING_FINISHED, number> |
  WorkerResponse<WorkerResponseType.STORE_RESULT, IStoreResultResponseData> |
  WorkerResponse<WorkerResponseType.STORE_QUERYPLAN_JSON, IStoreQueryplanResponseData> |
  WorkerResponse<WorkerResponseType.STORE_METAL_DISPATCHES, IStoreMetalDispatchesResponseData> |
  WorkerResponse<WorkerResponseType.STORE_ROOFLINE, IStoreRooflineResponseData>
  ;


export interface IWorker {
  postMessage: (answerMessage: WorkerResponseVariant) => void;
}


interface IGlobalFileDictionary {
  [key: number]: File;
}

let globalFileIdCounter = 0;
let globalMetaRequest: boolean;
const globalFileDictionary: IGlobalFileDictionary = {}
let globalRequestId: number | undefined = undefined;
let globalBackendQueryType: BackendApi.BackendQueryType | undefined = undefined;

const worker: IWorker = self as any;


// called by worker.ts on REGISTER_FILE; returns the new file id
export function registerFile(file: File): number {
  globalFileIdCounter++;
  globalFileDictionary[globalFileIdCounter] = file;
  return globalFileIdCounter;
}

export function fileSize(fileId: number): number {
  return globalFileDictionary[fileId].size;
}

// called by worker.ts on CALCULATE_CHART_DATA
export function setRequestContext(requestId: number | undefined, metaRequest: boolean, backendQueryType: BackendApi.BackendQueryType) {
  globalRequestId = requestId;
  globalMetaRequest = metaRequest;
  globalBackendQueryType = backendQueryType;
}


//callbacks imported by the wasm module:

export function readFileChunk(offset: number, chunkSize: number) {

  if (globalFileDictionary[globalFileIdCounter]) {
    const file = globalFileDictionary[globalFileIdCounter];
    const remainingFileSize = file.size - offset;

    if (remainingFileSize > 0) {
      const readPart = Math.min(remainingFileSize, chunkSize);
      const chunk = file.slice(offset, offset + readPart);
      const reader = new FileReaderSync();
      const arrayBufferChunk = reader.readAsArrayBuffer(chunk);
      const uInt8ArrayChunk = new Uint8Array(arrayBufferChunk!);

      return uInt8ArrayChunk;
    }
  }
}

export function notifyJsFinishedReading(registeredFileId: number) {
  worker.postMessage({
    messageId: 201,
    type: WorkerResponseType.HELIOS_FILE_READING_FINISHED,
    data: registeredFileId,
  });

}

export function notifyJsQueryPlan(queryplan: string) {
  const queryplanObject = queryplan ? JSON.parse(queryplan) : { "error": "no queryplan" };
  worker.postMessage({
    messageId: 201,
    type: WorkerResponseType.STORE_QUERYPLAN_JSON,
    data: {
      queryPlanData: queryplanObject,
    },
  });
}

export function notifyJsMetalDispatches(metalJson: string) {
  let metalDispatches: Array<IMetalDispatch> = [];
  if (metalJson) {
    try {
      metalDispatches = JSON.parse(metalJson);
    } catch {
      metalDispatches = [];
    }
  }
  worker.postMessage({
    messageId: 201,
    type: WorkerResponseType.STORE_METAL_DISPATCHES,
    data: {
      metalDispatches: metalDispatches,
    },
  });
}

export function notifyJsRoofline(rooflineJson: string) {
  let roofline: IRooflineData | undefined = undefined;
  if (rooflineJson) {
    try {
      roofline = JSON.parse(rooflineJson);
    } catch {
      roofline = undefined;
    }
  }
  worker.postMessage({
    messageId: 201,
    type: WorkerResponseType.STORE_ROOFLINE,
    data: {
      roofline: roofline,
    },
  });
}

export function sendJsQueryResult(result: any) {

  if (result) {
    worker.postMessage({
      messageId: 201,
      type: WorkerResponseType.STORE_RESULT,
      data: {
        requestId: globalRequestId!,
        chartData: result,
        backendQueryType: globalBackendQueryType!,
        metaRequest: globalMetaRequest,
      },
    });
  }

}
