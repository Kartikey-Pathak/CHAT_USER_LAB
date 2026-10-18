import { NextResponse } from "next/server";
import Conversation from "../../../models/Conversation";
import { connectToDatabase } from "../../../lib/mongodb";
import { getDemoIdentity } from "../../../lib/lab-access";

/**
 * GET – list active user's conversations and target victim conversations for testing.
 */
export async function GET(req) {
  try {
    const demoId = getDemoIdentity(req);
    await connectToDatabase();

    const otherId = demoId === "alice-demo" ? "bob-demo" : "alice-demo";

    const [myConvos, otherConvos] = await Promise.all([
      Conversation.find({ ownerId: demoId })
        .sort({ createdAt: -1 })
        .select("_id title ownerId createdAt updatedAt")
        .lean(),
      Conversation.find({ ownerId: otherId })
        .sort({ createdAt: -1 })
        .select("_id title ownerId createdAt updatedAt")
        .lean()
    ]);

    return NextResponse.json({
      myConversations: myConvos || [],
      otherConversations: otherConvos || [],
      currentUserName: demoId === "alice-demo" ? "Alice" : "Bob",
      otherUserName: otherId === "alice-demo" ? "Alice" : "Bob"
    });
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to load conversations",
        code: error.name || "DATABASE_ERROR",
        hint: !process.env.MONGODB_URI
          ? "Missing MONGODB_URI. Add MONGODB_URI in Vercel Project Settings > Environment Variables."
          : "Check MongoDB Atlas Network Access: add 0.0.0.0/0 to allow connections from Vercel."
      },
      { status: 500 }
    );
  }
}

/**
 * POST – create a new empty conversation for the demo user.
 */
export async function POST(req) {
  try {
    const demoId = getDemoIdentity(req);
    await connectToDatabase();

    const { title } = await req.json();
    const newConvo = await Conversation.create({
      ownerId: demoId,
      title: title || "New Conversation"
    });

    return NextResponse.json({
      _id: newConvo._id,
      title: newConvo.title,
      ownerId: newConvo.ownerId,
      createdAt: newConvo.createdAt,
      updatedAt: newConvo.updatedAt
    });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to create conversation",
        code: error.name || "DATABASE_ERROR"
      },
      { status: 500 }
    );
  }
}
