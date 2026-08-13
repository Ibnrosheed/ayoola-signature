import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Recipient full name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Street delivery address is required'],
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
    country: {
      type: String,
      default: 'Nigeria',
      trim: true,
    },
    deliveryInstructions: {
      type: String,
      default: '',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index user + isDefault for quick default address lookup
addressSchema.index({ user: 1, isDefault: -1 });

const Address = mongoose.model('Address', addressSchema);

export default Address;
