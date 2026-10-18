import { NextResponse } from "next/server";
import Conversation from "../../../models/Conversation";
import { connectToDatabase } from "../../../lib/mongodb";
import { getDemoIdentity, getLabMode, canAccessConversation } from "../../../lib/lab-access";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req) {
  const demoId = getDemoIdentity(req);
  const mode = getLabMode(req);
  await connectToDatabase();

  const { conversationId } = await req.json();
  if (!conversationId) {
    return new NextResponse("Missing conversationId", { status: 400 });
  }

  const convo = await Conversation.findById(conversationId);
  if (!convo || !canAccessConversation(convo, demoId, mode)) {
    return new NextResponse("Conversation not found or unauthorized", { status: 404 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo";

  if (!apiKey) {
    return new NextResponse(
      "OpenRouter API key not configured. Set OPENROUTER_API_KEY.",
      { status: 500 }
    );
  }

  // Trim history to last 20 messages and enforce max length per message
  const safeMessages = convo.messages
    .slice(-20)
    .map((m) => ({
      role: m.role,
      content: m.content.length > 1024 ? m.content.slice(0, 1024) + "…" : m.content
    }));

  const payload = {
    model,
    messages: safeMessages,
    max_tokens: 1000
  };

  try {
    const resp = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new NextResponse(`OpenRouter error: ${resp.status} ${err}`, {
        status: resp.status
      });
    }

    const data = await resp.json();
    const assistantMsg = data.choices?.[0]?.message?.content ?? "";

    // Append response to conversation securely
    convo.messages.push({ role: "assistant", content: assistantMsg });
    await convo.save();

    return NextResponse.json({ content: assistantMsg });
  } catch (e) {
    console.error(e);
    return new NextResponse("Failed to contact OpenRouter", { status: 502 });
  }
}
