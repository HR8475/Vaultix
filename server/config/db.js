import mongoose from 'mongoose';

/**
 * Connect to MongoDB with retry logic.
 * Uses the MONGODB_URI environment variable.
 * Retries up to 5 times with a 5-second delay between attempts.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 5000;

  mongoose.connection.on('connected', () => {
    console.log('✅  MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌  MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      return; // success — exit
    } catch (err) {
      console.error(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`
      );

      if (attempt === MAX_RETRIES) {
        console.error('All MongoDB connection attempts exhausted. Exiting.');
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

export default connectDB;
