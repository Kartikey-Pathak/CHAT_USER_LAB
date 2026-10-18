import { NextResponse } from "next/server";
import Conversation from "../../../models/Conversation";
import { connectToDatabase } from "../../../lib/mongodb";
import { getDemoIdentity } from "../../../lib/lab-access";

/**
 * GET – list active user's conversations and target victim conversations for testing.
 */
export async function GET(req) {
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
    myConversations: myConvos,
    otherConversations: otherConvos,
    currentUserName: demoId === "alice-demo" ? "Alice" : "Bob",
    otherUserName: otherId === "alice-demo" ? "Alice" : "Bob"
  });
}

/**
 * POST – create a new empty conversation for the demo user.
 */
export async function POST(req) {
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
}
