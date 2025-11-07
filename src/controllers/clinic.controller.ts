import { Request, Response, NextFunction } from 'express';
import { ClinicService } from '../services/clinic.service';
import { AuthRequest } from '../middleware/auth.middleware';

const clinicService = new ClinicService();

export class ClinicController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { specialization } = req.query;
      const clinics = await clinicService.getAllClinics({
        specialization: specialization as string
      });
      res.json(clinics);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const clinic = await clinicService.getClinicById(req.params.id);
      res.json(clinic);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const clinic = await clinicService.createClinic({
        ...req.body,
        adminUserId: req.user.userId
      });
      res.status(201).json(clinic);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const clinic = await clinicService.updateClinic(
        req.params.id,
        req.user.userId,
        req.body
      );
      res.json(clinic);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const result = await clinicService.deleteClinic(
        req.params.id,
        req.user.userId
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getDoctors(req: Request, res: Response, next: NextFunction) {
    try {
      const doctors = await clinicService.getClinicDoctors(req.params.id);
      res.json(doctors);
    } catch (error) {
      next(error);
    }
  }
}







