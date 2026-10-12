const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getCheckoutSummaryController,
    applyCouponController
} = require("../controllers/checkoutController");

const router = express.Router();

router.get(
    "/summary",
    authMiddleware,
    roleMiddleware("customer"),
    getCheckoutSummaryController
);

router.post(
    "/apply-coupon",
    authMiddleware,
    roleMiddleware("customer"),
    applyCouponController
);

module.exports = router;