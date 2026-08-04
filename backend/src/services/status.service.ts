import prisma from '../db';
import { Status } from '@prisma/client';

export class StatusService {
  static async recalculateProject(projectId: number): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        dependencies: {
          include: { depends_on_project: true },
        },
      },
    });

    if (!project) return;

    const tasks = project.tasks;
    let progress = 0.0;
    let derivedStatus: Status = Status.Draft;

    if (tasks.length > 0) {
      const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);
      const doneWeight = tasks.reduce((sum, t) => sum + (t.status === Status.Done ? t.weight : 0), 0);
      progress = totalWeight > 0 ? (doneWeight / totalWeight) * 100 : 0.0;

      const allDraft = tasks.every((t) => t.status === Status.Draft);
      const allDone = tasks.every((t) => t.status === Status.Done);

      if (allDraft) {
        derivedStatus = Status.Draft;
      } else if (allDone) {
        derivedStatus = Status.Done;
      } else {
        derivedStatus = Status.In_Progress;
      }
    } else {
      progress = 0.0;
      derivedStatus = Status.Draft;
    }

    const activeDeps = project.dependencies;
    const hasUnfinishedDeps = activeDeps.some((dep) => dep.depends_on_project.status !== Status.Done);

    if (hasUnfinishedDeps) {
      derivedStatus = Status.Draft;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        progress,
        status: derivedStatus,
      },
    });

    await this.propagateProjectStatusChange(projectId);
  }

  static async propagateProjectStatusChange(projectId: number): Promise<void> {
    const dependents = await prisma.projectDependency.findMany({
      where: { depends_on_project_id: projectId },
      select: { project_id: true },
    });

    for (const dep of dependents) {
      await this.recalculateProject(dep.project_id);
    }
  }

  static async propagateTaskStatusChange(taskId: number): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) return;

    if (task.status !== Status.Done) {
      const dependents = await prisma.taskDependency.findMany({
        where: { depends_on_task_id: taskId },
        include: {
          task: true,
        },
      });

      for (const dep of dependents) {
        if (dep.task.status === Status.Done) {
          await prisma.task.update({
            where: { id: dep.task_id },
            data: { status: Status.In_Progress },
          });

          await this.propagateTaskStatusChange(dep.task_id);
        }
      }
    }

    await this.recalculateProject(task.project_id);
  }
}
