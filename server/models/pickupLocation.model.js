import mongoose from 'mongoose';

const pickupLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pickup location name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Pickup address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    openingHours: {
      type: String,
      default: 'Mon – Sat: 9am – 6pm',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const PickupLocation = mongoose.model('PickupLocation', pickupLocationSchema);

export default PickupLocation;
