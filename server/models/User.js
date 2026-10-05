const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["customer", "admin"],
            default: "customer"
        },

        status: {
            type: String,
            enum: ["active", "blocked"],
            default: "active"
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        emailVerificationOtp: {
            type: String
        },

        emailVerificationOtpExpiresAt: {
            type: Date
        },

        adminOtp: {
            type: String
        },

        adminOtpExpiresAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);