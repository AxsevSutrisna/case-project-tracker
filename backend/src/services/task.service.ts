import prisma from '../db';
import { Status } from '@prisma/client';
import { BusinessRuleError } from '../errors';
import { StatusService } from './status.service';

export class TaskService {
  static async createTask(data: {
    project_id: number;
    parent_id?: number | null;
    title: string;
    status?: Status;
    weight: number;
    sort_order?: number;
  }) {
    if (data.weight < 1) {
      throw new BusinessRuleError('Bobot task minimal bernilai 1');
    }

    const project = await prisma.project.findUnique({ where: { id: data.project_id } });
    if (!project) {
      throw new BusinessRuleError('Proyek tidak ditemukan');
    }

    if (data.parent_id) {
      const parentTask = await prisma.task.findUnique({ where: { id: data.parent_id } });
      if (!parentTask) {
        throw new BusinessRuleError('Parent task tidak ditemukan');
      }
      if (parentTask.project_id !== data.project_id) {
        throw new BusinessRuleError('Parent task harus berada di proyek yang sama');
      }
    }

    const task = await prisma.task.create({
      data: {
        project_id: data.project_id,
        parent_id: data.parent_id ?? null,
        title: data.title,
        status: data.status ?? Status.Draft,
        weight: data.weight,
        sort_order: data.sort_order ?? 0,
      },
    });

    // Recalculate project progress & status
    await StatusService.recalculateProject(task.project_id);

    return task;
  }

  static async updateTask(
    id: number,
    data: {
      title?: string;
      status?: Status;
      weight?: number;
      parent_id?: number | null;
      sort_order?: number;
    }
  ) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        dependencies: {
          include: { depends_on_task: true },
        },
      },
    });

    if (!task) {
      throw new BusinessRuleError('Task tidak ditemukan');
    }

    // Task Status Guard:
    // A task cannot be changed to Done if any dependency is not Done.
    if (data.status === Status.Done && task.status !== Status.Done) {
      const activeDeps = task.dependencies;
      const unfinishedDeps = activeDeps.some((dep) => dep.depends_on_task.status !== Status.Done);

      if (unfinishedDeps) {
        throw new BusinessRuleError('Task tidak dapat berubah ke status Done jika salah satu dependency belum Done');
      }
    }

    if (data.weight !== undefined && data.weight < 1) {
      throw new BusinessRuleError('Bobot task minimal bernilai 1');
    }

    if (data.parent_id) {
      if (data.parent_id === id) {
        throw new BusinessRuleError('Task tidak boleh menjadi parent dari dirinya sendiri');
      }
      const parentTask = await prisma.task.findUnique({ where: { id: data.parent_id } });
      if (!parentTask) {
        throw new BusinessRuleError('Parent task tidak ditemukan');
      }
      if (parentTask.project_id !== task.project_id) {
        throw new BusinessRuleError('Parent task harus berada di proyek yang sama');
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
        weight: data.weight,
        parent_id: data.parent_id === null ? null : data.parent_id,
        sort_order: data.sort_order,
      },
    });

    // Handle status propagation if status changed
    if (data.status && data.status !== task.status) {
      await StatusService.propagateTaskStatusChange(id);
    } else {
      // Recalculate progress/status if weight or parent changes
      await StatusService.recalculateProject(task.project_id);
    }

    return updatedTask;
  }

  static async getTask(id: number) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        dependencies: {
          include: { depends_on_task: true },
        },
      },
    });
  }

  static async deleteTask(id: number) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new BusinessRuleError('Task tidak ditemukan');
    }

    const result = await prisma.task.delete({ where: { id } });

    // Recalculate project progress & status after deletion
    await StatusService.recalculateProject(task.project_id);

    return result;
  }

  /**
   * Returns tasks organized in a hierarchical tree for a specific project
   */
  static async listTasksTree(projectId: number) {
    const allTasks = await prisma.task.findMany({
      where: { project_id: projectId },
      include: {
        dependencies: {
          select: {
            depends_on_task_id: true,
          },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    return allTasks;
  }
}
