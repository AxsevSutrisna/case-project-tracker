import prisma from '../db';
import { BusinessRuleError } from '../errors';

async function hasTaskPath(fromId: number, toId: number, visited = new Set<number>()): Promise<boolean> {
  if (fromId === toId) return true;
  if (visited.has(fromId)) return false;
  visited.add(fromId);

  const dependencies = await prisma.taskDependency.findMany({
    where: { task_id: fromId },
    select: { depends_on_task_id: true },
  });

  for (const dep of dependencies) {
    if (await hasTaskPath(dep.depends_on_task_id, toId, visited)) {
      return true;
    }
  }

  return false;
}

async function hasProjectPath(fromId: number, toId: number, visited = new Set<number>()): Promise<boolean> {
  if (fromId === toId) return true;
  if (visited.has(fromId)) return false;
  visited.add(fromId);

  const dependencies = await prisma.projectDependency.findMany({
    where: { project_id: fromId },
    select: { depends_on_project_id: true },
  });

  for (const dep of dependencies) {
    if (await hasProjectPath(dep.depends_on_project_id, toId, visited)) {
      return true;
    }
  }

  return false;
}

export class DependencyService {
  static async addTaskDependency(taskId: number, dependsOnTaskId: number) {
    if (taskId === dependsOnTaskId) {
      throw new BusinessRuleError('Task tidak boleh bergantung pada dirinya sendiri');
    }

    const [task, dependsOnTask] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.task.findUnique({ where: { id: dependsOnTaskId } }),
    ]);

    if (!task || !dependsOnTask) {
      throw new BusinessRuleError('Salah satu atau kedua task tidak ditemukan');
    }

    if (task.project_id !== dependsOnTask.project_id) {
      throw new BusinessRuleError('Task dependency harus dalam project yang sama');
    }

    const createsCycle = await hasTaskPath(dependsOnTaskId, taskId);
    if (createsCycle) {
      throw new BusinessRuleError('Circular dependency terdeteksi antar task');
    }

    const existing = await prisma.taskDependency.findUnique({
      where: {
        task_id_depends_on_task_id: {
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.taskDependency.create({
      data: {
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
      },
    });
  }

  static async removeTaskDependency(taskId: number, dependsOnTaskId: number) {
    return prisma.taskDependency.delete({
      where: {
        task_id_depends_on_task_id: {
          task_id: taskId,
          depends_on_task_id: dependsOnTaskId,
        },
      },
    });
  }

  static async addProjectDependency(projectId: number, dependsOnProjectId: number) {
    if (projectId === dependsOnProjectId) {
      throw new BusinessRuleError('Project tidak boleh bergantung pada dirinya sendiri');
    }

    const [project, dependsOnProject] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.project.findUnique({ where: { id: dependsOnProjectId } }),
    ]);

    if (!project || !dependsOnProject) {
      throw new BusinessRuleError('Salah satu atau kedua project tidak ditemukan');
    }

    const createsCycle = await hasProjectPath(dependsOnProjectId, projectId);
    if (createsCycle) {
      throw new BusinessRuleError('Circular dependency terdeteksi antar project');
    }

    const existing = await prisma.projectDependency.findUnique({
      where: {
        project_id_depends_on_project_id: {
          project_id: projectId,
          depends_on_project_id: dependsOnProjectId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.projectDependency.create({
      data: {
        project_id: projectId,
        depends_on_project_id: dependsOnProjectId,
      },
    });
  }

  static async removeProjectDependency(projectId: number, dependsOnProjectId: number) {
    return prisma.projectDependency.delete({
      where: {
        project_id_depends_on_project_id: {
          project_id: projectId,
          depends_on_project_id: dependsOnProjectId,
        },
      },
    });
  }
}
