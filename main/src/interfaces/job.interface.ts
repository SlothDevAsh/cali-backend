export enum JOB_STATUSES {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
}

export interface IJob {
  jobId: string;
  status: JOB_STATUSES;
}

export interface JobResult extends IJob {
  imageUrl: string;
  timestamp: Date;
}
