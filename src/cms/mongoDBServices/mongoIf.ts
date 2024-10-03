export interface UpdateData {
  updateData?: unknown;
  updateOptions?: unknown;
}
export interface SortObject {
  _id?: number;
}

export interface Options extends UpdateData {
  query?: unknown;
  select?: string;
  sort?: any;
  populate?: any;
  offset?: number;
  limit?: number;
  lean?: boolean;
  insert?: unknown;
  deletedBy?: string;
}
