import { PrismaClient, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Cleaning database...');
  await prisma.taskDependency.deleteMany({});
  await prisma.projectDependency.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});

  console.log('[seed] Creating projects...');
  // 3 Projects with non-overlapping schedules
  const projectAlpha = await prisma.project.create({
    data: {
      name: 'Project Alpha (Design & Foundation)',
      status: Status.Draft,
      progress: 0.0,
      start_date: new Date('2026-08-01T00:00:00Z'),
      end_date: new Date('2026-08-10T23:59:59Z'),
    },
  });

  const projectBeta = await prisma.project.create({
    data: {
      name: 'Project Beta (API Development)',
      status: Status.Draft,
      progress: 0.0,
      start_date: new Date('2026-08-11T00:00:00Z'),
      end_date: new Date('2026-08-20T23:59:59Z'),
    },
  });

  const projectGamma = await prisma.project.create({
    data: {
      name: 'Project Gamma (UI Integration)',
      status: Status.Draft,
      progress: 0.0,
      start_date: new Date('2026-08-21T00:00:00Z'),
      end_date: new Date('2026-08-30T23:59:59Z'),
    },
  });

  console.log('[seed] Creating project dependencies...');
  // Project Beta depends on Project Alpha
  await prisma.projectDependency.create({
    data: {
      project_id: projectBeta.id,
      depends_on_project_id: projectAlpha.id,
    },
  });

  // Project Gamma depends on Project Beta
  await prisma.projectDependency.create({
    data: {
      project_id: projectGamma.id,
      depends_on_project_id: projectBeta.id,
    },
  });

  console.log('[seed] Creating tasks for Project Alpha...');
  // Task 1 (no parent)
  const task1 = await prisma.task.create({
    data: {
      project_id: projectAlpha.id,
      title: 'Task 1: Requirements Gathering',
      status: Status.Draft,
      weight: 2,
      sort_order: 1,
    },
  });

  // Task 2 (parent of subtasks)
  const task2 = await prisma.task.create({
    data: {
      project_id: projectAlpha.id,
      title: 'Task 2: Database Setup',
      status: Status.Draft,
      weight: 1,
      sort_order: 2,
    },
  });

  // Subtask 2.1 (child of Task 2)
  const subtask2_1 = await prisma.task.create({
    data: {
      project_id: projectAlpha.id,
      parent_id: task2.id,
      title: 'Subtask 2.1: Schema Design',
      status: Status.Draft,
      weight: 1,
      sort_order: 1,
    },
  });

  // Subtask 2.2 (child of Task 2)
  const subtask2_2 = await prisma.task.create({
    data: {
      project_id: projectAlpha.id,
      parent_id: task2.id,
      title: 'Subtask 2.2: Docker Container Mapping',
      status: Status.Draft,
      weight: 3,
      sort_order: 2,
    },
  });

  // Task 3 (depends on Task 2 / Database Setup)
  const task3 = await prisma.task.create({
    data: {
      project_id: projectAlpha.id,
      title: 'Task 3: Backend REST Services Implementation',
      status: Status.Draft,
      weight: 5,
      sort_order: 3,
    },
  });

  console.log('[seed] Creating task dependencies...');
  // Subtask 2.2 depends on Subtask 2.1 (Setup db container depends on schema design)
  await prisma.taskDependency.create({
    data: {
      task_id: subtask2_2.id,
      depends_on_task_id: subtask2_1.id,
    },
  });

  // Task 3 depends on Task 2 (Backend logic depends on database setup being ready)
  await prisma.taskDependency.create({
    data: {
      task_id: task3.id,
      depends_on_task_id: task2.id,
    },
  });

  console.log('[seed] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
