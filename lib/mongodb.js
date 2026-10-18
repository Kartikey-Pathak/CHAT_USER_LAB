import mongoose from "mongoose";

if (!process.env.MONGODB_URI && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch (e) {
    try {
      process.loadEnvFile(".env");
    } catch (_) {}
  }
}

/**
 * Connect to MongoDB, reusing the existing connection when possible.
 */
export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    // Already connected
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }
  await mongoose.connect(uri);
}
