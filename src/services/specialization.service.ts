import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

interface CreateSpecializationData {
  name: string;
  description?: string;
  icon?: string;
}

export class SpecializationService {
  async getAllSpecializations() {
    const specializations = await prisma.specialization.findMany({
      include: {
        _count: {
          select: {
            doctors: true
          }
        }
      }
    });

    return specializations;
  }

  async getSpecializationById(id: string) {
    const specialization = await prisma.specialization.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            doctor: {
              include: {
                clinic: true
              }
            }
          }
        }
      }
    });

    if (!specialization) {
      throw new AppError('Specialization not found', 404);
    }

    return specialization;
  }

  async createSpecialization(data: CreateSpecializationData) {
    const specialization = await prisma.specialization.create({
      data
    });

    return specialization;
  }

  async updateSpecialization(id: string, data: Partial<CreateSpecializationData>) {
    const specialization = await prisma.specialization.update({
      where: { id },
      data
    });

    return specialization;
  }

  async deleteSpecialization(id: string) {
    // Check if any doctors have this specialization
    const doctorCount = await prisma.doctorSpecialization.count({
      where: { specializationId: id }
    });

    if (doctorCount > 0) {
      throw new AppError('Cannot delete specialization with assigned doctors', 400);
    }

    await prisma.specialization.delete({
      where: { id }
    });

    return { message: 'Specialization deleted successfully' };
  }
}







