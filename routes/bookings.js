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
  <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color:rgb(255, 255, 255); padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #fff; border-radius: 10px; overflow: hidden;">
     <tr>
  <td style="padding: 0;">
    <img src="https://latinosdetailing.netlify.app/assets/Logofondonegro.png"
         alt="Latinos Detailing"
         style="width: 100%; display: block;" />
  </td>
</tr>


          <tr>
            <td style="padding: 30px; color: #333;">
              <h2 style="color: #000;">Hello ${data.name},</h2>
              <p style="font-size: 16px;">Thank you for booking with <strong>Latinos Detailing</strong>! Your appointment has been confirmed. Below are your booking details:</p>

              <table cellpadding="5" cellspacing="0" style="margin: 20px 0; width: 100%;">
                <tr>
                  <td><strong>Service:</strong></td>
                  <td>${data.service}</td>
                </tr>
                <tr>
                  <td><strong>Vehicle Type:</strong></td>
                  <td>${data.vehicleType}</td>
                </tr>
                <tr>
                  <td><strong>Date:</strong></td>
                  <td>${data.date}</td>
                </tr>
                <tr>
                  <td><strong>Time:</strong></td>
                  <td>${data.time}</td>
                </tr>
              </table>

              <p style="font-size: 16px;">We’ll see you soon. If you have any questions, feel free to reply to this email.</p>
              <p style="margin-top: 30px;">Best regards,<br><strong>Latinos Detailing Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #000; color: #fff; padding: 15px; text-align: center; font-size: 14px;">
              &copy; 2024 Latinos Detailing. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
