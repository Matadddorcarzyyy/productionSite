import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

interface CreateClinicData {
  name: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  logoUrl?: string;
  adminUserId: string;
}

interface UpdateClinicData {
  name?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export class ClinicService {
  async getAllClinics(filters?: { specialization?: string }) {
    const where: any = { isVerified: true };

    if (filters?.specialization) {
      where.doctors = {
        some: {
          specializations: {
            some: {
              specialization: {
                name: filters.specialization
              }
            }
          }
        }
      };
    }

    const clinics = await prisma.clinic.findMany({
      where,
      include: {
        doctors: {
          include: {
            specializations: {
              include: {
                specialization: true
              }
            }
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    // Calculate average rating
    return clinics.map((clinic: any) => ({
      ...clinic,
      averageRating: clinic.reviews.length > 0
        ? clinic.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / clinic.reviews.length
        : 0
    }));
  }

  async getClinicById(id: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            specializations: {
              include: {
                specialization: true
              }
            },
            reviews: {
              select: {
                rating: true,
                comment: true,
                createdAt: true,
                patient: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 10
            }
          }
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    });

    if (!clinic) {
      throw new AppError('Clinic not found', 404);
    }

    return clinic;
  }

  async createClinic(data: CreateClinicData) {
    const { adminUserId, ...clinicData } = data;

    const clinic = await prisma.clinic.create({
      data: {
        ...clinicData,
        admins: {
          create: {
            userId: adminUserId
          }
        }
      },
      include: {
        admins: true
      }
    });

    return clinic;
  }

  async updateClinic(id: string, userId: string, data: UpdateClinicData) {
    // Check if user is admin of this clinic
    const isAdmin = await this.isClinicAdmin(id, userId);

    if (!isAdmin) {
      throw new AppError('Not authorized to update this clinic', 403);
    }

    const clinic = await prisma.clinic.update({
      where: { id },
      data
    });

    return clinic;
  }

  async deleteClinic(id: string, userId: string) {
    // Check if user is admin of this clinic
    const isAdmin = await this.isClinicAdmin(id, userId);

    if (!isAdmin) {
      throw new AppError('Not authorized to delete this clinic', 403);
    }

    await prisma.clinic.delete({
      where: { id }
    });

    return { message: 'Clinic deleted successfully' };
  }

  async getClinicDoctors(clinicId: string) {
    const doctors = await prisma.doctor.findMany({
      where: { clinicId },
      include: {
        specializations: {
          include: {
            specialization: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      }
    });

    return doctors.map((doctor: any) => ({
      ...doctor,
      averageRating: doctor.reviews.length > 0
        ? doctor.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / doctor.reviews.length
        : 0
    }));
  }

  async isClinicAdmin(clinicId: string, userId: string): Promise<boolean> {
    const admin = await prisma.clinicAdmin.findFirst({
      where: {
        clinicId,
        userId
      }
    });

    return !!admin;
  }
}







