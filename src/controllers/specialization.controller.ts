import { Request, Response, NextFunction } from 'express';
import { SpecializationService } from '../services/specialization.service';

const specializationService = new SpecializationService();

export class SpecializationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const specializations = await specializationService.getAllSpecializations();
      res.json(specializations);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const specialization = await specializationService.getSpecializationById(req.params.id);
      res.json(specialization);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const specialization = await specializationService.createSpecialization(req.body);
      res.status(201).json(specialization);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const specialization = await specializationService.updateSpecialization(
        req.params.id,
        req.body
      );
      res.json(specialization);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await specializationService.deleteSpecialization(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}







