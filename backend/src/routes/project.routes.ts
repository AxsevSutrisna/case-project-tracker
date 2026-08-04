import { Router } from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/project.service';
import { TaskService } from '../services/task.service';
import { DependencyService } from '../services/dependency.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1, 'Nama proyek wajib diisi'),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Tanggal mulai tidak valid').transform((val) => new Date(val)),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Tanggal selesai tidak valid').transform((val) => new Date(val)),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Tanggal mulai tidak valid').transform((val) => new Date(val)).optional(),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Tanggal selesai tidak valid').transform((val) => new Date(val)).optional(),
});

const projectDependencySchema = z.object({
  depends_on_project_id: z.number().int('ID proyek dependensi harus integer'),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const projects = await ProjectService.listProjects();
    res.json(projects);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createProjectSchema.parse(req.body);
    const newProject = await ProjectService.createProject(body);
    res.status(201).json(newProject);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const project = await ProjectService.getProject(id);
    if (!project) {
      res.status(404).json({ error: 'Proyek tidak ditemukan' });
      return;
    }
    res.json(project);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const body = updateProjectSchema.parse(req.body);
    const updated = await ProjectService.updateProject(id, body);
    res.json(updated);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await ProjectService.deleteProject(id);
    res.json({ success: true });
  })
);

router.get(
  '/:id/tasks',
  asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    const tasksTree = await TaskService.listTasksTree(projectId);
    res.json(tasksTree);
  })
);

router.post(
  '/:id/dependencies',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { depends_on_project_id } = projectDependencySchema.parse(req.body);
    const dependency = await DependencyService.addProjectDependency(id, depends_on_project_id);
    res.status(201).json(dependency);
  })
);

router.delete(
  '/:id/dependencies/:dependsOnId',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const dependsOnId = parseInt(req.params.dependsOnId, 10);
    await DependencyService.removeProjectDependency(id, dependsOnId);
    res.json({ success: true });
  })
);

export default router;
