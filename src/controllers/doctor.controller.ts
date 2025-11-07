import { Request, Response, NextFunction } from 'express';
import { DoctorService } from '../services/doctor.service';
import { AuthRequest } from '../middleware/auth.middleware';

const doctorService = new DoctorService();

export class DoctorController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { clinicId, specializationId } = req.query;
      const doctors = await doctorService.getAllDoctors({
        clinicId: clinicId as string,
        specializationId: specializationId as string
      });
      res.json(doctors);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.id);
      res.json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const doctor = await doctorService.createDoctor(
        req.body,
        req.user.userId
      );
      res.status(201).json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const doctor = await doctorService.updateDoctor(
        req.params.id,
        req.body,
        req.user.userId
      );
      res.json(doctor);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const result = await doctorService.deleteDoctor(
        req.params.id,
        req.user.userId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const schedule = await doctorService.createSchedule(
        req.params.id,
        req.body.schedules,
        req.user.userId
      );
      res.status(201).json(schedule);
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }

      // Parse date string (YYYY-MM-DD) correctly to avoid timezone issues
      const dateStr = date as string;
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day); // month is 0-indexed

      console.log('📅 getAvailableSlots called:', {
        doctorId: req.params.id,
        dateString: dateStr,
        parsedDate: dateObj.toISOString()
      });

      const slots = await doctorService.getAvailableSlots(
        req.params.id,
        dateObj
      );
      
      console.log('✅ Returning slots:', slots.length, 'slots');
      
      res.json(slots);
    } catch (error) {
      console.error('❌ Error in getAvailableSlots:', error);
      next(error);
    }
  }

  async updateAvailabilities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const result = await doctorService.updateAvailabilities(
        req.params.id,
        req.body.availabilities,
        req.user.userId
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getAvailabilities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const availabilities = await doctorService.getAvailabilities(
        req.params.id,
        req.user.userId
      );
      res.json(availabilities);
    } catch (error) {
      next(error);
    }
  }

  async deleteAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const result = await doctorService.deleteAvailability(
        req.params.id,
        req.params.availabilityId,
        req.user.userId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}







