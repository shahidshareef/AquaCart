const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
        subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
        category: {
            type: String,
            enum: ["general", "order", "product", "return", "payment", "technical", "other"],
            default: "general"
        },
        orderReference: { type: String, trim: true, maxlength: 80, default: "" },
        message: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
        status: {
            type: String,
            enum: ["new", "in_progress", "resolved"],
            default: "new",
            index: true
        }
    },
    { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
