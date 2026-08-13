import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start Server & Connect Database
const startServer = async () => {
  console.log('🚀 Initializing Ayoola Signature Backend Server...');

  // Connect to MongoDB
  const isConnected = await connectDB();
  if (!isConnected) {
    console.warn('⚠️ Server running in standalone mode (database disconnected/unavailable).');
  }

  // Start HTTP Listener
  app.listen(PORT, () => {
    console.log(`🌐 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🔗 Health Check URL: http://localhost:${PORT}/api/health`);
    console.log('--------------------------------------------------');
  });
};

startServer();
