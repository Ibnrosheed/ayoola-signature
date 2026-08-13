import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/user.model.js';

dotenv.config();

const seedSuperadmin = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ayoolasignature.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'SuperAdmin123!';
  const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Ayoola';
  const adminLastName = process.env.ADMIN_LAST_NAME || 'Admin';
  const adminPhone = process.env.ADMIN_PHONE || '08000000000';

  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB.');

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({
      $or: [
        { email: adminEmail },
        { role: 'superadmin' }
      ]
    });

    if (existingSuperadmin) {
      console.log(`⚠️  Superadmin account already exists: ${existingSuperadmin.email} (Role: ${existingSuperadmin.role})`);
      process.exit(0);
    }

    // Create Superadmin Account
    const superadmin = await User.create({
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
      role: 'superadmin',
      status: 'active',
    });

    console.log('--------------------------------------------------');
    console.log('🎉 Initial Superadmin account created successfully!');
    console.log(`📧 Email: ${superadmin.email}`);
    console.log(`🔑 Role: ${superadmin.role}`);
    console.log(`STATUS: ${superadmin.status}`);
    console.log('--------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error.message);
    process.exit(1);
  }
};

seedSuperadmin();
