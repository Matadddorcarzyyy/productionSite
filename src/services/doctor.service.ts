import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { getDayOfWeek, formatTime, addMinutes } from '../utils/date.util';
import bcrypt from 'bcryptjs';

interface CreateDoctorData {
  email: string;
  password: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  bio?: string;
  specializationIds: string[];
}

interface UpdateDoctorData {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  bio?: string;
  specializationIds?: string[];
}

interface ScheduleData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface AvailabilityData {
  date: string; // ISO date string
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export class DoctorService {
  async getAllDoctors(filters?: { clinicId?: string; specializationId?: string }) {
    const where: any = {};

    if (filters?.clinicId) {
      where.clinicId = filters.clinicId;
    }

    if (filters?.specializationId) {
      where.specializations = {
        some: {
          specializationId: filters.specializationId
        }
      };
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        clinic: true,
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

  async getDoctorById(id: string) {
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id },
        include: {
          clinic: true,
          specializations: {
            include: {
              specialization: true
            }
          },
          schedules: true,
          availabilities: {
            where: {
              date: {
                gte: new Date() // Only future dates
              }
            },
            orderBy: {
              date: 'asc'
            }
          },
          reviews: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }

      return doctor;
    } catch (error: any) {
      // If availabilities table doesn't exist yet, try without it
      if (error?.code === 'P2021' || error?.message?.includes('availabilities') || error?.message?.includes('does not exist')) {
        const doctor = await prisma.doctor.findUnique({
          where: { id },
          include: {
            clinic: true,
            specializations: {
              include: {
                specialization: true
              }
            },
            schedules: true,
            reviews: {
              include: {
                patient: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        });

        if (!doctor) {
          throw new AppError('Doctor not found', 404);
        }

        // Add empty availabilities array
        return { ...doctor, availabilities: [] };
      }
      throw error;
    }
  }

  async createDoctor(data: CreateDoctorData, adminUserId: string) {
    const { email, password, clinicId, specializationIds, ...doctorData } = data;

    // Verify admin has access to this clinic
    const isAdmin = await prisma.clinicAdmin.findFirst({
      where: {
        clinicId,
        userId: adminUserId
      }
    });

    if (!isAdmin) {
      throw new AppError('Not authorized to add doctors to this clinic', 403);
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and doctor
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'DOCTOR'
      }
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        clinicId,
        ...doctorData,
        specializations: {
          create: specializationIds.map(specId => ({
            specializationId: specId
          }))
        }
      },
      include: {
        specializations: {
          include: {
            specialization: true
          }
        }
      }
    });

    return doctor;
  }

  async updateDoctor(id: string, data: UpdateDoctorData, userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if user is admin of the clinic
    const isAdmin = await prisma.clinicAdmin.findFirst({
      where: {
        clinicId: doctor.clinicId,
        userId
      }
    });

    if (!isAdmin) {
      throw new AppError('Not authorized to update this doctor', 403);
    }

    const { specializationIds, ...updateData } = data;

    // Update doctor
    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        ...updateData,
        ...(specializationIds && {
          specializations: {
            deleteMany: {},
            create: specializationIds.map(specId => ({
              specializationId: specId
            }))
          }
        })
      },
      include: {
        specializations: {
          include: {
            specialization: true
          }
        }
      }
    });

    return updatedDoctor;
  }

  async deleteDoctor(id: string, userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    const isAdmin = await prisma.clinicAdmin.findFirst({
      where: {
        clinicId: doctor.clinicId,
        userId
      }
    });

    if (!isAdmin) {
      throw new AppError('Not authorized to delete this doctor', 403);
    }

    await prisma.doctor.delete({
      where: { id }
    });

    return { message: 'Doctor deleted successfully' };
  }

  async createSchedule(doctorId: string, schedules: ScheduleData[], userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if user is the doctor or admin
    const isDoctor = doctor.userId === userId;
    const isAdmin = await prisma.clinicAdmin.findFirst({
      where: {
        clinicId: doctor.clinicId,
        userId
      }
    });

    if (!isDoctor && !isAdmin) {
      throw new AppError('Not authorized to manage this doctor\'s schedule', 403);
    }

    // Delete existing schedules
    await prisma.schedule.deleteMany({
      where: { doctorId }
    });

    // Create new schedules
    const created = await prisma.schedule.createMany({
      data: schedules.map(schedule => ({
        doctorId,
        ...schedule
      }))
    });

    return created;
  }

  async updateAvailabilities(doctorId: string, availabilities: AvailabilityData[], userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if user is the doctor
    if (doctor.userId !== userId) {
      throw new AppError('Not authorized to manage this doctor\'s availability', 403);
    }

    try {
      // Delete all existing future availabilities
      await prisma.availability.deleteMany({
        where: {
          doctorId,
          date: {
            gte: new Date()
          }
        }
      });

      // Create new availabilities if any
      if (availabilities.length > 0) {
        const created = await prisma.availability.createMany({
          data: availabilities.map(availability => ({
            doctorId,
            date: new Date(availability.date),
            startTime: availability.startTime,
            endTime: availability.endTime,
            breakStart: availability.breakStart || null,
            breakEnd: availability.breakEnd || null,
          }))
        });

        return created;
      }

      return { count: 0 };
    } catch (error: any) {
      // If availabilities table doesn't exist yet, silently skip (graceful degradation)
      // The user can still use weekly schedule, just not specific dates
      if (
        error?.code === 'P2021' || 
        error?.code === 'P2001' ||
        error?.message?.toLowerCase().includes('availabilities') || 
        error?.message?.toLowerCase().includes('does not exist') ||
        error?.message?.toLowerCase().includes('relation') ||
        error?.message?.toLowerCase().includes('table')
      ) {
        console.warn('⚠️ Availability table does not exist. Skipping availability update. Please run migration: npx prisma migrate dev --name add_availability_model');
        // Return success but with count 0 to indicate nothing was saved
        return { count: 0, skipped: true };
      }
      // Re-throw other errors
      throw error;
    }
  }

  async getAvailabilities(doctorId: string, userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if user is the doctor
    if (doctor.userId !== userId) {
      throw new AppError('Not authorized to view this doctor\'s availability', 403);
    }

    try {
      const availabilities = await prisma.availability.findMany({
        where: {
          doctorId,
          date: {
            gte: new Date() // Only future dates
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      return availabilities;
    } catch (error: any) {
      // If availabilities table doesn't exist yet, return empty array
      if (error?.code === 'P2021' || error?.message?.includes('availabilities') || error?.message?.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  async deleteAvailability(doctorId: string, availabilityId: string, userId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if user is the doctor
    if (doctor.userId !== userId) {
      throw new AppError('Not authorized to delete this availability', 403);
    }

    try {
      const availability = await prisma.availability.findUnique({
        where: { id: availabilityId }
      });

      if (!availability || availability.doctorId !== doctorId) {
        throw new AppError('Availability not found', 404);
      }

      await prisma.availability.delete({
        where: { id: availabilityId }
      });

      return { message: 'Availability deleted successfully' };
    } catch (error: any) {
      // If availabilities table doesn't exist yet, throw helpful error
      if (error?.code === 'P2021' || error?.message?.includes('availabilities') || error?.message?.includes('does not exist')) {
        throw new AppError('Availability table does not exist. Please run database migration first.', 500);
      }
      throw error;
    }
  }

  async getAvailableSlots(doctorId: string, date: Date) {
    let doctor;
    try {
      doctor = await prisma.doctor.findUnique({
        where: { id: doctorId },
        include: {
          schedules: true,
          availabilities: true
        }
      });
    } catch (error: any) {
      // If availabilities table doesn't exist yet, try without it
      if (error?.code === 'P2021' || error?.message?.includes('availabilities') || error?.message?.includes('does not exist')) {
        doctor = await prisma.doctor.findUnique({
          where: { id: doctorId },
          include: {
            schedules: true
          }
        });
        if (doctor) {
          (doctor as any).availabilities = [];
        }
      } else {
        throw error;
      }
    }

    if (!doctor) {
      throw new AppError('Doctor not found', 404);
    }

    // Check if there's a specific availability for this date
    const dateStr = date.toISOString().split('T')[0];
    const doctorWithAvailabilities = doctor as any;
    const specificAvailability = (doctorWithAvailabilities.availabilities || []).find((a: any) => {
      const availDateStr = new Date(a.date).toISOString().split('T')[0];
      return availDateStr === dateStr;
    });

    let schedule: { startTime: string; endTime: string; breakStart?: string; breakEnd?: string } | null = null;

    if (specificAvailability) {
      // Use specific availability
      schedule = {
        startTime: specificAvailability.startTime,
        endTime: specificAvailability.endTime,
        breakStart: specificAvailability.breakStart || undefined,
        breakEnd: specificAvailability.breakEnd || undefined,
      };
    } else {
      // Use regular schedule for day of week
      const dayOfWeek = getDayOfWeek(date);
      const regularSchedule = doctor.schedules.find((s: any) => s.dayOfWeek === dayOfWeek);
      
      if (!regularSchedule) {
        return []; // No schedule for this day
      }

      schedule = {
        startTime: regularSchedule.startTime,
        endTime: regularSchedule.endTime,
        breakStart: regularSchedule.breakStart || undefined,
        breakEnd: regularSchedule.breakEnd || undefined,
      };
    }

    if (!schedule) {
      return [];
    }

    // Get existing appointments for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        dateTime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    // Generate available slots (30-minute intervals)
    const slots: string[] = [];
    const slotDuration = 30; // minutes

    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTime) {
      const timeString = formatTime(currentTime);

      // Check if slot is during break
      const isDuringBreak = schedule.breakStart && schedule.breakEnd &&
        timeString >= schedule.breakStart && timeString < schedule.breakEnd;

      // Check if slot is already booked
      const isBooked = appointments.some((apt: any) => {
        const aptTime = formatTime(apt.dateTime);
        return aptTime === timeString;
      });

      if (!isDuringBreak && !isBooked) {
        slots.push(timeString);
      }

      currentTime = addMinutes(currentTime, slotDuration);
    }

    return slots;
  }
}







