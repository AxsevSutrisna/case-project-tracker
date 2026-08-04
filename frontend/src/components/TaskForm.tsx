import React, { useState, useEffect } from 'react';
import { Trash2, Link } from 'lucide-react';
import { TaskType } from './TaskTreeNode';

interface TaskFormProps {
  task?: TaskType | null;
  projects: { id: number; name: string }[];
  tasks: TaskType[];
  onSave: (data: {
    title: string;
    project_id: number;
    parent_id: number | null;
    weight: number;
    status: 'Draft' | 'In_Progress' | 'Done';
    dependencyIds: number[];
  }) => void;
  onDelete?: () => void;
  onCancel: () => void;
  error?: string | null;
  isSubmitting?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  projects,
  tasks,
  onSave,
  onDelete,
  onCancel,
  error: apiError,
  isSubmitting = false,
}) => {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<number>(0);
  const [parentId, setParentId] = useState<number | null>(null);
  const [weight, setWeight] = useState<number>(1);
  const [status, setStatus] = useState<'Draft' | 'In_Progress' | 'Done'>('Draft');
  const [dependencyIds, setDependencyIds] = useState<number[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setProjectId(task.project_id);
      setParentId(task.parent_id);
      setWeight(task.weight);
      setStatus(task.status);
      const existingDeps = task.dependencies ? task.dependencies.map((d) => d.depends_on_task_id) : [];
      setDependencyIds(existingDeps);
    } else {
      setTitle('');
      setParentId(null);
      setWeight(1);
      setStatus('Draft');
      setDependencyIds([]);
    }
    setValidationError(null);
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setValidationError('Judul tugas wajib diisi');
      return;
    }
    if (!projectId) {
      setValidationError('Pilihan proyek wajib dipilih');
      return;
    }
    if (weight < 1) {
      setValidationError('Bobot tugas minimal bernilai 1');
      return;
    }

    setValidationError(null);
    onSave({
      title,
      project_id: projectId,
      parent_id: parentId,
      weight,
      status,
      dependencyIds,
    });
  };

  const parentOptions = tasks.filter((t) => t.id !== task?.id);

  const isChildOf = (t: TaskType, targetId: number): boolean => {
    if (t.parent_id === targetId) return true;
    if (t.parent_id === null) return false;
    const parent = tasks.find((item) => item.id === t.parent_id);
    return parent ? isChildOf(parent, targetId) : false;
  };

  const dependencyOptions = tasks.filter((t) => {
    if (t.id === task?.id) return false;
    if (task && isChildOf(t, task.id)) return false;
    return true;
  });

  const handleToggleDependency = (id: number) => {
    if (dependencyIds.includes(id)) {
      setDependencyIds(dependencyIds.filter((depId) => depId !== id));
    } else {
      setDependencyIds([...dependencyIds, id]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 h-full justify-between">
      <div className="flex flex-col gap-5 overflow-y-auto pr-1">
        {/* Error Alerts */}
        {(validationError || apiError) && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-[12px] leading-relaxed">
            {validationError || apiError}
            {apiError && apiError.includes('Circular') && (
              <span className="block mt-1 font-semibold text-red-300">
                Peringatan: Terjadi hubungan melingkar antar tugas yang dilarang.
              </span>
            )}
          </div>
        )}

        {/* Task Title */}
        <div className="flex flex-col gap-2">
          <label htmlFor="taskTitle" className="text-[12px] font-semibold text-slate-400">
            Nama Tugas / Task <span className="text-red-500">*</span>
          </label>
          <input
            id="taskTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masukkan nama tugas..."
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-[16px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-600 transition-colors"
          />
        </div>

        {/* Project Selector (disabled if editing to prevent project migration conflicts) */}
        <div className="flex flex-col gap-2">
          <label htmlFor="taskProject" className="text-[12px] font-semibold text-slate-400">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            id="taskProject"
            value={projectId}
            disabled={!!task}
            onChange={(e) => {
              setProjectId(parseInt(e.target.value, 10));
              setParentId(null);
              setDependencyIds([]);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-[16px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors disabled:opacity-50"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Weight */}
          <div className="flex flex-col gap-2">
            <label htmlFor="taskWeight" className="text-[12px] font-semibold text-slate-400">
              Bobot Kerja <span className="text-red-500">*</span>
            </label>
            <input
              id="taskWeight"
              type="number"
              min={1}
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value, 10) || 1)}
              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-[16px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label htmlFor="taskStatus" className="text-[12px] font-semibold text-slate-400">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="taskStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-[16px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            >
              <option value="Draft">Draft</option>
              <option value="In_Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        {/* Parent Task Selector (Optional) */}
        <div className="flex flex-col gap-2">
          <label htmlFor="taskParent" className="text-[12px] font-semibold text-slate-400">
            Parent Task (Opsional, untuk Subtask)
          </label>
          <select
            id="taskParent"
            value={parentId || ''}
            onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-[16px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          >
            <option value="">-- Tanpa Parent (Tugas Utama) --</option>
            {parentOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Dependency Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5 text-slate-500" />
            Task Dependencies (Tugas yang harus diselesaikan dulu)
          </span>
          <div className="bg-slate-950 border border-slate-800 rounded-lg max-h-40 overflow-y-auto p-3 flex flex-col gap-2">
            {dependencyOptions.length === 0 ? (
              <span className="text-[12px] text-slate-600 italic">Tidak ada pilihan task lain dalam proyek ini.</span>
            ) : (
              dependencyOptions.map((t) => (
                <label key={t.id} className="flex items-center gap-2.5 text-[12px] text-slate-350 cursor-pointer select-none py-1 hover:text-slate-100">
                  <input
                    type="checkbox"
                    checked={dependencyIds.includes(t.id)}
                    onChange={() => handleToggleDependency(t.id)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950 w-4 h-4 cursor-pointer"
                  />
                  <span className={`${dependencyIds.includes(t.id) ? 'font-semibold text-slate-200' : ''}`}>
                    {t.title} ({t.status})
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center gap-3 pt-6 border-t border-slate-900 mt-6 shrink-0">
        {task && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors font-medium text-[16px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus</span>
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800/50 transition-colors text-[16px] font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-colors disabled:opacity-50 text-[16px]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </form>
  );
};
