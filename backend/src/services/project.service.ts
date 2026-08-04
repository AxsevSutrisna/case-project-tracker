import prisma from '../db';
import { BusinessRuleError } from '../errors';

export class ProjectService {
  static async validateProjectSchedule(startDate: Date, endDate: Date, excludeProjectId?: number) {
    if (startDate > endDate) {
      throw new BusinessRuleError('Tanggal mulai tidak boleh setelah tanggal selesai');
    }
    
    const conflict = await prisma.project.findFirst({
      where: {
        id: excludeProjectId ? { not: excludeProjectId } : undefined,
        AND: [
          { start_date: { lte: endDate } },
          { end_date: { gte: startDate } },
        ],
      },
    });

    if (conflict) {
      throw new BusinessRuleError(
        `Jadwal proyek berbenturan dengan proyek "${conflict.name}" (${conflict.start_date.toISOString().split('T')[0]} s/d ${conflict.end_date.toISOString().split('T')[0]})`,
        conflict
      );
    }
  }

  static async createProject(data: { name: string; start_date: Date; end_date: Date }) {
    await this.validateProjectSchedule(data.start_date, data.end_date);

    return prisma.project.create({
      data: {
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        status: 'Draft',
        progress: 0.0,
      },
    });
  }

  static async updateProject(id: number, data: { name?: string; start_date?: Date; end_date?: Date }) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new BusinessRuleError('Proyek tidak ditemukan');
    }

    const resolvedStartDate = data.start_date ?? project.start_date;
    const resolvedEndDate = data.end_date ?? project.end_date;

    if (data.start_date || data.end_date) {
      await this.validateProjectSchedule(resolvedStartDate, resolvedEndDate, id);
    }

    return prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        start_date: resolvedStartDate,
        end_date: resolvedEndDate,
      },
    });
  }

  static async getProject(id: number) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        dependencies: {
          include: { depends_on_project: true },
        },
      },
    });
  }

  static async listProjects() {
    return prisma.project.findMany({
      orderBy: { start_date: 'asc' },
    });
  }

  static async deleteProject(id: number) {
    return prisma.project.delete({
      where: { id },
    });
  }
}
