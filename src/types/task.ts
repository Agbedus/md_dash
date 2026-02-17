import { User } from './user';

export type TaskStatus = "TODO" | "IN_PROGRESS" | "QA" | "REVIEW" | "DONE";
export type TaskPriority = "low" | "medium" | "high";

export type TaskTimeLog = {
    id: number;
    task_id: number;
    user_id: string;
    start_time: string;
    end_time: string | null;
    duration: number | null;
    is_active: boolean;
};

export type Task = {
    id: number;
    name: string;
    description: string | null;
    dueDate: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    qa_required: boolean;
    review_required: boolean;
    depends_on_id: number | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    assignees?: { user: User }[];
    assigneeIds?: string[];
    projectId?: number | null;
    userId?: string | null;
    owner?: User;
    timeLogs?: TaskTimeLog[];
    totalHours?: number;
};

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'timeLogs' | 'totalHours'>;

export function parseTaskFormData(formData: FormData): Partial<Task> {
    const data = Object.fromEntries(formData);
    return {
        name: data.name as string,
        description: data.description as string,
        dueDate: data.dueDate as string,
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        qa_required: data.qa_required === "true",
        review_required: data.review_required === "true",
        depends_on_id: data.depends_on_id ? Number(data.depends_on_id) : null,
        assigneeIds: data.assigneeIds ? JSON.parse(data.assigneeIds as string) : [],
        projectId: data.projectId ? Number(data.projectId) : null,
    };
}


export const statusMapping: { [key in TaskStatus]: string } = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    QA: "Quality Assurance",
    REVIEW: "Review",
    DONE: "Done",
};

export const priorityMapping: { [key in TaskPriority]: string } = {
    low: "Low",
    medium: "Medium",
    high: "High",
};
