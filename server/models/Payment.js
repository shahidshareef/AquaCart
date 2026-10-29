const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        paymentMethod: {
            type: String,
            enum: ["razorpay", "cod", "wallet"],
            required: true
        },

        transactionId: {
            type: String,
            unique: true,
            sparse: true
        },

        razorpayOrderId: {
            type: String,
            sparse: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        // Amount paid using the customer's wallet.
        walletAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        // Amount that must be paid through Razorpay.
        razorpayAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded",
                "review_required"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);