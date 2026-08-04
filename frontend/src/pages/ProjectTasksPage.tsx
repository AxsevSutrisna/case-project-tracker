import React, { useState, useMemo } from 'react';
import { Plus, Search, Calendar, Folder, ClipboardList, Briefcase, Filter, Loader2, CheckCircle2, Play, Circle, Weight } from 'lucide-react';
import { TaskTreeNode, TaskType } from '../components/TaskTreeNode';
import { SlidingPanel } from '../components/SlidingPanel';
import { ProjectForm } from '../components/ProjectForm';
import { TaskForm } from '../components/TaskForm';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../hooks/useProjects';
import {
  useTasksTree,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCreateTaskDependency,
  useDeleteTaskDependency,
} from '../hooks/useTasks';

export default function ProjectTasksPage() {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { data: tasks = [], isLoading: isLoadingTasks } = useTasksTree(selectedProjectId);
  React.useEffect(() => {
    if (projects.length > 0 && selectedProjectId === null) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const createTaskDepMutation = useCreateTaskDependency();
  const deleteTaskDepMutation = useDeleteTaskDependency();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<'addProject' | 'editProject' | 'addTask' | 'editTask' | null>(null);
  
  const [preSelectedProjectId, setPreSelectedProjectId] = useState<number | null>(null);
  const [preSelectedParentId, setPreSelectedParentId] = useState<number | null>(null);

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const activeTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const filteredFlatTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = searchQuery.trim() === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  const buildTaskTreeForProject = (taskList: TaskType[]): TaskType[] => {
    const map: { [key: number]: TaskType & { subtasks: TaskType[] } } = {};
    const roots: TaskType[] = [];
    taskList.forEach((t) => {
      map[t.id] = { ...t, subtasks: [] };
    });

    taskList.forEach((t) => {
      const node = map[t.id];
      if (t.parent_id !== null) {
        const parent = map[t.parent_id];
        if (parent) {
          parent.subtasks.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const filterTaskRecursive = (t: TaskType): boolean => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    const isMatch = matchesSearch && matchesStatus;

    if (isMatch) return true;

    if (t.subtasks && t.subtasks.length > 0) {
      return t.subtasks.some((sub) => filterTaskRecursive(sub));
    }

    return false;
  };

  const getFilteredTaskTree = (): TaskType[] => {
    const fullTree = buildTaskTreeForProject(tasks);

    const filterNode = (node: TaskType): TaskType | null => {
      const isVisible = filterTaskRecursive(node);
      if (!isVisible) return null;

      if (node.subtasks && node.subtasks.length > 0) {
        const filteredChildren = node.subtasks
          .map((child) => filterNode(child))
          .filter((child): child is TaskType => child !== null);

        return {
          ...node,
          subtasks: filteredChildren,
        };
      }

      return {
        ...node,
        subtasks: [],
      };
    };

    return fullTree
      .map((root) => filterNode(root))
      .filter((root): root is TaskType => root !== null);
  };

  const handleOpenAddProject = () => {
    setApiError(null);
    setPanelType('addProject');
    setIsPanelOpen(true);
  };

  const handleOpenEditProject = (projId: number) => {
    setApiError(null);
    setSelectedProjectId(projId);
    setPanelType('editProject');
    setIsPanelOpen(true);
  };

  const handleOpenAddTask = (projId?: number | null, parentId?: number | null) => {
    setApiError(null);
    setPreSelectedProjectId(projId || selectedProjectId || (projects[0]?.id ?? null));
    setPreSelectedParentId(parentId || null);
    setPanelType('addTask');
    setIsPanelOpen(true);
  };

  const handleOpenEditTask = (task: TaskType) => {
    setApiError(null);
    setSelectedTaskId(task.id);
    setSelectedProjectId(task.project_id);
    setPanelType('editTask');
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setPanelType(null);
    setPreSelectedProjectId(null);
    setPreSelectedParentId(null);
    setApiError(null);
  };

  const handleSaveProject = async (data: { name: string; start_date: string; end_date: string }) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      if (panelType === 'addProject') {
        const newProj = await createProjectMutation.mutateAsync(data);
        setSelectedProjectId(newProj.id);
      } else if (panelType === 'editProject' && selectedProjectId) {
        await updateProjectMutation.mutateAsync({ id: selectedProjectId, data });
      }
      handleClosePanel();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Gagal menyimpan proyek';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    setApiError(null);
    setIsSubmitting(true);
    try {
      await deleteProjectMutation.mutateAsync(selectedProjectId);
      setSelectedProjectId(projects.find((p) => p.id !== selectedProjectId)?.id || null);
      handleClosePanel();
    } catch (err: any) {
      setApiError(err.response?.data?.error || 'Gagal menghapus proyek');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTask = async (data: {
    title: string;
    project_id: number;
    parent_id: number | null;
    weight: number;
    status: 'Draft' | 'In_Progress' | 'Done';
    dependencyIds: number[];
  }) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      if (panelType === 'addTask') {
        const newTask = await createTaskMutation.mutateAsync({
          project_id: data.project_id,
          parent_id: data.parent_id,
          title: data.title,
          status: data.status,
          weight: data.weight,
        });

        if (data.dependencyIds.length > 0) {
          await Promise.all(
            data.dependencyIds.map((depId) =>
              createTaskDepMutation.mutateAsync({ taskId: newTask.id, dependsOnTaskId: depId })
            )
          );
        }
      } else if (panelType === 'editTask' && selectedTaskId && activeTask) {
        await updateTaskMutation.mutateAsync({
          id: selectedTaskId,
          data: {
            title: data.title,
            status: data.status,
            weight: data.weight,
            parent_id: data.parent_id,
          },
        });

        const existingDeps = activeTask.dependencies ? activeTask.dependencies.map((d) => d.depends_on_task_id) : [];
        const addedDeps = data.dependencyIds.filter((id) => !existingDeps.includes(id));
        const removedDeps = existingDeps.filter((id) => !data.dependencyIds.includes(id));

        await Promise.all([
          ...addedDeps.map((depId) =>
            createTaskDepMutation.mutateAsync({ taskId: selectedTaskId, dependsOnTaskId: depId })
          ),
          ...removedDeps.map((depId) =>
            deleteTaskDepMutation.mutateAsync({ taskId: selectedTaskId, dependsOnTaskId: depId })
          ),
        ]);
      }
      handleClosePanel();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Gagal menyimpan task';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTaskId) return;
    setApiError(null);
    setIsSubmitting(true);
    try {
      await deleteTaskMutation.mutateAsync(selectedTaskId);
      setSelectedTaskId(null);
      handleClosePanel();
    } catch (err: any) {
      setApiError(err.response?.data?.error || 'Gagal menghapus task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* LEFT SIDEBAR PANEL: Tree navigation & filtering */}
      <div className="w-[360px] border-r border-slate-900 flex flex-col bg-slate-950 shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-900 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <h1 className="text-[20px] font-bold tracking-tight text-emerald-400">
              Project Tracker
            </h1>
          </div>
          
          {/* Main Action Buttons */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleOpenAddProject}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[12px] py-2 px-3 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Project
            </button>
            <button
              onClick={() => handleOpenAddTask()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[12px] py-2 px-3 rounded-lg font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Task
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-900 flex flex-col gap-2.5">
          {/* Text Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-900 rounded-lg pl-9 pr-3 py-1.5 text-[12px] text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-500 transition-colors"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-900 text-slate-300 rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
            >
              <option value="all">Semua Status Task</option>
              <option value="Draft">Draft</option>
              <option value="In_Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        {/* Dynamic Project Tree Explorer */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-12 text-slate-500 gap-2 text-[12px]">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Memuat proyek...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-[12px] text-slate-500 italic">Belum ada proyek.</div>
          ) : (
            projects.map((p) => {
              const isSelected = selectedProjectId === p.id;
              const filteredTree = isSelected ? getFilteredTaskTree() : [];
              
              return (
                <div
                  key={p.id}
                  className={`flex flex-col gap-1.5 p-2.5 rounded-xl border transition-colors ${
                    isSelected ? 'bg-slate-900/30 border-slate-800' : 'border-transparent hover:bg-slate-900/10'
                  }`}
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  {/* Project Row Header */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="text-[12px] font-bold text-slate-200 truncate cursor-pointer hover:text-slate-100">
                        {p.name}
                      </span>
                    </div>

                    {/* Project Controls on hover */}
                    <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddTask(p.id);
                        }}
                        title="Tambah Task Baru"
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Tasks list under Project (visible only if project selected) */}
                  {isSelected && (
                    <div className="mt-2 pl-1 flex flex-col gap-1 border-l border-slate-900">
                      {isLoadingTasks ? (
                        <div className="flex items-center gap-2 py-2 pl-3 text-[12px] text-slate-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          <span>Memuat tugas...</span>
                        </div>
                      ) : filteredTree.length === 0 ? (
                        <span className="text-[12px] text-slate-600 italic pl-3 py-1">Tidak ada tugas.</span>
                      ) : (
                        filteredTree.map((task) => (
                          <TaskTreeNode
                            key={task.id}
                            task={task}
                            depth={0}
                            onEditTask={handleOpenEditTask}
                            onAddSubtask={(parentId) => handleOpenAddTask(p.id, parentId)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT MAIN WORKSPACE VIEW */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
        
        {/* Workspace Header */}
        <div className="px-6 py-5 border-b border-slate-900 flex items-center justify-between">
          <div>
            <span className="text-[12px] text-slate-500 uppercase tracking-widest font-semibold">Workspace</span>
            <h2 className="text-[20px] font-bold text-slate-150">Detail Proyek aktif</h2>
          </div>
          {activeProject && (
            <button
              onClick={() => handleOpenEditProject(activeProject.id)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-slate-100 text-[12px] font-semibold py-1.5 px-3 rounded-lg transition-colors"
            >
              Edit Parameter Proyek
            </button>
          )}
        </div>

        {/* Workspace Body / Dashboard */}
        <div className="p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
          {activeProject ? (
            <div className="flex flex-col gap-6">
              
              {/* Project Card Stats Banner */}
              <div className="glass-card p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-[20px] font-extrabold tracking-tight text-slate-100">{activeProject.name}</h3>
                  <span className={`text-[12px] px-2.5 py-1 rounded-md font-semibold tracking-wide border ${
                    activeProject.status === 'Done'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : activeProject.status === 'In_Progress'
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {activeProject.status === 'In_Progress' ? 'In Progress' : activeProject.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center gap-3 text-[16px] text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Jadwal: {activeProject.start_date.split('T')[0]} s/d {activeProject.end_date.split('T')[0]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[16px] text-slate-400">
                    <ClipboardList className="w-4 h-4 text-slate-500" />
                    <span>Total Tugas: {tasks.length}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 pt-4 border-t border-slate-800/40">
                  <div className="flex justify-between text-[12px] font-semibold text-slate-400 mb-1.5">
                    <span>Progress Penyelesaian</span>
                    <span className="text-emerald-400">{activeProject.progress.toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-850">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${activeProject.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Tasks List */}
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[16px] font-bold text-slate-300">Daftar Rincian Tugas</h4>
                  <span className="text-[12px] text-slate-500">{filteredFlatTasks.length} Tugas</span>
                </div>

                <div className="bg-slate-900/20 border border-slate-900 rounded-2xl overflow-hidden">
                  {filteredFlatTasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-[14px]">
                      Belum ada tugas atau tidak ada tugas yang cocok dengan filter.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-900/50">
                      {filteredFlatTasks.map((t) => {
                        // Find parent title if subtask
                        const parentTask = t.parent_id ? tasks.find(pt => pt.id === t.parent_id) : null;
                        
                        return (
                          <div 
                            key={t.id}
                            onClick={() => handleOpenEditTask(t)}
                            className="group flex items-center justify-between p-4 hover:bg-slate-900/40 cursor-pointer transition-colors"
                          >
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {/* Status Icon */}
                                {t.status === 'Done' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : t.status === 'In_Progress' ? (
                                  <Play className="w-4 h-4 text-sky-400 shrink-0 fill-sky-400/20" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                                )}
                                
                                <span className={`text-[15px] font-semibold truncate ${
                                  t.status === 'Done' ? 'text-slate-500 line-through' : 'text-slate-200'
                                }`}>
                                  {t.title}
                                </span>
                              </div>
                              
                              {/* Subtask / Path Indicator */}
                              {parentTask && (
                                <span className="text-[11px] text-slate-500 pl-6">
                                  Subtask dari: <span className="text-slate-400 font-medium">{parentTask.title}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 shrink-0 pl-4">
                              {/* Weight Badge */}
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-900" title="Bobot Kerja">
                                <Weight className="w-3 h-3 text-slate-500" />
                                <span>{t.weight}</span>
                              </div>

                              {/* Status Badge */}
                              <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold tracking-wide border ${
                                t.status === 'Done'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : t.status === 'In_Progress'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }`}>
                                {t.status === 'In_Progress' ? 'In Progress' : t.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-16">
              <Folder className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-[20px] font-bold text-slate-400">Belum ada Proyek</h3>
              <p className="text-[16px] text-slate-500 mt-2">Silakan tambahkan proyek baru menggunakan tombol "+ Project" di sebelah kiri.</p>
            </div>
          )}
        </div>
      </div>

      {/* DYNAMIC SLIDING DRAWER PANEL */}
      <SlidingPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        title={
          panelType === 'addProject'
            ? 'Tambah Proyek Baru'
            : panelType === 'editProject'
            ? 'Edit Parameter Proyek'
            : panelType === 'addTask'
            ? 'Tambah Tugas Baru'
            : 'Edit Informasi Tugas'
        }
      >
        {panelType?.includes('Project') ? (
          <ProjectForm
            project={panelType === 'editProject' ? activeProject : null}
            onSave={handleSaveProject}
            onDelete={handleDeleteProject}
            onCancel={handleClosePanel}
            error={apiError}
            isSubmitting={isSubmitting}
          />
        ) : (
          <TaskForm
            task={
              panelType === 'editTask'
                ? activeTask
                : preSelectedProjectId
                ? ({
                    project_id: preSelectedProjectId,
                    parent_id: preSelectedParentId,
                    title: '',
                    weight: 1,
                    status: 'Draft',
                  } as any)
                : null
            }
            projects={projects}
            tasks={tasks}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            onCancel={handleClosePanel}
            error={apiError}
            isSubmitting={isSubmitting}
          />
        )}
      </SlidingPanel>

    </div>
  );
}
