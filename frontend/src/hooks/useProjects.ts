import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export interface ProjectType {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Draft' | 'In_Progress' | 'Done';
  progress: number;
}

export function useProjects() {
  return useQuery<ProjectType[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await axios.get('/api/projects');
      return res.data;
    },
  });
}

export function useProjectDetail(id: number | null) {
  return useQuery<ProjectType>({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('ID Proyek tidak valid');
      const res = await axios.get(`/api/projects/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; start_date: string; end_date: string }) => {
      const res = await axios.post('/api/projects', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name?: string; start_date?: string; end_date?: string } }) => {
      const res = await axios.put(`/api/projects/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.delete(`/api/projects/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
