export interface DeletedWorkflow {
  id: string;
  name: string;
  description?: string;
  urlPattern: string;
  nodes: number;
  deletedAt: number;
}
