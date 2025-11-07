import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AppointmentStatus } from '@prisma/client';
import { sendSMS, generateSMSCode } from '../config/twilio';

interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  clinicId: string;
  dateTime: Date;
  notes?: string;
  duration?: number;
}

interface UpdateAppointmentData {
  dateTime?: Date;
  status?: AppointmentStatus;
  notes?: string;
  adminNotes?: string;
}

export class AppointmentService {
  async getAppointments(filters?: {
    patientId?: string;
    doctorId?: string;
    clinicId?: string;
    status?: AppointmentStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const where: any = {};

    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.doctorId) where.doctorId = filters.doctorId;
    if (filters?.clinicId) where.clinicId = filters.clinicId;
    if (filters?.status) where.status = filters.status;

    if (filters?.dateFrom || filters?.dateTo) {
      where.dateTime = {};
      if (filters.dateFrom) where.dateTime.gte = filters.dateFrom;
      if (filters.dateTo) where.dateTime.lte = filters.dateTo;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true,
                phone: true
              }
            }
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            photoUrl: true
          }
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    return appointments;
  }

  async getAppointmentById(id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                email: true,
                phone: true
              }
            }
          }
        },
        doctor: {
          include: {
            specializations: {
              include: {
                specialization: true
              }
            }
          }
        },
        clinic: true
      }
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    return appointment;
  }

  async createAppointment(data: CreateAppointmentData) {
    const { patientId, doctorId, clinicId, dateTime, notes, duration = 30 } = data;

    // Check if slot is available
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        dateTime,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (existingAppointment) {
      throw new AppError('This time slot is already booked', 400);
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true
      }
    });

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    // Generate SMS code
    const smsCode = generateSMSCode();

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        clinicId,
        dateTime,
        notes,
        duration,
        smsCode,
        status: 'PENDING'
      },
      include: {
        doctor: {
          include: {
            clinic: true
          }
        }
      }
    });

    // Send SMS confirmation code
    if (patient.user.phone) {
      const message = `Your appointment confirmation code is: ${smsCode}. Valid for 10 minutes.`;
      await sendSMS(patient.user.phone, message);
      
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { smsSent: true }
      });
    }

    return appointment;
  }

  async confirmAppointment(id: string, code: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    if (appointment.confirmed) {
      throw new AppError('Appointment already confirmed', 400);
    }

    if (appointment.smsCode !== code) {
      throw new AppError('Invalid confirmation code', 400);
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        confirmed: true,
        status: 'CONFIRMED'
      },
      include: {
        patient: {
          include: {
            user: true
          }
        },
        doctor: true,
        clinic: true
      }
    });

    // Send confirmation SMS
    if (updatedAppointment.patient.user.phone) {
      const formattedDate = updatedAppointment.dateTime.toLocaleDateString('ro-RO');
      const formattedTime = updatedAppointment.dateTime.toLocaleTimeString('ro-RO', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const message = `Your appointment at ${updatedAppointment.clinic.name} with Dr. ${updatedAppointment.doctor.lastName} on ${formattedDate} at ${formattedTime} is confirmed!`;
      await sendSMS(updatedAppointment.patient.user.phone, message);
    }

    return updatedAppointment;
  }

  async updateAppointment(id: string, data: UpdateAppointmentData, userId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true
          }
        },
        doctor: true
      }
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    // Check authorization (patient or clinic admin)
    const isPatient = appointment.patient.userId === userId;
    const isClinicAdmin = await prisma.clinicAdmin.findFirst({
      where: {
        clinicId: appointment.clinicId,
        userId
      }
    });

    if (!isPatient && !isClinicAdmin) {
      throw new AppError('Not authorized to update this appointment', 403);
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data
    });

    return updatedAppointment;
  }

  async cancelAppointment(id: string, userId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: true
          }
        }
      }
    });

    if (!appointment) {
      throw new AppError('Appointment not found', 404);
    }

    const isPatient = appointment.patient.userId === userId;
    const isClinicAdmin = await prisma.clinicAdmin.findFirst({
      where: {
        clinicId: appointment.clinicId,
        userId
      }
    });

    if (!isPatient && !isClinicAdmin) {
      throw new AppError('Not authorized to cancel this appointment', 403);
    }

    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    // Send cancellation SMS
    if (appointment.patient.user.phone) {
      const message = `Your appointment has been cancelled. Please contact the clinic for more information.`;
      await sendSMS(appointment.patient.user.phone, message);
    }

    return cancelledAppointment;
  }

  async getClinicCalendar(clinicId: string, dateFrom: Date, dateTo: Date, userId: string) {
    // Check if user is admin of this clinic
    const isAdmin = await prisma.clinicAdmin.findFirst({
      where: {
        clinicId,
        userId
      }
    });

    if (!isAdmin) {
      throw new AppError('Not authorized to view this calendar', 403);
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        dateTime: {
          gte: dateFrom,
          lte: dateTo
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                phone: true,
                email: true
              }
            }
          }
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    return appointments;
  }
}







