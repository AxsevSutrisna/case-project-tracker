import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Circle, Play, CheckCircle2, Weight } from 'lucide-react';

export interface TaskType {
  id: number;
  project_id: number;
  parent_id: number | null;
  title: string;
  status: 'Draft' | 'In Progress' | 'Done';
  weight: number;
  dependencies?: { depends_on_task_id: number }[];
  subtasks?: TaskType[];
}

interface TaskTreeNodeProps {
  task: TaskType;
  depth: number;
  onEditTask: (task: TaskType) => void;
  onAddSubtask: (parentTaskId: number) => void;
}

export const TaskTreeNode: React.FC<TaskTreeNodeProps> = ({
  task,
  depth,
  onEditTask,
  onAddSubtask,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = task.subtasks && task.subtasks.length > 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Done':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'In Progress':
        return <Play className="w-4 h-4 text-sky-400 shrink-0 fill-sky-400/20" />;
      default:
        return <Circle className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="select-none">
      {/* Task Row */}
      <div
        className="group flex items-center justify-between py-2 px-3 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-800"
        style={{ paddingLeft: `${depth === 0 ? 8 : depth * 20 + 8}px` }}
        onClick={() => onEditTask(task)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Collapse/Expand Toggle */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-100"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" /> // Placeholder spacing
          )}

          {/* Status Icon */}
          {getStatusIcon(task.status)}

          {/* Task Title */}
          <span className={`text-sm truncate font-medium ${task.status === 'Done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
            {task.title}
          </span>
        </div>

        {/* Action Badges / Controls */}
        <div className="flex items-center gap-3 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Weight Badge */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-850">
            <Weight className="w-3 h-3 text-slate-500" />
            <span>Bobot: {task.weight}</span>
          </div>

          {/* Status Badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide ${getStatusBadgeClass(task.status)}`}>
            {task.status}
          </span>

          {/* Add Subtask (+) Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask(task.id);
            }}
            title="Tambah subtask"
            className="p-1 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recursive Children rendering */}
      {hasChildren && isExpanded && (
        <div className="mt-1 flex flex-col gap-0.5">
          {task.subtasks!.map((subtask) => (
            <TaskTreeNode
              key={subtask.id}
              task={subtask}
              depth={depth + 1}
              onEditTask={onEditTask}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </div>
      )}
    </div>
  );
};
