// documents the in-memory sample batch column layout; some columns are only
// addressed by index elsewhere, keep the unused variants for completeness
#[allow(dead_code)]
pub enum RecordBatchSchema {
    Operator = 0,
    EvName = 1,
    _Time = 2,
    Pipeline = 3,
    _Addr = 4,
    Uri = 5,
    OpExtension = 6,
    Physical = 7,
}