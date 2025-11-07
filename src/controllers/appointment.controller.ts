import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppointmentStatus } from '@prisma/client';

const appointmentService = new AppointmentService();

export class AppointmentController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patientId, doctorId, clinicId, status, dateFrom, dateTo } = req.query;

      const appointments = await appointmentService.getAppointments({
        patientId: patientId as string,
        doctorId: doctorId as string,
        clinicId: clinicId as string,
        status: status as AppointmentStatus,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      });

      res.json(appointments);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentService.getAppointmentById(req.params.id);
      res.json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const appointment = await appointmentService.createAppointment(req.body);
      res.status(201).json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Confirmation code is required' });
      }

      const appointment = await appointmentService.confirmAppointment(
        req.params.id,
        code
      );
      res.json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const appointment = await appointmentService.updateAppointment(
        req.params.id,
        req.body,
        req.user.userId
      );
      res.json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const appointment = await appointmentService.cancelAppointment(
        req.params.id,
        req.user.userId
      );
      res.json(appointment);
    } catch (error) {
      next(error);
    }
  }

  async getClinicCalendar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { dateFrom, dateTo } = req.query;

      if (!dateFrom || !dateTo) {
        return res.status(400).json({ error: 'dateFrom and dateTo are required' });
      }

      const appointments = await appointmentService.getClinicCalendar(
        req.params.clinicId,
        new Date(dateFrom as string),
        new Date(dateTo as string),
        req.user.userId
      );

      res.json(appointments);
    } catch (error) {
      next(error);
    }
  }
}







