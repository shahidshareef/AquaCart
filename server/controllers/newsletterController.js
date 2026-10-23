const { subscribeToNewsletter } = require("../services/newsletterService");

async function subscribeController(req, res) {
    try {
        const result = await subscribeToNewsletter(req.body?.email);

        return res.status(result.alreadySubscribed ? 200 : 201).json({
            message: result.alreadySubscribed
                ? "This email is already subscribed. Thanks for staying with AquaCart!"
                : "Thanks for subscribing to AquaCart updates!",
            data: { email: result.subscriber.email, status: result.subscriber.status }
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Could not save your subscription. Please try again."
        });
    }
}

module.exports = { subscribeController };