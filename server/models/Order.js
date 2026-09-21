const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        orderItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                variant: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "ProductVariant",
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                price: {
                    type: Number,
                    required: true,
                    min: 0
                }
            }
        ],

        shippingAddress: {
            fullName: String,
            phone: String,
            addressLine: String,
            city: String,
            state: String,
            pincode: String
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentMethod: {
            type: String,
            enum: ["razorpay", "cod"],
            required: true
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending"
        },

        orderStatus: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
                "returned"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);