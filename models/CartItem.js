import mongoose from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.CartItem || mongoose.model("CartItem", CartItemSchema);
