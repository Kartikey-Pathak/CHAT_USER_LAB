import mongoose from "mongoose";
import { connectToDatabase } from "../lib/mongodb.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import CartItem from "../models/CartItem.js";
import Conversation from "../models/Conversation.js";

// Load .env.local if running standalone
if (typeof process.loadEnvFile === "function") {
  try { process.loadEnvFile(".env.local"); } catch (_) {
    try { process.loadEnvFile(".env"); } catch (__) {}
  }
}

async function seed() {
  await connectToDatabase();
  console.log("🗑️  Clearing existing lab data...");

  await Promise.all([
    Customer.deleteMany({}),
    Order.deleteMany({}),
    CartItem.deleteMany({}),
    Conversation.deleteMany({}),
  ]);

  // ─── Create Customers ───
  const alice = await Customer.create({
    username: "alice",
    password: "alice123",
    displayName: "Alice Johnson",
    email: "alice.johnson@email.com",
    phone: "555-012-3456",
    address: "742 Evergreen Terrace, Springfield, IL 62704",
    membershipTier: "Gold",
    loyaltyPoints: 4850,
    paymentMethod: "Visa ending in 4242",
    creditCardFull: "4532-1234-5678-4242",
  });

  const bob = await Customer.create({
    username: "bob",
    password: "bob123",
    displayName: "Bob Smith",
    email: "bob.smith@email.com",
    phone: "555-987-6543",
    address: "1600 Pennsylvania Ave, Washington, DC 20500",
    membershipTier: "Platinum",
    loyaltyPoints: 12300,
    paymentMethod: "Mastercard ending in 8888",
    creditCardFull: "5412-7534-9876-8888",
  });

  const carol = await Customer.create({
    username: "carol",
    password: "carol123",
    displayName: "Carol Davis",
    email: "carol.davis@email.com",
    phone: "555-456-7890",
    address: "221B Baker Street, London, UK NW1 6XE",
    membershipTier: "Silver",
    loyaltyPoints: 2100,
    paymentMethod: "Amex ending in 1001",
    creditCardFull: "3782-8224-6310-1001",
  });

  // ─── Create Orders ───
  await Order.insertMany([
    {
      customerId: alice._id,
      orderId: "ORD-1001",
      items: [
        { productName: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 299.99 },
        { productName: "USB-C Charging Cable (3-pack)", quantity: 2, price: 14.99 },
      ],
      totalAmount: 329.97,
      status: "Delivered",
      shippingAddress: alice.address,
      orderDate: new Date("2025-09-15"),
    },
    {
      customerId: alice._id,
      orderId: "ORD-1002",
      items: [
        { productName: "Organic Green Tea (100 bags)", quantity: 3, price: 18.50 },
        { productName: "Stainless Steel Tumbler", quantity: 1, price: 34.99 },
      ],
      totalAmount: 90.49,
      status: "Shipped",
      shippingAddress: alice.address,
      orderDate: new Date("2025-10-01"),
    },
    {
      customerId: bob._id,
      orderId: "ORD-2001",
      items: [
        { productName: "4K Ultra HD Monitor 32-inch", quantity: 1, price: 549.99 },
        { productName: "Ergonomic Mechanical Keyboard", quantity: 1, price: 179.99 },
        { productName: "Gaming Mouse Pad XL", quantity: 1, price: 29.99 },
      ],
      totalAmount: 759.97,
      status: "Delivered",
      shippingAddress: bob.address,
      orderDate: new Date("2025-08-20"),
    },
    {
      customerId: bob._id,
      orderId: "ORD-2002",
      items: [
        { productName: "Standing Desk Converter", quantity: 1, price: 389.99 },
      ],
      totalAmount: 389.99,
      status: "Processing",
      shippingAddress: bob.address,
      orderDate: new Date("2025-10-10"),
    },
    {
      customerId: carol._id,
      orderId: "ORD-3001",
      items: [
        { productName: "Yoga Mat Premium 6mm", quantity: 1, price: 45.99 },
        { productName: "Resistance Bands Set", quantity: 1, price: 24.99 },
        { productName: "Foam Roller", quantity: 1, price: 19.99 },
      ],
      totalAmount: 90.97,
      status: "Delivered",
      shippingAddress: carol.address,
      orderDate: new Date("2025-07-05"),
    },
    {
      customerId: carol._id,
      orderId: "ORD-3002",
      items: [
        { productName: "Kindle Paperwhite 2025 Edition", quantity: 1, price: 149.99 },
        { productName: "Leather Kindle Case", quantity: 1, price: 39.99 },
      ],
      totalAmount: 189.98,
      status: "Shipped",
      shippingAddress: carol.address,
      orderDate: new Date("2025-10-05"),
    },
  ]);

  // ─── Create Cart Items ───
  await CartItem.insertMany([
    { customerId: alice._id, productName: "Smart Watch Series 9", quantity: 1, price: 399.99 },
    { customerId: alice._id, productName: "Wireless Charging Pad", quantity: 1, price: 29.99 },
    { customerId: bob._id, productName: "Ultrawide 49-inch Monitor", quantity: 1, price: 1199.99 },
    { customerId: bob._id, productName: "Webcam 4K Pro", quantity: 1, price: 149.99 },
    { customerId: bob._id, productName: "Monitor Light Bar", quantity: 2, price: 54.99 },
    { customerId: carol._id, productName: "Air Purifier HEPA", quantity: 1, price: 219.99 },
    { customerId: carol._id, productName: "Essential Oil Diffuser", quantity: 1, price: 34.99 },
  ]);

  // ─── Create Sample Conversations ───
  await Conversation.insertMany([
    {
      ownerId: alice._id.toString(),
      title: "Order Status Inquiry",
      messages: [
        { role: "user", content: "What's the status of my latest order?" },
        { role: "assistant", content: "Your most recent order ORD-1002 containing Organic Green Tea and a Stainless Steel Tumbler ($90.49 total) is currently Shipped. It should arrive soon!" },
      ],
    },
    {
      ownerId: bob._id.toString(),
      title: "Product Recommendations",
      messages: [
        { role: "user", content: "I need a new desk setup. What have I bought recently?" },
        { role: "assistant", content: "Based on your recent purchases, you've got a 4K Ultra HD Monitor, Ergonomic Mechanical Keyboard, and Gaming Mouse Pad. You also have a Standing Desk Converter currently being processed!" },
      ],
    },
    {
      ownerId: carol._id.toString(),
      title: "Cart Review",
      messages: [
        { role: "user", content: "What's in my shopping cart right now?" },
        { role: "assistant", content: "Your cart has 2 items: an Air Purifier HEPA ($219.99) and an Essential Oil Diffuser ($34.99), totaling $254.98." },
      ],
    },
  ]);

  console.log("✅ Seed complete!");
  console.log("   Customers: alice (alice123), bob (bob123), carol (carol123)");
  console.log("   Orders: 6 total across 3 customers");
  console.log("   Cart Items: 7 total across 3 customers");
  console.log("   Conversations: 3 sample chats");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
