import mongoose from "mongoose";

// Load local env files if in local Node environment
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
 * Global cache for Mongoose connection in serverless (Vercel) environments.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "Missing MONGODB_URI environment variable. Please configure MONGODB_URI in your Vercel Project Settings (Settings > Environment Variables)."
    );
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
