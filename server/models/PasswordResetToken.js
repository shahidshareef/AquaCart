const mongoose = require("mongoose");

const passwordResetTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        token: {
            type: String,
            required: true,
            unique: true
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema);