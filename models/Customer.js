import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true }, // plain-text for lab demo only
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    membershipTier: { type: String, enum: ["Bronze", "Silver", "Gold", "Platinum"], default: "Bronze" },
    loyaltyPoints: { type: Number, default: 0 },
    paymentMethod: { type: String }, // last 4 digits only in display, full in DB for vuln demo
    creditCardFull: { type: String }, // intentionally sensitive for lab testing
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
