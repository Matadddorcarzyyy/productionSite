import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class AdminService {
  // Statistics
  async getStatistics() {
    const [
      totalUsers,
      totalClinics,
      totalDoctors,
      totalPatients,
      totalAppointments,
      verifiedClinics,
      pendingClinics,
      todayAppointments,
      confirmedAppointments,
      pendingAppointments,
      cancelledAppointments,
      usersByRole,
      appointmentsByStatus,
      recentUsers,
      recentAppointments,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.clinic.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.appointment.count(),

      // Clinic stats
      prisma.clinic.count({ where: { isVerified: true } }),
      prisma.clinic.count({ where: { isVerified: false } }),

      // Appointment stats
      prisma.appointment.count({
        where: {
          dateTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'CANCELLED' } }),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),

      // Appointments by status
      prisma.appointment.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Recent users (last 7 days)
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      // Recent appointments
      prisma.appointment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          clinic: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        totalClinics,
        totalDoctors,
        totalPatients,
        totalAppointments,
      },
      clinics: {
        total: totalClinics,
        verified: verifiedClinics,
        pending: pendingClinics,
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        confirmed: confirmedAppointments,
        pending: pendingAppointments,
        cancelled: cancelledAppointments,
        byStatus: appointmentsByStatus,
      },
      users: {
        total: totalUsers,
        byRole: usersByRole,
      },
      recent: {
        users: recentUsers,
        appointments: recentAppointments,
      },
    };
  }

  // Get all users
  async getAllUsers(filters?: { role?: UserRole; isActive?: boolean }) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          include: {
            clinic: {
              select: {
                name: true,
              },
            },
          },
        },
        clinicAdmins: {
          include: {
            clinic: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  // Get user by ID
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        doctor: {
          include: {
            clinic: true,
            specializations: {
              include: {
                specialization: true,
              },
            },
          },
        },
        clinicAdmins: {
          include: {
            clinic: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  // Update user
  async updateUser(userId: string, data: { isActive?: boolean; role?: UserRole; password?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // If password is provided, hash it
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Remove password from updateData if not provided (to avoid clearing it)
    if (!data.password) {
      delete updateData.password;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        patient: true,
        doctor: {
          include: {
            clinic: {
              select: {
                name: true,
              },
            },
          },
        },
        clinicAdmins: {
          include: {
            clinic: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return updatedUser;
  }

  // Create user (admin only)
  async createUser(data: {
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
  }) {
    const { email, password, phone, role, firstName, lastName } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with profile if needed
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        phone,
        role,
        ...(role === 'PATIENT' && firstName && lastName ? {
          patient: {
            create: {
              firstName,
              lastName,
            },
          },
        } : {}),
      },
      include: {
        patient: role === 'PATIENT',
      },
    });

    return user;
  }

  // Delete user
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent deleting SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN') {
      throw new AppError('Cannot delete SUPER_ADMIN user', 403);
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true, message: 'User deleted successfully' };
  }

  // Verify clinic
  async verifyClinic(clinicId: string, verify: boolean) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new AppError('Clinic not found', 404);
    }

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: { isVerified: verify },
      include: {
        doctors: true,
        admins: true,
      },
    });

    return updatedClinic;
  }

  // Get all clinics (including unverified)
  async getAllClinicsAdmin() {
    const clinics = await prisma.clinic.findMany({
      include: {
        doctors: {
          select: {
            id: true,
          },
        },
        admins: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
            doctors: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return clinics;
  }
}
