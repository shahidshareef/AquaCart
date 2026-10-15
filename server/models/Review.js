const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        title: {
            type: String,
            trim: true,
            required: true,
            maxlength: 120
        },
        comment: {
            type: String,
            trim: true,
            required: true,
            maxlength: 2000
        },
        images: [{ type: String }],
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true
        },
        moderationNote: {
            type: String,
            trim: true,
            default: "",
            maxlength: 1000
        },
        moderatedAt: {
            type: Date,
            default: null
        },
        moderatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true }
);

// A customer can review a product only once, regardless of how many times it was ordered.
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
