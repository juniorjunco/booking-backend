const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  date: String, // ej. "2024-08-10"
  times: [String] // ej. ["09:00 AM", "11:00 AM", ...]
});

module.exports = mongoose.model('Availability', availabilitySchema);
