// Customer data access utilities

import Customer from "../models/Customer";
import Order from "../models/Order";
import CartItem from "../models/CartItem";

/**
 * Parse the session cookie to extract the authenticated customer ID.
 * Returns null if not authenticated.
 */
export function getSessionCustomerId(req) {
  const cookieHeader =
    typeof req?.headers?.get === "function"
      ? req.headers.get("cookie")
      : req?.headers?.cookie;

  if (!cookieHeader) return null;

  const match = cookieHeader.match(/lab_session=([^;]+)/);
  if (!match) return null;

  try {
    const rawVal = decodeURIComponent(match[1].trim());
    const decoded = Buffer.from(rawVal, "base64").toString("utf8");
    const session = JSON.parse(decoded);
    return session.customerId || null;
  } catch (_) {
    return null;
  }
}

/**
 * Return default lab mode for backward-compatibility.
 */
export function getLabMode() {
  return "standard";
}

/**
 * No-op audit log for backward-compatibility.
 */
export async function recordLabEvent() {
  // Clean no-op
}

/**
 * Fetch shopping data for a specific customer.
 */
export async function getCustomerShoppingData(customerId) {
  const targetCustomer = await Customer.findById(customerId).lean();
  if (!targetCustomer) return null;

  const [orders, cartItems] = await Promise.all([
    Order.find({ customerId: targetCustomer._id }).sort({ orderDate: -1 }).lean(),
    CartItem.find({ customerId: targetCustomer._id }).sort({ addedAt: -1 }).lean(),
  ]);

  const profile = {
    displayName: targetCustomer.displayName,
    username: targetCustomer.username,
    email: targetCustomer.email,
    membershipTier: targetCustomer.membershipTier,
    loyaltyPoints: targetCustomer.loyaltyPoints,
    phone: targetCustomer.phone,
    address: targetCustomer.address,
    paymentMethod: targetCustomer.paymentMethod,
  };

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
    totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    totalOrders: orders.length,
  };
}

/**
 * Retrieve all customer profiles including their recent orders & cart summary.
 */
export async function getAllCustomerProfiles() {
  const customers = await Customer.find({}).lean();
  const allOrders = await Order.find({}).sort({ orderDate: -1 }).lean();
  const allCartItems = await CartItem.find({}).lean();

  return customers.map((c) => {
    const custOrders = allOrders.filter(
      (o) => o.customerId?.toString() === c._id?.toString()
    );
    const custCart = allCartItems.filter(
      (ci) => ci.customerId?.toString() === c._id?.toString()
    );

    return {
      username: c.username,
      displayName: c.displayName,
      email: c.email,
      phone: c.phone,
      address: c.address,
      membershipTier: c.membershipTier,
      loyaltyPoints: c.loyaltyPoints,
      paymentMethod: c.paymentMethod,
      creditCard: c.creditCardFull || c.paymentMethod,
      recentOrders: custOrders.slice(0, 3).map((o) => ({
        orderId: o.orderId,
        items: o.items?.map((it) => `${it.productName} (x${it.quantity})`).join(", "),
        total: o.totalAmount,
        status: o.status,
      })),
      cart: custCart.map((it) => `${it.productName} (x${it.quantity})`),
    };
  });
}
