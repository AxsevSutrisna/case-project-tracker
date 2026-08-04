import { Router } from 'express';
import { z } from 'zod';
import { TaskService } from '../services/task.service';
import { DependencyService } from '../services/dependency.service';
import { asyncHandler } from '../utils/asyncHandler';
import { Status } from '@prisma/client';

const router = Router();

const taskStatusSchema = z.enum(['Draft', 'In_Progress', 'Done']);

const createTaskSchema = z.object({
  project_id: z.number().int('ID proyek harus berupa integer'),
  parent_id: z.number().int().nullable().optional(),
  title: z.string().min(1, 'Judul tugas wajib diisi'),
  status: taskStatusSchema.optional(),
  weight: z.number().int().min(1, 'Bobot tugas minimal bernilai 1'),
  sort_order: z.number().int().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  status: taskStatusSchema.optional(),
  weight: z.number().int().min(1).optional(),
  parent_id: z.number().int().nullable().optional(),
  sort_order: z.number().int().optional(),
});

const taskDependencySchema = z.object({
  depends_on_task_id: z.number().int('ID tugas dependensi harus integer'),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createTaskSchema.parse(req.body);
    
    const newTask = await TaskService.createTask({
      ...body,
      status: body.status as Status,
    });
    res.status(201).json(newTask);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const body = updateTaskSchema.parse(req.body);

    const updated = await TaskService.updateTask(id, {
      ...body,
      status: body.status as Status,
    });
    res.json(updated);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await TaskService.deleteTask(id);
    res.json({ success: true });
  })
);

router.post(
  '/:id/dependencies',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { depends_on_task_id } = taskDependencySchema.parse(req.body);
    const dependency = await DependencyService.addTaskDependency(id, depends_on_task_id);
    res.status(201).json(dependency);
  })
);

router.delete(
  '/:id/dependencies/:dependsOnId',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const dependsOnId = parseInt(req.params.dependsOnId, 10);
    await DependencyService.removeTaskDependency(id, dependsOnId);
    res.json({ success: true });
  })
);

export default router;
