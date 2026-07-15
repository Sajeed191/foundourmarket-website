/**
 * Marketplace Operations 1.0 — public surface.
 *
 * Operations turn the frozen intelligence layers' outputs into workflows.
 * They MUST consume only public contracts and MUST NOT introduce new
 * detection, scoring, or AI calls.
 */
export {
  buildSmartQueues,
  estimateMinutesForQueue,
  estimateMinutesForItems,
  EFFORT_LABEL,
} from "./smart-queues";
export type {
  SmartQueues,
  WorkQueue,
  QueueItem,
  QueueId,
  EstimatedEffort,
} from "./smart-queues";
export {
  BULK_OPERATIONS,
  BULK_OPERATION_ORDER,
  STATUS_LABEL as BULK_STATUS_LABEL,
} from "./bulk-operations";
export type {
  BulkOperation,
  BulkOperationType,
  BulkOperationSpec,
  BulkStatus,
  BulkStepResult,
  BulkOpProductLike,
} from "./bulk-operations";
