

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();




app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const identityController = require('./controllers/identityController');

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  identityController.handleStripeWebhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));



app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente 🏠',
    timestamp: new Date().toISOString(),
  });
});



app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/availability', require('./routes/availabilityRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));




app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});



app.use(errorHandler);

module.exports = app;