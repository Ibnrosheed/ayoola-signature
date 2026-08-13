import mongoose from 'mongoose';
import dns from 'dns';
import User from '../models/user.model.js';

/**
 * Configure DNS fallback for SRV lookups (resolves querySrv ECONNREFUSED issues on Windows/ISPs)
 */
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('⚠️ Custom DNS servers setting notice:', dnsErr.message);
}

/**
 * Seed initial Superadmin account if missing
 */
export const seedInitialSuperadmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'superadmin@ayoolasignature.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'SuperAdmin123!';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Ayoola';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Superadmin';
    const adminPhone = process.env.ADMIN_PHONE || '08000000000';

    const existingSuperadmin = await User.findOne({
      $or: [{ email: adminEmail }, { role: 'superadmin' }]
    });

    if (!existingSuperadmin) {
      const superadmin = await User.create({
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword,
        role: 'superadmin',
        status: 'active',
      });
      console.log('⚡ Initial Superadmin account ready:');
      console.log(`   Email: ${superadmin.email} | Role: ${superadmin.role}`);
    } else {
      console.log(`✅ Superadmin verified: ${existingSuperadmin.email} (Role: ${existingSuperadmin.role})`);
    }
  } catch (error) {
    console.warn('⚠️ Superadmin seeding note:', error.message);
  }
};

/**
 * MongoDB Connection Handler
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️ MONGODB_URI is not defined in environment variables.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('--------------------------------------------------');
    console.log(`✅ MongoDB connected successfully!`);
    console.log(`📡 Host: ${conn.connection.host}`);
    console.log(`🗄️  Database Name: ${conn.connection.name}`);
    console.log('--------------------------------------------------');
    await seedInitialSuperadmin();
    return true;
  } catch (error) {
    console.warn('⚠️ MongoDB connection unavailable (local daemon or Atlas URI disconnected).');
    console.warn(`   Reason: ${error.message}`);
    console.warn('--------------------------------------------------');
    return false;
  }
};

