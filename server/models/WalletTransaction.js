
const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
    {
        wallet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
            index: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },

        source: {
            type: String,
            enum: [
                "refund",
                "purchase",
                "admin_adjustment"
            ],
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
        },

        balanceAfter: {
            type: Number,
            required: true,
            min: 0
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
            index: true
        },

        idempotencyKey: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        }
    },
    {
        timestamps: true
    }
);

walletTransactionSchema.index({
    user: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "WalletTransaction",
    walletTransactionSchema
);
