import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  country: { type: String, default: 'Nigeria', trim: true },
  postalCode: { type: String, trim: true },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please provide a valid email address'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Exclude password field from query results by default
  },
  role: {
    type: String,
    enum: {
      values: ['customer', 'admin', 'superadmin'],
      message: '{VALUE} is not a valid role',
    },
    default: 'customer',
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended'],
      message: '{VALUE} is not a valid status',
    },
    default: 'active',
  },
  addresses: [addressSchema],
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationTokenHash: {
    type: String,
    select: false,
  },
  emailVerificationExpiresAt: {
    type: Date,
  },
  passwordResetTokenHash: {
    type: String,
    select: false,
  },
  passwordResetExpiresAt: {
    type: Date,
  },
  welcomeEmailSent: {
    type: Boolean,
    default: false,
  },
  notificationPreferences: {
    orderUpdates: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: true },
    recommendations: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
  },
}, {
  timestamps: true,
});

/**
 * Pre-save middleware to automatically hash passwords before saving
 */
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare candidate password with stored hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Custom toJSON transformation to remove sensitive fields in output
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  userObject.id = userObject._id;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;
