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

        couponCode: {
            type: String,
            default: null
        },

        discountAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        paymentMethod: {
            type: String,
            enum: ["razorpay", "cod", "wallet"],
            required: true
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded",
                "review_required"
            ],
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
        },

        // Customer order cancellation information
        cancellationReason: {
            type: String,
            trim: true,
            default: null
        },

        cancellationRequestedAt: {
            type: Date,
            default: null
        },

        cancelledAt: {
            type: Date,
            default: null
        },

        // Customer return request and admin review information
        returnRequest: {
            reason: {
                type: String,
                trim: true,
                default: null
            },

            details: {
                type: String,
                trim: true,
                default: null
            },

            status: {
                type: String,
                enum: [
                    "not_requested",
                    "pending",
                    "approved",
                    "rejected",
                    "completed"
                ],
                default: "not_requested"
            },

            requestedAt: {
                type: Date,
                default: null
            },

            reviewedAt: {
                type: Date,
                default: null
            },

            adminNote: {
                type: String,
                trim: true,
                default: null
            }
        },

        // Tracks the refund separately from the payment status
        refundStatus: {
            type: String,
            enum: [
                "not_applicable",
                "pending",
                "processing",
                "completed",
                "failed"
            ],
            default: "not_applicable"
        },

        refundAmount: {
            type: Number,
            min: 0,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);