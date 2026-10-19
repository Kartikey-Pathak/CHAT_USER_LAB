import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongodb";
import {
  getSessionCustomerId,
  getLabMode,
  getCustomerShoppingData,
  getAllCustomerProfiles,
  recordLabEvent,
} from "../../../lib/lab-access";
import Customer from "../../../models/Customer";

/**
 * POST /api/lab-test – Run predefined security test scenarios.
 * Body: { testId, payload? }
 */
export async function POST(req) {
  const customerId = getSessionCustomerId(req);
  const mode = getLabMode(req);
  await connectToDatabase();

  if (!customerId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { testId, payload } = await req.json();
  const customer = await Customer.findById(customerId).lean();

  const results = {
    testId,
    mode,
    authenticatedAs: customer?.username,
    timestamp: new Date().toISOString(),
  };

  switch (testId) {
    case "cross_user_data": {
      // Test: Try to fetch another user's data
      const targetUsername = payload?.targetUsername || "bob";
      const data = await getCustomerShoppingData(customerId, mode, targetUsername);

      const isOwnData = data?.profile?.username === customer?.username;
      results.result = isOwnData ? "BLOCKED" : "EXPOSED";
      results.statusCode = isOwnData ? 200 : 200;
      results.explanation = isOwnData
        ? "Secure mode returned only your own data regardless of the requested username."
        : `Vulnerable mode returned ${targetUsername}'s data to ${customer?.username}.`;
      results.dataReturned = data?.profile?.username;
      break;
    }

    case "list_all_customers": {
      if (mode === "vulnerable") {
        const profiles = await getAllCustomerProfiles();
        results.result = "EXPOSED";
        results.explanation = `Vulnerable mode leaked ${profiles.length} customer profiles.`;
        results.profileCount = profiles.length;
      } else {
        results.result = "BLOCKED";
        results.explanation = "Secure mode blocked the request to list all customers.";
      }
      break;
    }

    case "sensitive_field_exposure": {
      const data = await getCustomerShoppingData(customerId, mode, null);
      const hasCreditCard = !!data?.profile?.creditCard;
      const hasFullAddress = !!data?.profile?.address;
      results.result = hasCreditCard || hasFullAddress ? "EXPOSED" : "BLOCKED";
      results.explanation = hasCreditCard
        ? "Vulnerable mode exposed credit card number in the response."
        : "Secure mode properly redacted sensitive fields.";
      results.fieldsExposed = {
        creditCard: hasCreditCard,
        fullAddress: hasFullAddress,
        email: data?.profile?.email?.includes("***") ? "masked" : "full",
        phone: data?.profile?.phone?.includes("***") ? "masked" : "full",
      };
      break;
    }

    case "impersonation": {
      // Simulate impersonation attempt
      results.result = mode === "vulnerable" ? "VULNERABLE" : "BLOCKED";
      results.explanation = mode === "vulnerable"
        ? "In vulnerable mode, the AI trusts user-provided identity claims in prompts."
        : "In secure mode, identity is derived from the server-side session, ignoring prompt claims.";
      break;
    }

    default:
      results.result = "UNKNOWN_TEST";
      results.explanation = "Test ID not recognized.";
  }

  await recordLabEvent({
    customerId,
    action: `lab_test_${testId}`,
    success: results.result !== "BLOCKED",
    details: results.explanation,
  });

  return NextResponse.json(results);
}
