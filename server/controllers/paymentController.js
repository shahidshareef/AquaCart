const mongoose = require("mongoose");

const {
    createRazorpayOrder,
    verifyRazorpaySignature,
    fetchRazorpayPayment
} = require("../services/paymentService");

const {
    getRazorpayCheckoutDetails,
    createPendingRazorpayOrder,
    completeRazorpayOrder,
    createWalletPaidOrder
} = require("../services/orderService");

const Payment = require("../models/Payment");
const Order = require("../models/Order");

async function createPaymentOrderController(req, res) {
    try {
        const { addressId, couponCode, walletAmount = 0 } = req.body;

        if (!addressId) {
            return res.status(400).json({
                message: "Shipping address is required"
            });
        }

        // Calculate the total using database data.
        const checkoutDetails = await getRazorpayCheckoutDetails(
            req.user.userId,
            addressId,
            couponCode
        );

        const normalizedWalletAmount =
            Math.round(Number(walletAmount) * 100) / 100;

        if (
            !Number.isFinite(normalizedWalletAmount) ||
            normalizedWalletAmount < 0
        ) {
            return res.status(400).json({
                message: "Invalid wallet payment amount"
            });
        }

        if (normalizedWalletAmount > checkoutDetails.totalAmount) {
            return res.status(400).json({
                message: "Wallet payment cannot exceed the order total"
            });
        }

        const orderTotal =
            Math.round(Number(checkoutDetails.totalAmount) * 100) / 100;
        const razorpayAmount =
            Math.round((orderTotal - normalizedWalletAmount) * 100) / 100;

        console.log("[wallet-checkout:create-order]", {
            userId: String(req.user.userId),
            orderTotal,
            requestedWalletAmount: walletAmount,
            normalizedWalletAmount,
            razorpayAmount,
            razorpayAmountInPaise: Math.round(razorpayAmount * 100)
        });

        if (razorpayAmount <= 0) {
            const { order, payment } = await createWalletPaidOrder(
                req.user.userId,
                checkoutDetails
            );

            return res.status(201).json({
                message: "Order paid successfully using your wallet",
                data: {
                    orderId: order._id,
                    paymentId: payment._id,
                    paymentMethod: "wallet",
                    paymentStatus: order.paymentStatus,
                    orderStatus: order.orderStatus,
                    orderTotal: checkoutDetails.totalAmount,
                    walletAmount: normalizedWalletAmount,
                    razorpayAmount: 0
                }
            });
        }

        const amountInPaise = Math.round(razorpayAmount * 100);

        if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({
                message: "Invalid Razorpay checkout amount"
            });
        }

        // Create the Razorpay order only for the amount remaining after
        // the customer's selected wallet amount.
        const receipt = `aquacart_${Date.now()}`;

        const razorpayOrder = await createRazorpayOrder(
            razorpayAmount,
            receipt
        );

        // Never continue if Razorpay created an order for a different amount.
        if (
            Number(razorpayOrder.amount) !== amountInPaise ||
            razorpayOrder.currency !== "INR"
        ) {
            console.error("[wallet-checkout:razorpay-amount-mismatch]", {
                expectedPaise: amountInPaise,
                actualPaise: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderTotal,
                walletAmount: normalizedWalletAmount,
                razorpayAmount
            });

            return res.status(502).json({
                message: "Razorpay amount mismatch. No payment was opened. Please try again."
            });
        }

        // Save the pending order/payment with both payment portions.
        const { order, payment } = await createPendingRazorpayOrder(
            req.user.userId,
            checkoutDetails,
            razorpayOrder.id,
            normalizedWalletAmount
        );

        return res.status(201).json({
            message: "Payment order created successfully",
            data: {
                orderId: order._id,
                paymentId: payment._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderTotal,
                walletAmount: normalizedWalletAmount,
                razorpayAmount
            }
        });
    } catch (error) {
        console.error(error);

        const clientErrors = [
            "Address not found",
            "Your cart is empty",
            "A cart item is no longer available",
            "Minimum order amount not met",
            "Invalid or expired coupon",
            "Coupon usage limit has been reached",
            "Invalid wallet payment amount",
            "Wallet payment cannot exceed the order total",
            "Wallet not found",
            "Insufficient wallet balance",
            "A full wallet payment does not require a Razorpay order",
            "Wallet payment total must be greater than zero",
            "Cart changed after checkout; please try again",
            "Insufficient stock to complete the order",
            "Coupon is no longer available"
        ];

        if (
            clientErrors.includes(error.message) ||
            error.message.startsWith("Insufficient stock for ")
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to create payment order"
        });
    }
}

async function verifyPaymentController(req, res) {
    let capturedPayment = null;
    let paymentRecord = null;

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            typeof razorpay_order_id !== "string" ||
            typeof razorpay_payment_id !== "string" ||
            typeof razorpay_signature !== "string" ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !/^[a-f0-9]{64}$/.test(razorpay_signature)
        ) {
            return res.status(400).json({
                message: "Valid payment verification details are required"
            });
        }

        paymentRecord = await Payment.findOne({
            razorpayOrderId: razorpay_order_id,
            user: req.user.userId,
            paymentMethod: "razorpay"
        });

        if (!paymentRecord) {
            return res.status(404).json({
                message: "Payment record not found"
            });
        }

        const isValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return res.status(400).json({
                message: "Invalid payment signature"
            });
        }

        // Handle repeated verification of an already-paid payment.
        if (paymentRecord.status === "paid") {
            if (paymentRecord.transactionId === razorpay_payment_id) {
                return res.status(200).json({
                    message: "Payment already verified",
                    data: {
                        orderId: paymentRecord.order,
                        paymentStatus: "paid",
                        orderStatus: "confirmed"
                    }
                });
            }

            return res.status(409).json({
                message: "Payment has already been completed"
            });
        }

        // Do not allow a payment requiring investigation to be retried.
        if (paymentRecord.status === "review_required") {
            return res.status(409).json({
                message:
                    "This payment requires review. Do not retry payment.",
                data: {
                    orderId: paymentRecord.order,
                    paymentStatus: "review_required",
                    refundStatus: "not_initiated"
                }
            });
        }

        // Other non-pending payment statuses cannot be verified.
        if (paymentRecord.status !== "pending") {
            return res.status(409).json({
                message: "Payment is not pending"
            });
        }

        // Fetch the payment directly from Razorpay.
        capturedPayment = await fetchRazorpayPayment(
            razorpay_payment_id
        );

        const expectedRazorpayAmount = Number(
            paymentRecord.razorpayAmount ?? paymentRecord.amount
        );
        const expectedRazorpayPaise = Math.round(expectedRazorpayAmount * 100);

        console.log("[wallet-checkout:verify-payment]", {
            orderId: String(paymentRecord.order),
            razorpayOrderId: razorpay_order_id,
            capturedAmountPaise: capturedPayment.amount,
            expectedRazorpayAmount,
            expectedRazorpayPaise,
            walletAmountToDebit: paymentRecord.walletAmount,
            paymentStatus: paymentRecord.status
        });

        if (
            capturedPayment.order_id !== razorpay_order_id ||
            capturedPayment.amount !== expectedRazorpayPaise ||
            capturedPayment.currency !== "INR"
        ) {
            return res.status(400).json({
                message: "Payment details do not match the order"
            });
        }

        if (capturedPayment.status !== "captured") {
            return res.status(409).json({
                message: "Payment has not been captured"
            });
        }

        // Complete the AquaCart order after payment verification.
        const order = await completeRazorpayOrder(
            req.user.userId,
            razorpay_order_id,
            razorpay_payment_id
        );

        return res.status(200).json({
            message: "Payment verified successfully",
            data: {
                orderId: order._id,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus
            }
        });
    } catch (error) {
        console.error(error);

        const reviewRequiredErrors = [
            "Cart changed after checkout; order needs review",
            "Insufficient stock to complete the order",
            "Coupon is no longer available",
            "Coupon usage limit has been reached",
            "Insufficient wallet balance",
            "Wallet not found"
        ];

        if (
            capturedPayment?.status === "captured" &&
            paymentRecord &&
            reviewRequiredErrors.includes(error.message)
        ) {
            let session;

            try {
                session = await mongoose.startSession();

                await session.withTransaction(async () => {
                    // Update the Order record.
                    const order = await Order.findOneAndUpdate(
                        {
                            _id: paymentRecord.order,
                            user: req.user.userId,
                            paymentMethod: "razorpay",
                            paymentStatus: "pending",
                            orderStatus: "pending"
                        },
                        {
                            $set: {
                                paymentStatus: "review_required"
                            }
                        },
                        {
                            new: true,
                            runValidators: true,
                            session
                        }
                    );

                    // Update the corresponding Payment record.
                    const payment = await Payment.findOneAndUpdate(
                        {
                            _id: paymentRecord._id,
                            user: req.user.userId,
                            paymentMethod: "razorpay",
                            status: "pending"
                        },
                        {
                            $set: {
                                status: "review_required",
                                transactionId: razorpay_payment_id
                            }
                        },
                        {
                            new: true,
                            runValidators: true,
                            session
                        }
                    );

                    // Abort if either record could not be updated.
                    if (!order || !payment) {
                        throw new Error(
                            "Could not update both payment review records"
                        );
                    }
                });

                return res.status(409).json({
                    message:
                        "Payment was captured, but the order needs review. Do not retry payment.",
                    data: {
                        orderId: paymentRecord.order,
                        paymentStatus: "review_required",
                        refundStatus: "not_initiated"
                    }
                });
            } catch (reviewError) {
                console.error(
                    "Failed to update payment review records:",
                    reviewError
                );

                return res.status(500).json({
                    message:
                        "Payment was captured, but order processing needs investigation. Do not retry payment.",
                    data: {
                        orderId: paymentRecord.order,
                        refundStatus: "not_initiated"
                    }
                });
            } finally {
                if (session) {
                    await session.endSession();
                }
            }
        }

        const clientErrors = [
            "Payment record not found",
            "Payment is not pending",
            "Payment has already been completed",
            "Pending AquaCart order not found"
        ];

        if (clientErrors.includes(error.message)) {
            return res.status(409).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Failed to verify payment"
        });
    }
}

module.exports = {
    createPaymentOrderController,
    verifyPaymentController
};