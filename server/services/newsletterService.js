const NewsletterSubscriber = require("../models/NewsletterSubscriber");

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function subscribeToNewsletter(rawEmail) {
    const email = String(rawEmail || "").trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || email.length > 254 || !emailPattern.test(email)) {
        throw createError("Please enter a valid email address.", 400);
    }

    const existingSubscriber = await NewsletterSubscriber.findOne({ email });

    if (existingSubscriber) {
        if (existingSubscriber.status === "unsubscribed") {
            existingSubscriber.status = "subscribed";
            await existingSubscriber.save();
            return { subscriber: existingSubscriber, alreadySubscribed: false };
        }

        return { subscriber: existingSubscriber, alreadySubscribed: true };
    }

    try {
        const subscriber = await NewsletterSubscriber.create({ email, status: "subscribed" });
        return { subscriber, alreadySubscribed: false };
    } catch (error) {
        if (error.code === 11000) {
            return { subscriber: await NewsletterSubscriber.findOne({ email }), alreadySubscribed: true };
        }
        throw error;
    }
}

module.exports = { subscribeToNewsletter };
