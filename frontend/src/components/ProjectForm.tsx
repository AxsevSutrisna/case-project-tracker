import React, { useState, useEffect } from 'react';
import { Calendar, Trash2 } from 'lucide-react';

interface ProjectFormProps {
  project?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: 'Draft' | 'In Progress' | 'Done';
    progress: number;
  } | null;
  onSave: (data: { name: string; start_date: string; end_date: string }) => void;
  onDelete?: () => void;
  onCancel: () => void;
  error?: string | null;
  isSubmitting?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSave,
  onDelete,
  onCancel,
  error: apiError,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setStartDate(project.start_date.split('T')[0]);
      setEndDate(project.end_date.split('T')[0]);
    } else {
      setName('');
      setStartDate('');
      setEndDate('');
    }
    setValidationError(null);
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setValidationError('Nama proyek wajib diisi');
      return;
    }
    if (!startDate) {
      setValidationError('Tanggal mulai wajib diisi');
      return;
    }
    if (!endDate) {
      setValidationError('Tanggal selesai wajib diisi');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setValidationError('Tanggal mulai tidak boleh setelah tanggal selesai');
      return;
    }

    setValidationError(null);
    onSave({ name, start_date: startDate, end_date: endDate });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const showConflictInfo = apiError && apiError.includes('berbenturan');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 h-full justify-between">
      <div className="flex flex-col gap-5 overflow-y-auto pr-1">
        {/* Error Alerts */}
        {(validationError || apiError) && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs leading-relaxed">
            {validationError || apiError}
            {showConflictInfo && (
              <span className="block mt-1 font-semibold text-red-300">
                Peringatan: Jadwal proyek tidak boleh saling beririsan.
              </span>
            )}
          </div>
        )}

        {/* Read-Only Stats (Only in Edit mode) */}
        {project && (
          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div>
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold block mb-1">
                Status Proyek
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-md font-semibold inline-block ${getStatusClass(project.status)}`}>
                {project.status}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 tracking-wider font-semibold block mb-1">
                Progress
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-emerald-400">{project.progress.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Project Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="projectName" className="text-xs font-semibold text-slate-400">
            Nama Proyek
          </label>
          <input
            id="projectName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama proyek..."
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-600 transition-colors"
          />
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="startDate" className="text-xs font-semibold text-slate-400">
              Tanggal Mulai
            </label>
            <div className="relative">
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm w-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors scheme-dark"
              />
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="endDate" className="text-xs font-semibold text-slate-400">
              Tanggal Selesai
            </label>
            <div className="relative">
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm w-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors scheme-dark"
              />
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Buttons */}
      <div className="flex items-center gap-3 pt-6 border-t border-slate-900 mt-6 shrink-0">
        {project && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors font-medium text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus</span>
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800/50 transition-colors text-sm font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition-colors disabled:opacity-50 text-sm"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </form>
  );
};
