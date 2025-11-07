import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../config/jwt';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '@prisma/client';

interface RegisterData {
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData) {
    const { email, password, phone, role, firstName, lastName } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and patient profile together
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
              lastName
            }
          }
        } : {})
      },
      include: {
        patient: role === 'PATIENT'
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        patient: user.patient || undefined
      },
      token
    };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patient: true,
        doctor: {
          include: {
            clinic: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.isActive === false) {
      throw new AppError('Account is deactivated', 403);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        patient: user.patient,
        doctor: user.doctor
      },
      token
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        patient: true,
        doctor: {
          include: {
            clinic: true,
            specializations: {
              include: {
                specialization: true
              }
            }
          }
        },
        clinicAdmins: {
          include: {
            clinic: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}






