import { NextResponse } from "next/server";
import Conversation from "../../../../models/Conversation";
import { connectToDatabase } from "../../../../lib/mongodb";
import {
  getDemoIdentity,
  getLabMode,
  canAccessConversation,
  recordLabEvent
} from "../../../../lib/lab-access";

/* ---------- READ ---------- */
export async function GET(req, { params }) {
  const { id } = await params;
  const demoId = getDemoIdentity(req);
  const mode = getLabMode(req);
  await connectToDatabase();

  const convo = await Conversation.findById(id);
  if (!convo) {
    await recordLabEvent({ demoId, convoId: id, success: false });
    return NextResponse.json(
      { error: "Conversation not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  const allowed = canAccessConversation(convo, demoId, mode);
  if (!allowed) {
    await recordLabEvent({ demoId, convoId: id, success: false });
    return NextResponse.json(
      {
        error: "Access Denied: Tenant Isolation Enforced",
        code: "UNAUTHORIZED_TENANT",
        ownerId: convo.ownerId,
        requestingDemoId: demoId,
        mode
      },
      { status: 404 }
    );
  }

  await recordLabEvent({ demoId, convoId: id, success: true });
  return NextResponse.json({
    _id: convo._id,
    title: convo.title,
    ownerId: convo.ownerId,
    messages: convo.messages,
    createdAt: convo.createdAt,
    updatedAt: convo.updatedAt
  });
}

/* ---------- DELETE ---------- */
export async function DELETE(req, { params }) {
  const { id } = await params;
  const demoId = getDemoIdentity(req);
  const mode = getLabMode(req);
  await connectToDatabase();

  const convo = await Conversation.findById(id);
  if (!convo || !canAccessConversation(convo, demoId, mode)) {
    await recordLabEvent({ demoId, convoId: id, success: false });
    return new NextResponse("Not found", { status: 404 });
  }

  await convo.deleteOne();
  await recordLabEvent({ demoId, convoId: id, success: true });
  return new NextResponse(null, { status: 204 });
}

/* ---------- SEND MESSAGE ---------- */
export async function PUT(req, { params }) {
  const { id } = await params;
  const demoId = getDemoIdentity(req);
  const mode = getLabMode(req);
  await connectToDatabase();

  const convo = await Conversation.findById(id);
  if (!convo || !canAccessConversation(convo, demoId, mode)) {
    await recordLabEvent({ demoId, convoId: id, success: false });
    return new NextResponse("Not found", { status: 404 });
  }

  const { role, content } = await req.json();
  if (!role || !content) {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  convo.messages.push({ role, content });
  await convo.save();

  await recordLabEvent({ demoId, convoId: id, success: true });
  return NextResponse.json({ _id: convo._id, messages: convo.messages });
}
