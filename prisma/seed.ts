import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create specializations (upsert to avoid duplicates)
  const stomatology = await prisma.specialization.upsert({
    where: { name: 'Stomatologie' },
    update: {},
    create: {
      name: 'Stomatologie',
      description: 'Dentistry and oral health',
      icon: '🦷'
    }
  });

  const orthodontics = await prisma.specialization.upsert({
    where: { name: 'Ortodonție' },
    update: {},
    create: {
      name: 'Ortodonție',
      description: 'Teeth alignment and braces',
      icon: '😁'
    }
  });

  const therapy = await prisma.specialization.upsert({
    where: { name: 'Terapie' },
    update: {},
    create: {
      name: 'Terapie',
      description: 'General medical therapy',
      icon: '💊'
    }
  });

  const surgery = await prisma.specialization.upsert({
    where: { name: 'Chirurgie' },
    update: {},
    create: {
      name: 'Chirurgie',
      description: 'Surgical procedures',
      icon: '🏥'
    }
  });

  console.log('✅ Specializations created');

  // Create clinic admin user (upsert to avoid duplicates)
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@naturalsmile.com' },
    update: {},
    create: {
      email: 'admin@naturalsmile.com',
      password: adminPassword,
      phone: '+40123456789',
      role: 'CLINIC_ADMIN'
    }
  });

  // Create clinic (find or create to avoid duplicates)
  let clinic = await prisma.clinic.findFirst({
    where: { name: 'Natural Smile & Design' }
  });

  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: 'Natural Smile & Design',
        description: 'Clinică stomatologică modernă cu echipamente de ultimă generație',
        address: 'Str. Mihail Kogălniceanu 34, București 050064, România',
        latitude: 44.4377,
        longitude: 26.0968,
        phone: '+40212345678',
        email: 'contact@naturalsmile.com',
        logoUrl: '/images/natural-smile-logo.png',
        isVerified: true,
        admins: {
          create: {
            userId: adminUser.id
          }
        }
      }
    });
  }

  console.log('✅ Clinic created');

  // Create doctor users and doctors (upsert to avoid duplicates)
  const doctor1Password = await bcrypt.hash('Doctor123!', 10);
  const doctor1User = await prisma.user.upsert({
    where: { email: 'natalia.spoiala@naturalsmile.com' },
    update: {},
    create: {
      email: 'natalia.spoiala@naturalsmile.com',
      password: doctor1Password,
      phone: '+40123456790',
      role: 'DOCTOR'
    }
  });

  const doctor1 = await prisma.doctor.upsert({
    where: { userId: doctor1User.id },
    update: {},
    create: {
      userId: doctor1User.id,
      clinicId: clinic.id,
      firstName: 'Natalia',
      lastName: 'Spoială',
      photoUrl: '/images/doctors/natalia-spoiala.jpg',
      bio: 'Medic ortodont cu peste 10 ani de experiență',
      rating: 4.8,
      specializations: {
        create: [
          { specializationId: orthodontics.id },
          { specializationId: stomatology.id }
        ]
      }
    }
  });

  const doctor2Password = await bcrypt.hash('Doctor123!', 10);
  const doctor2User = await prisma.user.upsert({
    where: { email: 'daniela.leonte@naturalsmile.com' },
    update: {},
    create: {
      email: 'daniela.leonte@naturalsmile.com',
      password: doctor2Password,
      phone: '+40123456791',
      role: 'DOCTOR'
    }
  });

  const doctor2 = await prisma.doctor.upsert({
    where: { userId: doctor2User.id },
    update: {},
    create: {
      userId: doctor2User.id,
      clinicId: clinic.id,
      firstName: 'Daniela',
      lastName: 'Leonte',
      photoUrl: '/images/doctors/daniela-leonte.jpg',
      bio: 'Medic terapeut specializat în tratamente conservatoare',
      rating: 4.9,
      specializations: {
        create: [
          { specializationId: therapy.id },
          { specializationId: stomatology.id }
        ]
      }
    }
  });

  console.log('✅ Doctors created');

  // Create schedules for doctors (Monday to Friday, 8:00-18:00)
  for (let day = 1; day <= 5; day++) {
    const existingSchedule1 = await prisma.schedule.findFirst({
      where: {
        doctorId: doctor1.id,
        dayOfWeek: day
      }
    });
    
    if (!existingSchedule1) {
      await prisma.schedule.create({
        data: {
          doctorId: doctor1.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '18:00',
          breakStart: '12:00',
          breakEnd: '13:00'
        }
      });
    }

    const existingSchedule2 = await prisma.schedule.findFirst({
      where: {
        doctorId: doctor2.id,
        dayOfWeek: day
      }
    });

    if (!existingSchedule2) {
      await prisma.schedule.create({
        data: {
          doctorId: doctor2.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '18:00',
          breakStart: '12:00',
          breakEnd: '13:00'
        }
      });
    }
  }

  console.log('✅ Schedules created');

  // Create sample patient (upsert to avoid duplicates)
  const patientPassword = await bcrypt.hash('Patient123!', 10);
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      email: 'patient@example.com',
      password: patientPassword,
      phone: '+40123456792',
      role: 'PATIENT'
    }
  });

  const patient = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      firstName: 'Ion',
      lastName: 'Popescu',
      birthDate: new Date('1990-05-15'),
      notes: 'Alergie la peniciline'
    }
  });

  console.log('✅ Sample patient created');

  // Create sample appointment (skip if exists)
  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 7);
  appointmentDate.setHours(10, 0, 0, 0);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      doctorId: doctor1.id,
      dateTime: appointmentDate
    }
  });

  if (!existingAppointment) {
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor1.id,
        clinicId: clinic.id,
        dateTime: appointmentDate,
        duration: 30,
        status: 'CONFIRMED',
        notes: 'Consultație inițială',
        confirmed: true,
        smsSent: true
      }
    });
    console.log('✅ Sample appointment created');
  } else {
    console.log('✅ Sample appointment already exists');
  }

  // Create SUPER_ADMIN user (upsert to avoid duplicates)
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@admin.com' },
    update: {},
    create: {
      email: 'superadmin@admin.com',
      password: superAdminPassword,
      phone: '+40123456793',
      role: 'SUPER_ADMIN'
    }
  });

  console.log('✅ Super Admin created');

  console.log('\n📊 Seed Summary:');
  console.log('==================');
  console.log('Super Admin (для админ-панели):');
  console.log('  Email: superadmin@admin.com');
  console.log('  Password: SuperAdmin123!');
  console.log('\nClinic Admin:');
  console.log('  Email: admin@naturalsmile.com');
  console.log('  Password: Admin123!');
  console.log('\nDoctors:');
  console.log('  1. natalia.spoiala@naturalsmile.com / Doctor123!');
  console.log('  2. daniela.leonte@naturalsmile.com / Doctor123!');
  console.log('\nPatient:');
  console.log('  Email: patient@example.com');
  console.log('  Password: Patient123!');
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e.message || e);
    // Don't exit with error code - allow the app to continue
    console.log('⚠️ Continuing despite seed errors...');
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


