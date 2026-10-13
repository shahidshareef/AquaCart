const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    createPaymentOrderController,
    verifyPaymentController
} = require("../controllers/paymentController");

const router = express.Router();

// Create a Razorpay order for the logged-in customer.
router.post(
    "/create-order",
    authMiddleware,
    roleMiddleware("customer"),
    createPaymentOrderController
);

// Verify a Razorpay payment for the logged-in customer.
router.post(
    "/verify-payment",
    authMiddleware,
    roleMiddleware("customer"),
    verifyPaymentController
);

module.exports = router;