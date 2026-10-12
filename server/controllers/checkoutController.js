const {
    getCheckoutSummary,
    applyCoupon
} = require("../services/checkoutService");

async function getCheckoutSummaryController(req, res) {
    try {
        const userId = req.user.userId;

        const summary = await getCheckoutSummary(userId);

        return res.status(200).json({
            message: "Checkout summary fetched successfully",
            data: summary
        });
    } catch (error) {
        console.error(error);

        if (error.message === "Your cart is empty") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to fetch checkout summary"
        });
    }
}

async function applyCouponController(req, res) {
    try {
        const userId = req.user.userId;
        const { couponCode } = req.body;

        if (!couponCode || !couponCode.trim()) {
            return res.status(400).json({
                message: "Coupon code is required"
            });
        }

        const summary = await applyCoupon(
            userId,
            couponCode
        );

        return res.status(200).json({
            message: "Coupon applied successfully",
            data: summary
        });
    } catch (error) {
        console.error(error);

        const clientErrors = [
            "Your cart is empty",
            "Invalid or inactive coupon",
            "Coupon is not valid at this time",
            "Coupon usage limit has been reached"
        ];

        if (
            clientErrors.includes(error.message) ||
            error.message.startsWith("Minimum order amount")
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to apply coupon"
        });
    }
}

module.exports = {
    getCheckoutSummaryController,
    applyCouponController
};