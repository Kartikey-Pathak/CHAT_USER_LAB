// Lab-access utilities – demo identity & mode handling

/**
 * Demo users used in the lab. The key is the identifier sent via
 * the `x-demo-identity` header. The values are only for display.
 */
export const DEMO_USERS = {
  "alice-demo": { displayName: "Alice" },
  "bob-demo": { displayName: "Bob" }
};

/**
 * Extract the demo identity from request headers.
 * Safely defaults to "alice-demo" if missing.
 */
export function getDemoIdentity(req) {
  const id = typeof req?.headers?.get === "function"
    ? req.headers.get("x-demo-identity")
    : req?.headers?.["x-demo-identity"];

  if (id && id in DEMO_USERS) {
    return id;
  }
  return "alice-demo";
}

/**
 * Return the lab mode – "vulnerable" or "secure".
 */
export function getLabMode(req) {
  const mode = typeof req?.headers?.get === "function"
    ? req.headers.get("x-lab-mode")
    : req?.headers?.["x-lab-mode"];
  return mode === "vulnerable" ? "vulnerable" : "secure";
}

/**
 * Ownership check used by API routes.
 * In vulnerable mode we intentionally skip the check.
 */
export function canAccessConversation(conversation, demoId, mode) {
  if (mode === "vulnerable") return true;
  return conversation.ownerId === demoId;
}

/**
 * Simple audit-log for the lab panel.
 * Uses a safe try-catch to avoid failing on read-only serverless filesystems (e.g. Vercel).
 */
export async function recordLabEvent({ demoId, convoId, success }) {
  try {
    const fs = await import("fs");
    const line = `${new Date().toISOString()} | demo=${demoId} | convo=${convoId} | ${
      success ? "SUCCESS" : "BLOCKED"
    }\n`;
    fs.appendFileSync("lab-audit.log", line, { encoding: "utf8" });
  } catch (_) {
    // Read-only serverless environments like Vercel Lambda cannot write to disk
  }
}
