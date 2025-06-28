const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const { authenticate } = require('../middlewares/auth'); // ✅ ruta correcta

// Crear nueva reserva
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    const newBooking = await Booking.create(data);

    // Quitar hora ocupada de disponibilidad
    await Availability.updateOne(
      { date: data.date },
      { $pull: { times: data.time } }
    );

    res.status(201).json({ message: 'Booking saved' });
  } catch (err) {
    res.status(500).json({ error: 'Error saving booking' });
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

// Volver a agregar la hora eliminada a disponibilidad
await Availability.updateOne(
  { date: deleted.date },
  { $push: { times: deleted.time } },
  { upsert: true } // crea si no existe
);

    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting booking' });
  }
});

// Marcar como completado + pago
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
