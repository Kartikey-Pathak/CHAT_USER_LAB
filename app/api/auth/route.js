import { NextResponse } from "next/server";
import Customer from "../../../models/Customer";
import { connectToDatabase } from "../../../lib/mongodb";

/**
 * POST /api/auth – Simple login. Sets a base64-encoded session cookie.
 * Body: { username, password }
 */
export async function POST(req) {
  try {
    await connectToDatabase();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const customer = await Customer.findOne({ username: username.toLowerCase().trim() });

    if (!customer || customer.password !== password) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create simple session token (base64 encoded JSON – lab demo only, not production-safe)
    const session = {
      customerId: customer._id.toString(),
      username: customer.username,
      displayName: customer.displayName,
    };
    const token = Buffer.from(JSON.stringify(session)).toString("base64");

    const response = NextResponse.json({
      success: true,
      customer: {
        username: customer.username,
        displayName: customer.displayName,
        membershipTier: customer.membershipTier,
      },
    });

    response.cookies.set("lab_session", token, {
      httpOnly: false, // accessible to JS for lab demo
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth error:", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth – Logout. Clears session cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("lab_session", "", {
    httpOnly: false,
    path: "/",
    maxAge: 0,
  });
  return response;
}

/**
 * GET /api/auth – Check current session.
 */
export async function GET(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/lab_session=([^;]+)/);

    if (!match) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    const session = JSON.parse(decoded);

    return NextResponse.json({
      authenticated: true,
      customer: {
        customerId: session.customerId,
        username: session.username,
        displayName: session.displayName,
      },
    });
  } catch (_) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
