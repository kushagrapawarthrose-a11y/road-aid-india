// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with Delhi NCR hospital records...');

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

  const hashedHospitalPassword = await bcrypt.hash('password123', 10);

  // 25 Hospitals across all Delhi NCR zones — Government + Private
  const hospitals = [
    // ── CENTRAL DELHI ─────────────────────────────────────────────────────────
    {
      name: 'All India Institute of Medical Sciences (AIIMS)',
      email: 'emergency@aiims.edu',
      password: hashedHospitalPassword,
      latitude: 28.5672,
      longitude: 77.2100,
      address: 'Ansari Nagar, New Delhi – 110029',
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
      latitude: 28.5694,
      longitude: 77.2057,
      address: 'Ansari Nagar East, New Delhi – 110029',
      phone: '+91 11 2673 0000',
      availableBeds: 22,
      totalBeds: 100,
      ventilators: 12,
      ambulances: 6,
      status: 'ACTIVE',
    },
    {
      name: 'Ram Manohar Lohia Hospital',
      email: 'rmlhospital@nic.in',
      password: hashedHospitalPassword,
      latitude: 28.6256,
      longitude: 77.2070,
      address: 'Baba Kharak Singh Marg, New Delhi – 110001',
      phone: '+91 11 2374 1000',
      availableBeds: 30,
      totalBeds: 120,
      ventilators: 10,
      ambulances: 7,
      status: 'ACTIVE',
    },
    {
      name: 'Lady Hardinge Medical College & Hospital',
      email: 'lhmc@nic.in',
      password: hashedHospitalPassword,
      latitude: 28.6349,
      longitude: 77.2115,
      address: 'Shaheed Bhagat Singh Marg, New Delhi – 110001',
      phone: '+91 11 2336 5525',
      availableBeds: 18,
      totalBeds: 90,
      ventilators: 6,
      ambulances: 4,
      status: 'ACTIVE',
    },
    {
      name: 'Lok Nayak Hospital',
      email: 'lnjp@delhi.gov.in',
      password: hashedHospitalPassword,
      latitude: 28.6425,
      longitude: 77.2358,
      address: 'Jawahar Lal Nehru Marg, New Delhi – 110002',
      phone: '+91 11 2323 2400',
      availableBeds: 35,
      totalBeds: 150,
      ventilators: 15,
      ambulances: 8,
      status: 'ACTIVE',
    },

    // ── SOUTH DELHI ───────────────────────────────────────────────────────────
    {
      name: 'Max Super Speciality Hospital, Saket',
      email: 'saket@maxhealthcare.com',
      password: hashedHospitalPassword,
      latitude: 28.5283,
      longitude: 77.2195,
      address: '1 & 2, Press Enclave Marg, Saket – 110017',
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
      address: 'Sector B, Pocket 1, Vasant Kunj – 110070',
      phone: '+91 11 4277 6222',
      availableBeds: 6,
      totalBeds: 40,
      ventilators: 3,
      ambulances: 2,
      status: 'ACTIVE',
    },
    {
      name: 'Apollo Cradle, Moti Bagh',
      email: 'motibagh@apollocradle.com',
      password: hashedHospitalPassword,
      latitude: 28.5725,
      longitude: 77.1799,
      address: 'R-2, Nehru Enclave, Moti Bagh – 110021',
      phone: '+91 11 4000 8000',
      availableBeds: 10,
      totalBeds: 50,
      ventilators: 5,
      ambulances: 3,
      status: 'ACTIVE',
    },
    {
      name: 'Venkateshwar Hospital, Dwarka',
      email: 'info@venkateshwarhospitals.com',
      password: hashedHospitalPassword,
      latitude: 28.5796,
      longitude: 77.0593,
      address: 'Sector 18A, Dwarka – 110075',
      phone: '+91 11 4511 1111',
      availableBeds: 12,
      totalBeds: 70,
      ventilators: 6,
      ambulances: 4,
      status: 'ACTIVE',
    },
    {
      name: 'Holy Family Hospital, Okhla',
      email: 'holyfamily@hfhdelhi.org',
      password: hashedHospitalPassword,
      latitude: 28.5432,
      longitude: 77.2737,
      address: 'Okhla Road, New Delhi – 110025',
      phone: '+91 11 2684 7000',
      availableBeds: 14,
      totalBeds: 65,
      ventilators: 5,
      ambulances: 3,
      status: 'ACTIVE',
    },

    // ── SOUTH-EAST DELHI ──────────────────────────────────────────────────────
    {
      name: 'Indraprastha Apollo Hospitals',
      email: 'apollo.delhi@apollohospitals.com',
      password: hashedHospitalPassword,
      latitude: 28.5360,
      longitude: 77.2862,
      address: 'Sarita Vihar, Mathura Road – 110076',
      phone: '+91 11 2692 5858',
      availableBeds: 18,
      totalBeds: 75,
      ventilators: 7,
      ambulances: 4,
      status: 'ACTIVE',
    },
    {
      name: 'Moolchand Medcity',
      email: 'moolchand@moolchandhealthcare.com',
      password: hashedHospitalPassword,
      latitude: 28.5685,
      longitude: 77.2378,
      address: 'Lala Lajpat Rai Marg, Lajpat Nagar – 110024',
      phone: '+91 11 4200 0000',
      availableBeds: 9,
      totalBeds: 45,
      ventilators: 4,
      ambulances: 2,
      status: 'ACTIVE',
    },
    {
      name: 'Primus Super Speciality Hospital, Chanakyapuri',
      email: 'info@primushospital.com',
      password: hashedHospitalPassword,
      latitude: 28.5949,
      longitude: 77.1875,
      address: 'Chandragupta Marg, Chanakyapuri – 110021',
      phone: '+91 11 6620 6630',
      availableBeds: 7,
      totalBeds: 38,
      ventilators: 3,
      ambulances: 2,
      status: 'ACTIVE',
    },

    // ── NORTH DELHI ───────────────────────────────────────────────────────────
    {
      name: 'Hindu Rao Hospital',
      email: 'hindurao@mcdonline.nic.in',
      password: hashedHospitalPassword,
      latitude: 28.6803,
      longitude: 77.2048,
      address: 'Malkaganj, Civil Lines – 110007',
      phone: '+91 11 2391 5503',
      availableBeds: 40,
      totalBeds: 160,
      ventilators: 14,
      ambulances: 9,
      status: 'ACTIVE',
    },
    {
      name: 'St. Stephen\'s Hospital',
      email: 'info@ststephenshospital.com',
      password: hashedHospitalPassword,
      latitude: 28.6636,
      longitude: 77.2302,
      address: 'Tis Hazari, Delhi – 110054',
      phone: '+91 11 2394 5222',
      availableBeds: 11,
      totalBeds: 55,
      ventilators: 5,
      ambulances: 3,
      status: 'ACTIVE',
    },
    {
      name: 'Max Super Speciality Hospital, Shalimar Bagh',
      email: 'shaligarbagh@maxhealthcare.com',
      password: hashedHospitalPassword,
      latitude: 28.7205,
      longitude: 77.1706,
      address: 'FC-50, Shalimar Bagh – 110088',
      phone: '+91 11 4055 4055',
      availableBeds: 13,
      totalBeds: 62,
      ventilators: 6,
      ambulances: 4,
      status: 'ACTIVE',
    },
    {
      name: 'BLK-Max Super Speciality Hospital',
      email: 'blkmax@maxhealthcare.com',
      password: hashedHospitalPassword,
      latitude: 28.6452,
      longitude: 77.1820,
      address: 'Pusa Road, Rajinder Nagar – 110005',
      phone: '+91 11 3040 3040',
      availableBeds: 16,
      totalBeds: 80,
      ventilators: 9,
      ambulances: 5,
      status: 'ACTIVE',
    },

    // ── EAST / NORTH-EAST DELHI ───────────────────────────────────────────────
    {
      name: 'GTB Hospital, Shahdara',
      email: 'gtbhospital@delhi.gov.in',
      password: hashedHospitalPassword,
      latitude: 28.6905,
      longitude: 77.3071,
      address: 'Dilshad Garden, Shahdara – 110095',
      phone: '+91 11 2238 7001',
      availableBeds: 28,
      totalBeds: 120,
      ventilators: 11,
      ambulances: 7,
      status: 'ACTIVE',
    },
    {
      name: 'Fortis Hospital, Noida',
      email: 'noida@fortishealthcare.com',
      password: hashedHospitalPassword,
      latitude: 28.5708,
      longitude: 77.3260,
      address: 'B-22, Sector 62, Noida – 201301',
      phone: '+91 120 4500 000',
      availableBeds: 20,
      totalBeds: 85,
      ventilators: 8,
      ambulances: 5,
      status: 'ACTIVE',
    },
    {
      name: 'Kailash Hospital, Noida',
      email: 'noida@kailashhealthcare.com',
      password: hashedHospitalPassword,
      latitude: 28.5678,
      longitude: 77.3491,
      address: 'H-33, Sector 27, Noida – 201301',
      phone: '+91 120 4888 000',
      availableBeds: 17,
      totalBeds: 75,
      ventilators: 7,
      ambulances: 4,
      status: 'ACTIVE',
    },

    // ── WEST DELHI / GURGAON ──────────────────────────────────────────────────
    {
      name: 'Medanta – The Medicity, Gurugram',
      email: 'info@medanta.org',
      password: hashedHospitalPassword,
      latitude: 28.4595,
      longitude: 77.0266,
      address: 'Sector 38, Gurugram – 122001',
      phone: '+91 124 4141 414',
      availableBeds: 25,
      totalBeds: 110,
      ventilators: 14,
      ambulances: 8,
      status: 'ACTIVE',
    },
    {
      name: 'Artemis Hospital, Gurugram',
      email: 'info@artemishospitals.com',
      password: hashedHospitalPassword,
      latitude: 28.4743,
      longitude: 77.0565,
      address: 'Sector 51, Gurugram – 122001',
      phone: '+91 124 4511 111',
      availableBeds: 19,
      totalBeds: 90,
      ventilators: 9,
      ambulances: 5,
      status: 'ACTIVE',
    },
    {
      name: 'Paras Hospital, Gurugram',
      email: 'gurugram@parashospitals.com',
      password: hashedHospitalPassword,
      latitude: 28.4517,
      longitude: 77.0699,
      address: 'C-1, Sushant Lok, Phase 1, Gurugram – 122002',
      phone: '+91 124 4585 555',
      availableBeds: 11,
      totalBeds: 52,
      ventilators: 5,
      ambulances: 3,
      status: 'ACTIVE',
    },

    // ── FARIDABAD / GHAZIABAD ─────────────────────────────────────────────────
    {
      name: 'Asian Hospital, Faridabad',
      email: 'info@asianhospitals.net',
      password: hashedHospitalPassword,
      latitude: 28.4036,
      longitude: 77.3065,
      address: 'Sector 21A, Faridabad – 121001',
      phone: '+91 129 4261 111',
      availableBeds: 14,
      totalBeds: 68,
      ventilators: 6,
      ambulances: 4,
      status: 'ACTIVE',
    },
    {
      name: 'Yashoda Hospital, Ghaziabad',
      email: 'ghaziabad@yashodahospital.com',
      password: hashedHospitalPassword,
      latitude: 28.6820,
      longitude: 77.4480,
      address: 'Near Raj Nagar, Ghaziabad – 201002',
      phone: '+91 120 4555 000',
      availableBeds: 16,
      totalBeds: 72,
      ventilators: 7,
      ambulances: 4,
      status: 'ACTIVE',
    },
  ];

  for (const hospital of hospitals) {
    const created = await prisma.hospital.create({ data: hospital });
    console.log(`✅ Created: ${created.name}`);
  }

  console.log(`\n🏥 Total hospitals seeded: ${hospitals.length}`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
