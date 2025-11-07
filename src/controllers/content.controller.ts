import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import { AuthRequest } from '../middleware/auth.middleware';

const contentService = new ContentService();

export class ContentController {
  // Получить весь контент (для админа)
  async getAllContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { language } = req.query;
      const content = await contentService.getAllContent(language as string);
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  // Получить контент для публичного API
  async getPublicContent(req: Request, res: Response, next: NextFunction) {
    try {
      const language = (req.query.language as string) || 'ro';
      const content = await contentService.getPublicContent(language);
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  // Получить контент по ключу
  async getContentByKey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const language = (req.query.language as string) || 'ro';
      const content = await contentService.getContentByKey(key, language);
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  // Создать или обновить контент
  async upsertContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key, language, value, description } = req.body;
      
      if (!key || !language || !value) {
        return res.status(400).json({ error: 'Key, language, and value are required' });
      }

      const content = await contentService.upsertContent({
        key,
        language,
        value,
        description,
      });

      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  // Обновить контент
  async updateContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { language, value, description } = req.body;

      if (!language) {
        return res.status(400).json({ error: 'Language is required' });
      }

      const content = await contentService.updateContent(key, language, {
        value,
        description,
      });

      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  // Удалить контент
  async deleteContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { language } = req.query;

      if (!language) {
        return res.status(400).json({ error: 'Language is required' });
      }

      const result = await contentService.deleteContent(key, language as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

