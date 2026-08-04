import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { TaskType } from '../components/TaskTreeNode';

export function useTasksTree(projectId: number | null) {
  return useQuery<TaskType[]>({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await axios.get(`/api/projects/${projectId}/tasks`);
      return res.data;
    },
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      project_id: number;
      parent_id: number | null;
      title: string;
      status: 'Draft' | 'In_Progress' | 'Done';
      weight: number;
    }) => {
      const res = await axios.post('/api/tasks', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        title?: string;
        status?: 'Draft' | 'In_Progress' | 'Done';
        weight?: number;
        parent_id?: number | null;
      };
    }) => {
      const res = await axios.put(`/api/tasks/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.delete(`/api/tasks/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useCreateTaskDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, dependsOnTaskId }: { taskId: number; dependsOnTaskId: number }) => {
      const res = await axios.post(`/api/tasks/${taskId}/dependencies`, {
        depends_on_task_id: dependsOnTaskId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTaskDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, dependsOnTaskId }: { taskId: number; dependsOnTaskId: number }) => {
      const res = await axios.delete(`/api/tasks/${taskId}/dependencies/${dependsOnTaskId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
