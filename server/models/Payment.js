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
            enum: ["razorpay", "cod"],
            required: true
        },

        transactionId: {
            type: String,
            unique: true,
            sparse: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);