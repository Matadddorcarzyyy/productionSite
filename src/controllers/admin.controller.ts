import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthRequest } from '../middleware/auth.middleware';

const adminService = new AdminService();

export class AdminController {
  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getStatistics();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role, isActive } = req.query;
      const users = await adminService.getAllUsers({
        role: role as any,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await adminService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await adminService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteUser(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { password } = req.body;
      if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }
      await adminService.updateUser(req.params.id, { password });
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async verifyClinic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { verify } = req.body;
      const clinic = await adminService.verifyClinic(req.params.id, verify !== false);
      res.json(clinic);
    } catch (error) {
      next(error);
    }
  }

  async getAllClinicsAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinics = await adminService.getAllClinicsAdmin();
      res.json(clinics);
    } catch (error) {
      next(error);
    }
  }
}

