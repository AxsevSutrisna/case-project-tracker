import { Router } from 'express';
import { z } from 'zod';
import { TaskService } from '../services/task.service';
import { DependencyService } from '../services/dependency.service';
import { asyncHandler } from '../utils/asyncHandler';
import { Status } from '@prisma/client';

const router = Router();

// Zod schemas for validation
const taskStatusSchema = z.enum(['Draft', 'In Progress', 'Done']);

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

// POST /api/tasks
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = createTaskSchema.parse(req.body);
    // Map string "In Progress" to Prisma Status enum "In_Progress"
    const prismaStatus = body.status === 'In Progress' ? Status.In_Progress : (body.status as Status);
    
    const newTask = await TaskService.createTask({
      ...body,
      status: prismaStatus,
    });
    res.status(201).json(newTask);
  })
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const body = updateTaskSchema.parse(req.body);
    
    let prismaStatus: Status | undefined;
    if (body.status) {
      prismaStatus = body.status === 'In Progress' ? Status.In_Progress : (body.status as Status);
    }

    const updated = await TaskService.updateTask(id, {
      ...body,
      status: prismaStatus,
    });
    res.json(updated);
  })
);

// DELETE /api/tasks/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await TaskService.deleteTask(id);
    res.json({ success: true });
  })
);

// POST /api/tasks/:id/dependencies
router.post(
  '/:id/dependencies',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { depends_on_task_id } = taskDependencySchema.parse(req.body);
    const dependency = await DependencyService.addTaskDependency(id, depends_on_task_id);
    res.status(201).json(dependency);
  })
);

// DELETE /api/tasks/:id/dependencies/:dependsOnId
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
