import prisma from '../db';
import { Status } from '@prisma/client';

export class StatusService {
  /**
   * Recalculates project progress and updates project status based on task status.
   * Also enforces project dependency rules: if any dependency project is not Done,
   * the project status is forced to Draft.
   */
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

    // Project Dependency status guard:
    // If any dependency project is not Done, this project cannot be In_Progress or Done.
    // So we force it to Draft.
    const activeDeps = project.dependencies;
    const hasUnfinishedDeps = activeDeps.some((dep) => dep.depends_on_project.status !== Status.Done);

    if (hasUnfinishedDeps) {
      derivedStatus = Status.Draft;
    }

    // Update project in DB
    await prisma.project.update({
      where: { id: projectId },
      data: {
        progress,
        status: derivedStatus,
      },
    });

    // If the project status changed, propagate it to dependent projects
    await this.propagateProjectStatusChange(projectId);
  }

  /**
   * Recursively pulls back dependent projects if this project's status changed.
   * If Project B's status is not Done, any Project A that depends on B must be pulled back.
   */
  static async propagateProjectStatusChange(projectId: number): Promise<void> {
    // Find all project dependencies where this project is the depends_on project
    const dependents = await prisma.projectDependency.findMany({
      where: { depends_on_project_id: projectId },
      select: { project_id: true },
    });

    for (const dep of dependents) {
      // Recalculate each dependent project which will check dependencies and status
      await this.recalculateProject(dep.project_id);
    }
  }

  /**
   * Recursively pulls back dependent tasks if a task's status changes from Done to something else.
   * If Task B is not Done, any Task A that depends on B cannot be Done.
   */
  static async propagateTaskStatusChange(taskId: number): Promise<void> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) return;

    // If task is not Done, propagate to all tasks that depend on it
    if (task.status !== Status.Done) {
      const dependents = await prisma.taskDependency.findMany({
        where: { depends_on_task_id: taskId },
        include: {
          task: true,
        },
      });

      for (const dep of dependents) {
        if (dep.task.status === Status.Done) {
          // Pull back status to In_Progress
          await prisma.task.update({
            where: { id: dep.task_id },
            data: { status: Status.In_Progress },
          });

          // Recursively propagate the change for this dependent task
          await this.propagateTaskStatusChange(dep.task_id);
        }
      }
    }

    // Always recalculate project progress and status when any task status changes
    await this.recalculateProject(task.project_id);
  }
}
