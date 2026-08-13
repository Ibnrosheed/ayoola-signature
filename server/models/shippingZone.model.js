import mongoose from 'mongoose';

const shippingZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    states: {
      type: [String],
      default: [],
    },
    cities: {
      type: [String],
      default: [],
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

shippingZoneSchema.pre('save', function (next) {
  if (this.states && this.states.length > 0) {
    this.states = this.states.map((s) => s.trim());
  }
  if (this.cities && this.cities.length > 0) {
    this.cities = this.cities.map((c) => c.trim());
  }
  next();
});

shippingZoneSchema.index({ states: 1 });
shippingZoneSchema.index({ isActive: 1 });

const ShippingZone = mongoose.model('ShippingZone', shippingZoneSchema);

export default ShippingZone;
