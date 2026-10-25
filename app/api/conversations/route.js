import { NextResponse } from "next/server";
import Conversation from "../../../models/Conversation";
import { connectToDatabase } from "../../../lib/mongodb";
import { getSessionCustomerId } from "../../../lib/lab-access";

/**
 * GET – list conversations for the authenticated customer.
 */
export async function GET(req) {
  try {
    const customerId = getSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const conversations = await Conversation.find({ ownerId: customerId })
      .sort({ updatedAt: -1 })
      .select("_id title ownerId createdAt updatedAt")
      .lean();

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to load conversations",
        hint: !process.env.MONGODB_URI
          ? "Missing MONGODB_URI. Add it in your .env.local file."
          : "Check MongoDB Atlas Network Access.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST – create a new conversation for the authenticated customer.
 */
export async function POST(req) {
  try {
    const customerId = getSessionCustomerId(req);
    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const { title } = await req.json();
    const newConvo = await Conversation.create({
      ownerId: customerId,
      title: title || "New Shopping Chat",
    });

    return NextResponse.json({
      _id: newConvo._id,
      title: newConvo.title,
      ownerId: newConvo.ownerId,
      createdAt: newConvo.createdAt,
      updatedAt: newConvo.updatedAt,
    });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}
