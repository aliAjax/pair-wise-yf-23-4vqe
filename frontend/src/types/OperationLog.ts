export type OperationEntity = "Fixture" | "CueScene" | "TimelineTrack" | "ShowProject";
export type OperationAction = "CREATE" | "UPDATE" | "STATUS" | "DELETE" | "EXPORT" | "IMPORT";

export interface OperationLog {
  id: string;
  entity: OperationEntity;
  action: OperationAction;
  message: string;
  created_at: string;
}
