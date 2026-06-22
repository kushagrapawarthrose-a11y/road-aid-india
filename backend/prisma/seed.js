// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Indian hospital records...');

  // Clean existing data
  await prisma.incident.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@roadaid.in',
      name: 'RoadAid India Administrator',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created Admin User:', admin.email);

  // Hash hospital password
  const hashedHospitalPassword = await bcrypt.hash('password123', 10);

  // Indian Hospitals (Delhi NCR Area)
  const hospitals = [
    {
      name: 'All India Institute of Medical Sciences (AIIMS)',
      email: 'emergency@aiims.edu',
      password: hashedHospitalPassword,
      latitude: 28.5672,
      longitude: 77.2100,
      address: 'Ansari Nagar, New Delhi, Delhi 110029',
      phone: '+91 11 2658 8500',
      availableBeds: 15,
      totalBeds: 80,
      ventilators: 8,
      ambulances: 5,
      status: 'ACTIVE',
    },
    {
      name: 'Safdarjung Hospital',
      email: 'emergency@safdarjunghospital.gov.in',
      password: hashedHospitalPassword,
      latitude: 28.5678,
      longitude: 77.2057,
      address: 'Ansari Nagar East, New Delhi, Delhi 110029',
      phone: '+91 11 2673 0000',
      availableBeds: 22,
      totalBeds: 100,
      ventilators: 12,
      ambulances: 6,
      status: 'ACTIVE',
    },
    {
      name: 'Max Super Speciality Hospital, Saket',
      email: 'saket@maxhealthcare.com',
      password: hashedHospitalPassword,
      latitude: 28.5283,
      longitude: 77.2195,
      address: '1 & 2, Press Enclave Marg, Saket, New Delhi, Delhi 110017',
      phone: '+91 11 2651 5050',
      availableBeds: 8,
      totalBeds: 60,
      ventilators: 4,
      ambulances: 3,
      status: 'ACTIVE',
    },
    {
      name: 'Fortis Flt. Lt. Rajan Dhall Hospital, Vasant Kunj',
      email: 'vasantkunj@fortishealthcare.com',
      password: hashedHospitalPassword,
      latitude: 28.5235,
      longitude: 77.1610,
      address: 'Sector B, Pocket 1, Vasant Kunj, New Delhi, Delhi 110070',
      phone: '+91 11 4277 6222',
      availableBeds: 6,
      totalBeds: 40,
      ventilators: 3,
      ambulances: 2,
      status: 'ACTIVE',
    },
    {
      name: 'Indraprastha Apollo Hospitals',
      email: 'apollo.delhi@apollohospitals.com',
      password: hashedHospitalPassword,
      latitude: 28.5360,
      longitude: 77.2862,
      address: 'Sarita Vihar, Mathura Road, New Delhi, Delhi 110076',
      phone: '+91 11 2692 5858',
      availableBeds: 18,
      totalBeds: 75,
      ventilators: 7,
      ambulances: 4,
      status: 'ACTIVE',
    }
  ];

  for (const hospital of hospitals) {
    const created = await prisma.hospital.create({
      data: hospital,
    });
    console.log(`Created Hospital: ${created.name} (${created.email})`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
