// backend/src/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const auth = require('./middleware/auth');

// Initialize Prisma
const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Helper: Haversine distance in KM
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Helper: Travel time calculation (assuming average Indian city traffic speed is 30 km/h)
function getTravelTimeMinutes(distanceKm) {
  const avgSpeedKmh = 30;
  const timeHours = distanceKm / avgSpeedKmh;
  return Math.ceil(timeHours * 60); // returns minutes
}

// AUTHENTICATION ROUTES
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body; // role: ADMIN or HOSPITAL
  try {
    if (role === 'ADMIN') {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ error: 'Admin not found' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ error: 'Invalid password' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'ADMIN', name: user.name },
        process.env.JWT_SECRET || 'roadaid_secret_key_123',
        { expiresIn: '24h' }
      );
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: 'ADMIN' } });
    } else {
      const hospital = await prisma.hospital.findUnique({ where: { email } });
      if (!hospital) return res.status(400).json({ error: 'Hospital not found' });

      const valid = await bcrypt.compare(password, hospital.password);
      if (!valid) return res.status(400).json({ error: 'Invalid password' });

      const token = jwt.sign(
        { id: hospital.id, email: hospital.email, role: 'HOSPITAL', name: hospital.name },
        process.env.JWT_SECRET || 'roadaid_secret_key_123',
        { expiresIn: '24h' }
      );
      return res.json({ token, user: { id: hospital.id, email: hospital.email, name: hospital.name, role: 'HOSPITAL' } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// HOSPITAL API
app.get('/api/hospitals', async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany();
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve hospitals' });
  }
});

app.get('/api/hospitals/me', auth, async (req, res) => {
  if (req.user.role !== 'HOSPITAL') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const hospital = await prisma.hospital.findUnique({ where: { id: req.user.id } });
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve hospital details' });
  }
});

app.put('/api/hospitals/me', auth, async (req, res) => {
  if (req.user.role !== 'HOSPITAL') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { availableBeds, ventilators, ambulances, status } = req.body;
  try {
    const updated = await prisma.hospital.update({
      where: { id: req.user.id },
      data: {
        availableBeds: parseInt(availableBeds) || 0,
        ventilators: parseInt(ventilators) || 0,
        ambulances: parseInt(ambulances) || 0,
        status: status || 'ACTIVE',
      },
    });
    // Broadcast hospital update to admins
    io.to('admin').emit('hospital_updated', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update hospital resources' });
  }
});

// INCIDENT REPORTING APIS
app.post('/api/incidents', upload.single('photo'), async (req, res) => {
  const {
    reporterName,
    reporterPhone,
    latitude,
    longitude,
    locationName,
    severity,
    injuredCount,
    description,
  } = req.body;

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Invalid coordinates provided' });
  }

  try {
    // 1. Fetch active hospitals to find closest matching
    const hospitals = await prisma.hospital.findMany({
      where: { status: { in: ['ACTIVE', 'BUSY'] } },
    });

    let nearestHospital = null;
    let minDistance = Infinity;

    hospitals.forEach((h) => {
      const dist = getDistance(lat, lon, h.latitude, h.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestHospital = h;
      }
    });

    // Mock photo upload path if file sent
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // AI severity calculation simulation if photo present but not provided severity
    let finalSeverity = severity || 'MODERATE';
    if (photoUrl && !severity) {
      // Simulate simple image analysis
      const triggers = ['crash', 'blood', 'head', 'fire', 'wreck', 'severe', 'rollover'];
      const descMatch = (description || '').toLowerCase();
      if (triggers.some(t => descMatch.includes(t)) || Math.random() > 0.5) {
        finalSeverity = 'CRITICAL';
      } else {
        finalSeverity = 'MODERATE';
      }
    }

    // 2. Create the incident
    const incident = await prisma.incident.create({
      data: {
        reporterName: reporterName || 'Anonymous',
        reporterPhone: reporterPhone || null,
        latitude: lat,
        longitude: lon,
        locationName: locationName || 'Unknown Location',
        severity: finalSeverity,
        injuredCount: parseInt(injuredCount) || 1,
        description: description || null,
        photoUrl,
        status: 'REPORTED',
        hospitalId: nearestHospital ? nearestHospital.id : null,
      },
      include: {
        hospital: true,
      },
    });

    // Calculate metadata for dispatch response
    const distanceKm = nearestHospital ? minDistance.toFixed(2) : '0';
    const travelTime = nearestHospital ? getTravelTimeMinutes(minDistance) : 0;

    const responsePayload = {
      ...incident,
      distance: distanceKm,
      travelTimeMinutes: travelTime,
    };

    // 3. Socket broadcast alerts
    // Notify general Admin dashboard
    io.to('admin').emit('new_incident', responsePayload);

    // Notify specifically assigned Hospital
    if (nearestHospital) {
      io.to(`hospital-${nearestHospital.id}`).emit('incoming_incident', responsePayload);
    }

    res.status(201).json(responsePayload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record incident' });
  }
});

// GET INCIDENTS
app.get('/api/incidents', async (req, res) => {
  const { hospitalId } = req.query;
  try {
    const where = {};
    if (hospitalId) {
      where.hospitalId = hospitalId;
    }
    const incidents = await prisma.incident.findMany({
      where,
      include: { hospital: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve incidents' });
  }
});

// GET SINGLE INCIDENT
app.get('/api/incidents/:id', async (req, res) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: { hospital: true },
    });
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// UPDATE INCIDENT STATUS
app.put('/api/incidents/:id/status', async (req, res) => {
  const { status, hospitalId } = req.body; // REPORTED, NOTIFIED, DISPATCHED, ADMITTED, RESOLVED
  try {
    const current = await prisma.incident.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Incident not found' });

    const updateData = { status };
    if (hospitalId) {
      updateData.hospitalId = hospitalId;
    }

    const updated = await prisma.incident.update({
      where: { id: req.params.id },
      data: updateData,
      include: { hospital: true },
    });

    // Broadcast status change
    // Notify Admin
    io.to('admin').emit('incident_status_changed', updated);
    // Notify specific incident room (reporter's live updates)
    io.to(`incident-${updated.id}`).emit('status_update', updated);
    // Notify hospital dashboard
    if (updated.hospitalId) {
      io.to(`hospital-${updated.hospitalId}`).emit('incident_status_changed', updated);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ANALYTICS & ADMIN HEALTH METRICS
app.get('/api/analytics', async (req, res) => {
  try {
    const totalCount = await prisma.incident.count();
    const criticalCount = await prisma.incident.count({ where: { severity: 'CRITICAL' } });
    const moderateCount = await prisma.incident.count({ where: { severity: 'MODERATE' } });
    const minorCount = await prisma.incident.count({ where: { severity: 'MINOR' } });

    const statusCounts = await prisma.incident.groupBy({
      by: ['status'],
      _count: true,
    });

    // Calculate response times simulation
    // Let's grab resolved/admitted incidents and compute averages
    const responseTimes = [12.5, 8.2, 15.1, 9.7, 11.4]; // Average mock dispatch times in minutes
    const avgResponseTime = (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1);

    const heatmapPoints = await prisma.incident.findMany({
      select: {
        id: true,
        latitude: true,
        longitude: true,
        severity: true,
      },
    });

    res.json({
      totalIncidents: totalCount,
      bySeverity: {
        CRITICAL: criticalCount,
        MODERATE: moderateCount,
        MINOR: minorCount,
      },
      statusCounts,
      avgResponseTimeMinutes: parseFloat(avgResponseTime),
      heatmapPoints,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// AI SEVERITY PREDICTION MOCK ENDPOINT
app.post('/api/analyze-image', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  // Simulate AI model latency
  setTimeout(() => {
    const categories = ['MINOR', 'MODERATE', 'CRITICAL'];
    const randomClass = categories[Math.floor(Math.random() * 3)];
    const confidence = (Math.random() * 20 + 80).toFixed(1); // 80% to 100%
    
    res.json({
      severity: randomClass,
      confidence: `${confidence}%`,
      visualFindings: randomClass === 'CRITICAL' 
        ? ['Severe bumper damage', 'Deployment of airbags detected', 'Windshield shattered']
        : randomClass === 'MODERATE'
          ? ['Front side collision', 'Dent on fender', 'Broken tail light']
          : ['Scratches on paintwork', 'Minor bumper misalignment']
    });
  }, 1000);
});

// SOCKET.IO REALTIME EVENTS
io.on('connection', (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Register identity
  socket.on('join_admin', () => {
    socket.join('admin');
    console.log(`Socket ${socket.id} joined 'admin' room`);
  });

  socket.on('join_hospital', (hospitalId) => {
    socket.join(`hospital-${hospitalId}`);
    console.log(`Socket ${socket.id} joined room 'hospital-${hospitalId}'`);
  });

  socket.on('join_incident', (incidentId) => {
    socket.join(`incident-${incidentId}`);
    console.log(`Socket ${socket.id} joined room 'incident-${incidentId}'`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: ${socket.id}`);
  });
});

// PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`RoadAid Backend Server running on http://localhost:${PORT}`);
});
