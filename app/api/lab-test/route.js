import { NextResponse } from "next/server";
import Conversation from "../../../models/Conversation";
import { connectToDatabase } from "../../../lib/mongodb";
import { getDemoIdentity, getLabMode, canAccessConversation, recordLabEvent } from "../../../lib/lab-access";

/**
 * POST body:
 *   {
 *     targetConversationId: "<id>",
 *     requestingDemoId: "alice-demo" | "bob-demo"
 *   }
 */

export async function POST(req) {
  const demoId = getDemoIdentity(req);
  const mode = getLabMode(req);
  await connectToDatabase();

  const { targetConversationId, requestingDemoId } = await req.json();

  // Defensive: ensure UI selector matches header (demo identity)
  if (requestingDemoId !== demoId) {
    await recordLabEvent({ demoId, convoId: targetConversationId, success: false });
    return NextResponse.json(
      {
        result: "BLOCKED",
        statusCode: 400,
        explanation: "Demo selector mismatch – possible tampering"
      },
      { status: 400 }
    );
  }

  const convo = await Conversation.findById(targetConversationId);
  const allowed = convo && canAccessConversation(convo, demoId, mode);
  await recordLabEvent({ demoId, convoId: targetConversationId, success: !!allowed });

  const response = {
    result: allowed ? "EXPOSED" : "BLOCKED",
    statusCode: allowed ? 200 : 404,
    explanation: allowed
      ? "Vulnerable mode allowed cross‑user read."
      : "Secure mode blocked unauthorized access."
  };

  return NextResponse.json(response, { status: allowed ? 200 : 404 });
}
