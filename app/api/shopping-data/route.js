import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import {
  getSessionCustomerId,
  getLabMode,
  getCustomerShoppingData,
  getAllCustomerProfiles,
  recordLabEvent,
} from "../../../lib/lab-access";

/**
 * GET /api/shopping-data – Retrieve shopping data for the authenticated customer.
 * In vulnerable mode, accepts ?username= query param to fetch other user's data.
 */
export async function GET(req) {
  try {
    await connectToDatabase();
    const customerId = getSessionCustomerId(req);
    const mode = getLabMode(req);

    if (!customerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const requestedUsername = url.searchParams.get("username");

    const data = await getCustomerShoppingData(customerId, mode, requestedUsername);

    if (!data) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    await recordLabEvent({
      customerId,
      action: requestedUsername ? `data_request_for_${requestedUsername}` : "own_data_request",
      success: true,
      details: mode === "vulnerable" && requestedUsername ? "CROSS_USER_DATA_SERVED" : "",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/shopping-data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve shopping data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shopping-data – Used by the AI chat to fetch data server-side.
 * Body: { intent, requestedUsername? }
 * In secure mode, requestedUsername is ignored.
 */
export async function POST(req) {
  try {
    await connectToDatabase();
    const customerId = getSessionCustomerId(req);
    const mode = getLabMode(req);

    if (!customerId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { intent, requestedUsername } = await req.json();

    if (intent === "list_all_customers" && mode === "vulnerable") {
      // Vulnerable: leak all customer profiles
      const profiles = await getAllCustomerProfiles();
      await recordLabEvent({
        customerId,
        action: "list_all_customers",
        success: true,
        details: "VULNERABLE_ALL_PROFILES_LEAKED",
      });
      return NextResponse.json({ profiles });
    }

    if (intent === "list_all_customers" && mode === "secure") {
      await recordLabEvent({
        customerId,
        action: "list_all_customers_attempt",
        success: false,
        details: "BLOCKED_SECURE_MODE",
      });
      return NextResponse.json(
        { error: "Access denied: You can only view your own data." },
        { status: 403 }
      );
    }

    const data = await getCustomerShoppingData(customerId, mode, requestedUsername);

    if (!data) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const isXUser = mode === "vulnerable" && requestedUsername;
    await recordLabEvent({
      customerId,
      action: isXUser ? `ai_data_fetch_for_${requestedUsername}` : "ai_own_data_fetch",
      success: true,
      details: isXUser ? "CROSS_USER_AI_LEAK" : "",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("POST /api/shopping-data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve data" },
      { status: 500 }
    );
  }
}
