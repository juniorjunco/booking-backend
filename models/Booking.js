const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  vehicleType: { type: String, required: true },
  notes: String,
  date: { type: String, required: true },
  time: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  zip: { type: String, required: true },

  // NUEVOS CAMPOS para admin:
  isCompleted: { type: Boolean, default: false },
  payment: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
