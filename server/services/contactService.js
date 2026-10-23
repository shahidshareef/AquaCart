const mongoose = require("mongoose");
const ContactMessage = require("../models/ContactMessage");

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function createContactMessage(payload = {}) {
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const subject = String(payload.subject || "").trim();
    const category = String(payload.category || "general").trim();
    const orderReference = String(payload.orderReference || "").trim();
    const message = String(payload.message || "").trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedCategories = ["general", "order", "product", "return", "payment", "technical", "other"];

    if (name.length < 2 || name.length > 80) {
        throw createError("Name must be between 2 and 80 characters.", 400);
    }
    if (!emailPattern.test(email) || email.length > 254) {
        throw createError("Please enter a valid email address.", 400);
    }
    if (subject.length < 3 || subject.length > 120) {
        throw createError("Subject must be between 3 and 120 characters.", 400);
    }
    if (!allowedCategories.includes(category)) {
        throw createError("Please choose a valid contact category.", 400);
    }
    if (orderReference.length > 80) {
        throw createError("Order reference must be 80 characters or fewer.", 400);
    }
    if (message.length < 10 || message.length > 3000) {
        throw createError("Message must be between 10 and 3000 characters.", 400);
    }

    return ContactMessage.create({ name, email, subject, category, orderReference, message });
}

async function getContactMessages(status) {
    const filter = ["new", "in_progress", "resolved"].includes(status) ? { status } : {};
    return ContactMessage.find(filter).sort({ createdAt: -1 }).lean();
}

async function updateContactMessageStatus(id, status) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw createError("Invalid contact message ID.", 400);
    }
    if (!["new", "in_progress", "resolved"].includes(status)) {
        throw createError("Choose a valid message status.", 400);
    }

    const contactMessage = await ContactMessage.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    ).lean();

    if (!contactMessage) {
        throw createError("Contact message not found.", 404);
    }

    return contactMessage;
}

module.exports = { createContactMessage, getContactMessages, updateContactMessageStatus };
