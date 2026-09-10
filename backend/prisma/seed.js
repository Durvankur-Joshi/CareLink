const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const existingPatients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    include: { patient: true }
  });

  for (const p of existingPatients) {
    if (!p.patient) {
      await prisma.patient.create({
        data: { userId: p.id }
      });
    }
  }

  const existingDoctors = await prisma.user.findMany({
    where: { role: 'DOCTOR' },
    include: { doctor: true }
  });

  for (const d of existingDoctors) {
    if (!d.doctor) {
      await prisma.doctor.create({
        data: {
          userId: d.id,
          specialization: 'General Medicine',
          qualification: 'MBBS, MD',
          experience: 8,
          consultationFee: 500,
          bio: 'Experienced medical practitioner providing comprehensive care.'
        }
      });
    }
  }

  const demoDoctors = [
    {
      name: 'Dr. Ananya Sharma',
      email: 'ananya.sharma@example.com',
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD (Cardiology)',
      experience: 10,
      consultationFee: 800,
      bio: 'Specialist in cardiovascular health, heart disease prevention and non-invasive cardiology.'
    },
    {
      name: 'Dr. Rahul Patil',
      email: 'rahul.patil@example.com',
      specialization: 'Dermatologist',
      qualification: 'MBBS, MD (Dermatology)',
      experience: 7,
      consultationFee: 600,
      bio: 'Expert in clinical dermatology, skin health, and advanced dermatological care.'
    },
    {
      name: 'Dr. Priya Deshmukh',
      email: 'priya.deshmukh@example.com',
      specialization: 'General Physician',
      qualification: 'MBBS, MD (Internal Medicine)',
      experience: 12,
      consultationFee: 500,
      bio: 'Comprehensive primary care, chronic disease management, and preventive medicine.'
    }
  ];

  for (const doc of demoDoctors) {
    const existing = await prisma.user.findUnique({
      where: { email: doc.email },
      include: { doctor: true }
    });

    if (!existing) {
      const user = await prisma.user.create({
        data: {
          name: doc.name,
          email: doc.email,
          passwordHash,
          role: 'DOCTOR'
        }
      });

      await prisma.doctor.create({
        data: {
          userId: user.id,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experience: doc.experience,
          consultationFee: doc.consultationFee,
          bio: doc.bio
        }
      });
    } else if (!existing.doctor) {
      await prisma.doctor.create({
        data: {
          userId: existing.id,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experience: doc.experience,
          consultationFee: doc.consultationFee,
          bio: doc.bio
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
