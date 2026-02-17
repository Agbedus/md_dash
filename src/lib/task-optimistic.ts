import { Task } from "@/types/task";
import { User } from "@/types/user";

export function createOptimisticTask(formData: FormData, users: User[]): Task {
    return {
        id: -1, // Temporary ID
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        status: formData.get('status') as Task['status'],
        priority: formData.get('priority') as Task['priority'],
        dueDate: formData.get('dueDate') as string,
        projectId: formData.get('projectId') ? Number(formData.get('projectId')) : null,
        assignees: (() => {
            const idsJson = formData.get('assigneeIds') as string;
            if (!idsJson) return [];
            try {
                const ids = JSON.parse(idsJson);
                return users
                    .filter(u => ids.includes(u.id))
                    .map(user => ({ user }));
            } catch { return []; }
        })(),
        assigneeIds: (() => {
            const idsJson = formData.get('assigneeIds') as string;
            try { return idsJson ? JSON.parse(idsJson) : []; } catch { return []; }
        })(),
        qa_required: false,
        review_required: false,
        depends_on_id: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

export function updateOptimisticTask(existingTask: Task, formData: FormData, users: User[]): Task {
    return {
        ...existingTask,
        name: (formData.get('name') as string) || existingTask.name,
        description: (formData.get('description') as string) || existingTask.description,
        status: (formData.get('status') as Task['status']) || existingTask.status,
        priority: (formData.get('priority') as Task['priority']) || existingTask.priority,
        dueDate: (formData.get('dueDate') as string) || existingTask.dueDate,
        projectId: formData.get('projectId') ? Number(formData.get('projectId')) : existingTask.projectId,
        assignees: (() => {
            const idsJson = formData.get('assigneeIds') as string;
            // If strictly empty string/null, it might mean "no change" or "clear"? 
            // In our logic, we usually send the current state if not changed, or the new state.
            // But here we rely on the specific implementation in TasksPageClient.
            // Let's replicate exact logic: if !idsJson, keep existing.
            if (!idsJson) return existingTask.assignees; 
            try {
                const ids = JSON.parse(idsJson);
                return users
                    .filter(u => ids.includes(u.id))
                    .map(user => ({ user }));
            } catch { return existingTask.assignees; }
        })(),
        assigneeIds: (() => {
            const idsJson = formData.get('assigneeIds') as string;
            try { return idsJson ? JSON.parse(idsJson) : existingTask.assigneeIds; } catch { return existingTask.assigneeIds; }
        })(),
    };
}
