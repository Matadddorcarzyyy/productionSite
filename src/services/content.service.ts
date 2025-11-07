import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

export class ContentService {
  // Получить весь контент
  async getAllContent(language?: string) {
    const where: any = {};
    if (language) {
      where.language = language;
    }

    const content = await prisma.siteContent.findMany({
      where,
      orderBy: [
        { key: 'asc' },
        { language: 'asc' },
      ],
    });

    return content;
  }

  // Получить контент по ключу и языку
  async getContentByKey(key: string, language: string = 'ro') {
    const content = await prisma.siteContent.findUnique({
      where: {
        key_language: {
          key,
          language,
        },
      },
    });

    return content;
  }

  // Создать или обновить контент
  async upsertContent(data: {
    key: string;
    language: string;
    value: string;
    description?: string;
  }) {
    const content = await prisma.siteContent.upsert({
      where: {
        key_language: {
          key: data.key,
          language: data.language,
        },
      },
      update: {
        value: data.value,
        description: data.description,
      },
      create: {
        key: data.key,
        language: data.language,
        value: data.value,
        description: data.description,
      },
    });

    return content;
  }

  // Обновить контент
  async updateContent(key: string, language: string, data: { value?: string; description?: string }) {
    const content = await prisma.siteContent.findUnique({
      where: {
        key_language: {
          key,
          language,
        },
      },
    });

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    const updated = await prisma.siteContent.update({
      where: {
        key_language: {
          key,
          language,
        },
      },
      data,
    });

    return updated;
  }

  // Удалить контент
  async deleteContent(key: string, language: string) {
    const content = await prisma.siteContent.findUnique({
      where: {
        key_language: {
          key,
          language,
        },
      },
    });

    if (!content) {
      throw new AppError('Content not found', 404);
    }

    await prisma.siteContent.delete({
      where: {
        key_language: {
          key,
          language,
        },
      },
    });

    return { success: true, message: 'Content deleted successfully' };
  }

  // Получить контент для публичного API (без админских полей)
  async getPublicContent(language: string = 'ro') {
    const content = await prisma.siteContent.findMany({
      where: {
        language,
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Преобразуем в объект для удобства
    const contentMap: Record<string, string> = {};
    content.forEach((item: any) => {
      contentMap[item.key] = item.value;
    });

    return contentMap;
  }
}

