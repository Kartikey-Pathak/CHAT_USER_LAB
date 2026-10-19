import { NextResponse } from "next/server";
import Conversation from "../../../../models/Conversation";
import { connectToDatabase } from "../../../../lib/mongodb";
import {
  getSessionCustomerId,
  getLabMode,
  recordLabEvent,
} from "../../../../lib/lab-access";

/* ---------- READ ---------- */
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const customerId = getSessionCustomerId(req);
    const mode = getLabMode(req);

    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const convo = await Conversation.findById(id);
    if (!convo) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Secure mode: enforce ownership
    if (mode === "secure" && convo.ownerId !== customerId) {
      await recordLabEvent({
        customerId,
        action: "cross_user_convo_read",
        success: false,
        details: `Blocked access to convo owned by ${convo.ownerId}`,
      });
      return NextResponse.json(
        { error: "Access denied: This conversation belongs to another user." },
        { status: 403 }
      );
    }

    await recordLabEvent({
      customerId,
      action: "convo_read",
      success: true,
    });

    return NextResponse.json({
      _id: convo._id,
      title: convo.title,
      ownerId: convo.ownerId,
      messages: convo.messages,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/conversations/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load conversation" },
      { status: 500 }
    );
  }
}

/* ---------- DELETE ---------- */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const customerId = getSessionCustomerId(req);
    const mode = getLabMode(req);

    if (!customerId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const convo = await Conversation.findById(id);
    if (!convo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (mode === "secure" && convo.ownerId !== customerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await convo.deleteOne();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/conversations/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete" },
      { status: 500 }
    );
  }
}
