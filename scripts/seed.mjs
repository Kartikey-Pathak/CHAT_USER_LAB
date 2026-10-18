import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import { connectToDatabase } from "../lib/mongodb.js";

// Load .env.local if running standalone outside of Next.js
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch (e) {
    try {
      process.loadEnvFile(".env");
    } catch (_) {}
  }
}

async function seed() {
  await connectToDatabase();

  // Remove any existing demo data
  await Conversation.deleteMany({ ownerId: { $in: ["alice-demo", "bob-demo"] } });

  const demos = ["alice-demo", "bob-demo"];
  for (const demo of demos) {
    for (let i = 1; i <= 2; i++) {
      await Conversation.create({
        ownerId: demo,
        title: `${demo.split("-")[0].toUpperCase()} Demo ${i}`,
        messages: [
          { role: "user", content: `Hello from ${demo.split("-")[0]} #${i}` },
          { role: "assistant", content: `Hi ${demo.split("-")[0]}, this is a seeded reply ${i}.` }
        ]
      });
    }
  }

  console.log("✅ Seed complete");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
