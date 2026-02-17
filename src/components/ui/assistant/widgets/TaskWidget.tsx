import type { Task } from "@/types/task";
import Link from "next/link";

interface TaskWidgetProps {
  task: Task;
}

export default function TaskWidget({ task }: TaskWidgetProps) {
  // Status styling
  let statusColor = "text-zinc-400";
  let statusBg = "bg-zinc-400/10";
  
  if (task.status === "IN_PROGRESS") {
    statusColor = "text-blue-400";
    statusBg = "bg-blue-400/10";
  } else if (task.status === "DONE") {
    statusColor = "text-emerald-400";
    statusBg = "bg-emerald-400/10";
  } else {
    statusColor = "text-yellow-400";
    statusBg = "bg-yellow-400/10";
  }

  // Priority styling
  let priorityColor = "text-zinc-400";
  if (task.priority === "high") priorityColor = "text-red-400";
  else if (task.priority === "medium") priorityColor = "text-orange-400";
  else if (task.priority === "low") priorityColor = "text-green-400";

  // Format due date
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "No due date";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  };

  return (
    <div className="glass p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-2 truncate">{task.name}</h4>
          
          {task.description && (
            <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{task.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-1 rounded-lg ${statusBg} ${statusColor} font-medium`}>
              {task.status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            
            <span className={`px-2 py-1 rounded-lg bg-white/5 ${priorityColor} font-medium`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </span>
            
            <span className="px-2 py-1 rounded-lg bg-white/5 text-zinc-400">
              {formatDate(task.dueDate)}
            </span>
          </div>
        </div>
        
        <Link 
          href={`/tasks?id=${task.id}`}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium whitespace-nowrap"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
