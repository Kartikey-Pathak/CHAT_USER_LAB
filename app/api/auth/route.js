import { NextResponse } from "next/server";
import Customer from "../../../models/Customer";
import CartItem from "../../../models/CartItem";
import Order from "../../../models/Order";
import { connectToDatabase } from "../../../lib/mongodb";

// Random seed data generators for new user accounts
const RANDOM_PRODUCTS = [
  { name: "Wireless Noise-Cancelling Headphones", price: 299.99 },
  { name: "Smart Watch Series 9", price: 399.99 },
  { name: "Portable Bluetooth Speaker", price: 79.99 },
  { name: "USB-C Hub Adapter 7-in-1", price: 49.99 },
  { name: "Mechanical Gaming Keyboard", price: 149.99 },
  { name: "Ergonomic Mouse Pad XL", price: 24.99 },
  { name: "4K Webcam Pro", price: 129.99 },
  { name: "LED Desk Lamp", price: 44.99 },
  { name: "Laptop Stand Aluminum", price: 59.99 },
  { name: "Wireless Charging Pad", price: 29.99 },
  { name: "Noise-Cancelling Earbuds", price: 199.99 },
  { name: "Smart Home Hub", price: 89.99 },
  { name: "Fitness Tracker Band", price: 69.99 },
  { name: "Portable Power Bank 20000mAh", price: 39.99 },
  { name: "Gaming Mouse RGB", price: 59.99 },
];

const RANDOM_PHONES = [
  "555-123-4567", "555-234-5678", "555-345-6789", "555-456-7890",
  "555-567-8901", "555-678-9012", "555-789-0123", "555-890-1234",
];

const RANDOM_ADDRESSES = [
  "742 Evergreen Terrace, Springfield, IL 62704",
  "221B Baker Street, London, UK NW1 6XE",
  "1600 Pennsylvania Ave, Washington, DC 20500",
  "350 Fifth Avenue, New York, NY 10118",
  "1 Infinite Loop, Cupertino, CA 95014",
  "1060 W Addison St, Chicago, IL 60613",
];

const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];
const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered"];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCreditCard() {
  const prefix = ["4532", "5412", "3782", "6011"][randomInt(0, 3)];
  const groups = [prefix];
  for (let i = 0; i < 3; i++) groups.push(String(randomInt(1000, 9999)));
  return groups.join("-");
}

/**
 * Generate random seed data (cart items + orders) for a newly registered customer.
 */
async function seedNewCustomerData(customerId) {
  // Generate 2-4 cart items
  const cartCount = randomInt(2, 4);
  const usedProducts = new Set();
  const cartItems = [];
  for (let i = 0; i < cartCount; i++) {
    let product;
    do {
      product = pickRandom(RANDOM_PRODUCTS);
    } while (usedProducts.has(product.name));
    usedProducts.add(product.name);
    cartItems.push({
      customerId,
      productName: product.name,
      quantity: randomInt(1, 3),
      price: product.price,
    });
  }
  await CartItem.insertMany(cartItems);

  // Generate 1-3 orders
  const orderCount = randomInt(1, 3);
  const orders = [];
  for (let i = 0; i < orderCount; i++) {
    const itemCount = randomInt(1, 3);
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const prod = pickRandom(RANDOM_PRODUCTS);
      const qty = randomInt(1, 2);
      items.push({ productName: prod.name, quantity: qty, price: prod.price });
    }
    const totalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    orders.push({
      customerId,
      orderId: `ORD-${randomInt(4000, 9999)}`,
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: pickRandom(ORDER_STATUSES),
      shippingAddress: pickRandom(RANDOM_ADDRESSES),
      orderDate: new Date(Date.now() - randomInt(1, 90) * 86400000),
    });
  }
  await Order.insertMany(orders);
}

/**
 * POST /api/auth – Login or Signup.
 * Body: { email, password, action?: "signup"|"login", displayName? }
 */
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password, action, displayName } = body;

    // Also support legacy username-based login
    const username = body.username;

    if ((!email && !username) || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ─── SIGNUP ───
    if (action === "signup") {
      if (!email) {
        return NextResponse.json(
          { error: "Email is required for signup" },
          { status: 400 }
        );
      }

      // Check if email already exists
      const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please login instead." },
          { status: 409 }
        );
      }

      // Create new customer with random seed data
      const nameFromEmail = displayName || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      const creditCard = generateCreditCard();

      const customer = await Customer.create({
        email: email.toLowerCase().trim(),
        username: email.toLowerCase().trim().split("@")[0] + randomInt(100, 999),
        password,
        displayName: nameFromEmail,
        phone: pickRandom(RANDOM_PHONES),
        address: pickRandom(RANDOM_ADDRESSES),
        membershipTier: pickRandom(TIERS),
        loyaltyPoints: randomInt(100, 10000),
        paymentMethod: `Visa ending in ${creditCard.slice(-4)}`,
        creditCardFull: creditCard,
      });

      // Generate random cart and order data
      await seedNewCustomerData(customer._id);

      // Create session
      const session = {
        customerId: customer._id.toString(),
        username: customer.username,
        displayName: customer.displayName,
        email: customer.email,
      };
      const token = Buffer.from(JSON.stringify(session)).toString("base64");

      const response = NextResponse.json({
        success: true,
        customer: {
          username: customer.username,
          displayName: customer.displayName,
          email: customer.email,
          membershipTier: customer.membershipTier,
        },
      });

      response.cookies.set("lab_session", token, {
        httpOnly: false,
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

      return response;
    }

    // ─── LOGIN ───
    let customer;
    if (email) {
      customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    } else if (username) {
      customer = await Customer.findOne({ username: username.toLowerCase().trim() });
    }

    if (!customer || customer.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const session = {
      customerId: customer._id.toString(),
      username: customer.username,
      displayName: customer.displayName,
      email: customer.email,
    };
    const token = Buffer.from(JSON.stringify(session)).toString("base64");

    const response = NextResponse.json({
      success: true,
      customer: {
        username: customer.username,
        displayName: customer.displayName,
        email: customer.email,
        membershipTier: customer.membershipTier,
      },
    });

    response.cookies.set("lab_session", token, {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
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

    const rawVal = decodeURIComponent(match[1].trim());
    const decoded = Buffer.from(rawVal, "base64").toString("utf8");
    const session = JSON.parse(decoded);

    return NextResponse.json({
      authenticated: true,
      customer: {
        customerId: session.customerId,
        username: session.username,
        displayName: session.displayName,
        email: session.email,
      },
    });
  } catch (_) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
