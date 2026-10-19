// Lab-access utilities – session-based auth & mode handling for LLM02:2025 lab

import Customer from "../models/Customer";
import Order from "../models/Order";
import CartItem from "../models/CartItem";

/**
 * Demo users used in the lab. Keyed by username.
 */
export const DEMO_USERS = {
  "alice": { displayName: "Alice Johnson" },
  "bob": { displayName: "Bob Smith" },
  "carol": { displayName: "Carol Davis" },
};

/**
 * Parse the session cookie to extract the authenticated customer ID.
 * Returns null if not authenticated.
 */
export function getSessionCustomerId(req) {
  const cookieHeader = typeof req?.headers?.get === "function"
    ? req.headers.get("cookie")
    : req?.headers?.cookie;

  if (!cookieHeader) return null;

  const match = cookieHeader.match(/lab_session=([^;]+)/);
  if (!match) return null;

  try {
    const decoded = Buffer.from(match[1], "base64").toString("utf8");
    const session = JSON.parse(decoded);
    return session.customerId || null;
  } catch (_) {
    return null;
  }
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
 * Fetch customer data scoped to the authenticated user.
 * In vulnerable mode, if the prompt requests another user's data,
 * we intentionally return it (simulating the vulnerability).
 */
export async function getCustomerShoppingData(customerId, mode, requestedUsername) {
  // SECURE: always use the authenticated customerId from session
  // VULNERABLE: if a username is provided in the prompt, look up that user instead
  let targetCustomer;

  if (mode === "vulnerable" && requestedUsername) {
    // Vulnerable: trust the AI/prompt-provided username
    targetCustomer = await Customer.findOne({ username: requestedUsername }).lean();
    if (!targetCustomer) {
      targetCustomer = await Customer.findById(customerId).lean();
    }
  } else {
    // Secure: only use session-authenticated customer
    targetCustomer = await Customer.findById(customerId).lean();
  }

  if (!targetCustomer) return null;

  const [orders, cartItems] = await Promise.all([
    Order.find({ customerId: targetCustomer._id }).sort({ orderDate: -1 }).lean(),
    CartItem.find({ customerId: targetCustomer._id }).sort({ addedAt: -1 }).lean(),
  ]);

  // In secure mode, redact highly sensitive fields
  const profile = {
    displayName: targetCustomer.displayName,
    username: targetCustomer.username,
    membershipTier: targetCustomer.membershipTier,
    loyaltyPoints: targetCustomer.loyaltyPoints,
  };

  if (mode === "vulnerable") {
    // Vulnerable: expose sensitive fields
    profile.email = targetCustomer.email;
    profile.phone = targetCustomer.phone;
    profile.address = targetCustomer.address;
    profile.creditCard = targetCustomer.creditCardFull;
    profile.paymentMethod = targetCustomer.paymentMethod;
  } else {
    // Secure: mask sensitive fields
    profile.email = targetCustomer.email?.replace(/(.{2}).*(@.*)/, "$1***$2");
    profile.phone = targetCustomer.phone ? "***-***-" + targetCustomer.phone.slice(-4) : null;
    profile.paymentMethod = targetCustomer.paymentMethod;
    // Never expose credit card or full address in secure mode
  }

  return {
    profile,
    orders: orders.map((o) => ({
      orderId: o.orderId,
      items: o.items,
      totalAmount: o.totalAmount,
      status: o.status,
      orderDate: o.orderDate,
    })),
    cart: cartItems.map((c) => ({
      productName: c.productName,
      quantity: c.quantity,
      price: c.price,
    })),
    totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    totalOrders: orders.length,
  };
}

/**
 * Retrieve all customer profiles (vulnerable mode only – for cross-user leak demo).
 */
export async function getAllCustomerProfiles() {
  const customers = await Customer.find({}).lean();
  return customers.map((c) => ({
    username: c.username,
    displayName: c.displayName,
    email: c.email,
    phone: c.phone,
    membershipTier: c.membershipTier,
    loyaltyPoints: c.loyaltyPoints,
  }));
}

/**
 * Simple audit-log for the lab panel.
 */
export async function recordLabEvent({ customerId, action, success, details }) {
  try {
    const fs = await import("fs");
    const line = `${new Date().toISOString()} | customer=${customerId} | action=${action} | ${
      success ? "SUCCESS" : "BLOCKED"
    } | ${details || ""}\n`;
    fs.appendFileSync("lab-audit.log", line, { encoding: "utf8" });
  } catch (_) {
    // Read-only serverless environments cannot write to disk
  }
}
