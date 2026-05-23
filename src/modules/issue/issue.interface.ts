export interface IIssue {
    title: string;
    description: string;
    type: 'bug' | 'feature' | 'task';
    status?: string;
    reporter_id: string;
}