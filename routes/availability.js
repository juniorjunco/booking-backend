const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');

// Obtener disponibilidad por fecha
router.get('/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const day = await Availability.findOne({ date });
    if (!day) return res.json({ times: [] });
    res.json(day);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Agregar disponibilidad (admin)
router.post('/', async (req, res) => {
  try {
    const { date, times } = req.body;

    if (!date || !Array.isArray(times)) {
      return res.status(400).json({ error: 'Date and an array of times are required.' });
    }

    if (times.length === 0) {
      return res.status(400).json({ error: 'Time array cannot be empty.' });
    }

    const exists = await Availability.findOne({ date });

    if (exists) {
      await Availability.updateOne(
        { date },
        { $addToSet: { times: { $each: times } } }
      );
    } else {
      await Availability.create({ date, times });
    }

    res.json({ message: 'Availability updated successfully.' });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
