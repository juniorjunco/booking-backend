const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const { authenticate } = require('../middlewares/auth');
const nodemailer = require('nodemailer');

// Configura el transportador
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ ÚNICA ruta para crear reserva y enviar correo
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Guardar reserva en DB
    const newBooking = await Booking.create(data);

    // Quitar la hora de la disponibilidad
    await Availability.updateOne(
      { date: data.date },
      { $pull: { times: data.time } }
    );

    // Enviar correo de confirmación
    const mailOptions = {
      from: `"Latinos Detailing" <${process.env.EMAIL_FROM}>`,
      to: data.email,
      subject: '✅ Booking Confirmation - Latinos Detailing',
      html: `
        <h2>Hi ${data.name},</h2>
        <p>Your booking has been confirmed. Here are the details:</p>
        <ul>
          <li><strong>Service:</strong> ${data.service}</li>
          <li><strong>Vehicle:</strong> ${data.vehicleType}</li>
          <li><strong>Date:</strong> ${data.date}</li>
          <li><strong>Time:</strong> ${data.time}</li>
        </ul>
        <p>We look forward to detailing your vehicle!</p>
        <br>
        <p>Latinos Detailing</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Booking saved and email sent' });

  } catch (err) {
    console.error('Error creating booking or sending email:', err);
    res.status(500).json({ error: 'Error saving booking or sending email' });
  }
});

// Obtener todas las reservas (solo admin)
router.get('/all', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// Obtener una reserva por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching booking' });
  }
});

// Eliminar una reserva
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Booking not found' });

    // Reagregar la hora a la disponibilidad
    await Availability.updateOne(
      { date: deleted.date },
      { $push: { times: deleted.time } },
      { upsert: true }
    );

    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting booking' });
  }
});

// Marcar como completado
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const { isCompleted, payment } = req.body;
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      { isCompleted, payment },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Marked as completed', booking: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error completing booking' });
  }
});

module.exports = router;
