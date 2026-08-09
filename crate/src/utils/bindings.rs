use js_sys::Uint8Array;
use wasm_bindgen::prelude::*;

// Connection between Rust and JavaScript
#[wasm_bindgen(raw_module = "../../src/worker_bindings")]
extern "C" {

    #[wasm_bindgen(js_name = "readFileChunk")]
    pub fn read_file_chunk(offset: i32, bytes: i32) -> Uint8Array;

    #[wasm_bindgen(js_name = "notifyJsFinishedReading")]
    pub fn notify_js_finished_reading(request_id: i32);

    #[wasm_bindgen(js_name = "sendJsQueryResult")]
    pub fn send_js_query_result(query_result: Vec<u8>);

    #[wasm_bindgen(js_name = "notifyJsQueryPlan")]
    pub fn send_js_query_plan(query_plan: String);

    // metal.json is optional (only present for traces with Metal GPU dispatches);
    // empty string means "not present", handled on the JS side.
    #[wasm_bindgen(js_name = "notifyJsMetalDispatches")]
    pub fn send_js_metal_dispatches(metal_dispatches: String);

    // roofline.json is optional (analytic roofline: per-kernel GPU points +
    // per-query CPU point + machine roofs); empty string = "not present".
    #[wasm_bindgen(js_name = "notifyJsRoofline")]
    pub fn send_js_roofline(roofline: String);

    #[wasm_bindgen(js_name = "stroreArrowResultFromRust")]
    pub fn send_arrow_result_to_js(arrow_result: Vec<u8>);

}
