const mongoose = require("mongoose");
const Order = require("../models/Order");
const ProductVariant = require("../models/ProductVariant");
const { creditWalletInSession } = require("./walletLedgerService");
const WalletTransaction = require("../models/WalletTransaction");

const CANCELLABLE_STATUSES = ["pending", "confirmed", "processing"];

// Cancel an order placed by the logged-in customer.
// A successfully paid Razorpay order is refunded to AquaCart wallet atomically.
async function cancelCustomerOrder(userId, orderId, reason = "") {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error("Invalid order ID");
    }

    if (typeof reason !== "string") {
        throw new Error("Cancellation reason must be text");
    }

    const cancellationReason = reason.trim();

    if (cancellationReason.length > 500) {
        throw new Error("Cancellation reason cannot exceed 500 characters");
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const existingOrder = await Order.findOne({
                _id: orderId,
                user: userId
            }).session(session);

            if (!existingOrder) {
                throw new Error("Order not found");
            }

            if (!CANCELLABLE_STATUSES.includes(existingOrder.orderStatus)) {
                throw new Error("This order can no longer be cancelled");
            }

            const needsWalletRefund =
                existingOrder.paymentMethod === "razorpay" &&
                existingOrder.paymentStatus === "paid";

            const now = new Date();

            const cancelledOrder = await Order.findOneAndUpdate(
                {
                    _id: orderId,
                    user: userId,
                    orderStatus: { $in: CANCELLABLE_STATUSES }
                },
                {
                    $set: {
                        orderStatus: "cancelled",
                        cancellationReason: cancellationReason || null,
                        cancellationRequestedAt: now,
                        cancelledAt: now,
                        refundStatus: needsWalletRefund ? "completed" : "not_applicable",
                        refundAmount: needsWalletRefund
                            ? Math.round(existingOrder.totalAmount * 100) / 100
                            : 0,
                        ...(needsWalletRefund ? { paymentStatus: "refunded" } : {})
                    }
                },
                {
                    new: true,
                    runValidators: true,
                    session
                }
            );

            if (!cancelledOrder) {
                throw new Error("This order can no longer be cancelled");
            }

            // COD stock is deducted when the order is created. Razorpay stock
            // is deducted after successful payment. Unpaid Razorpay orders do
            // not have stock restored here because stock was not deducted.
            const shouldRestoreStock =
                existingOrder.paymentMethod === "cod" ||
                existingOrder.paymentStatus === "paid";

            if (shouldRestoreStock) {
                for (const item of cancelledOrder.orderItems) {
                    const result = await ProductVariant.updateOne(
                        {
                            _id: item.variant,
                            product: item.product
                        },
                        {
                            $inc: { stock: item.quantity }
                        },
                        { session }
                    );

                    if (result.modifiedCount !== 1) {
                        throw new Error(
                            "Could not restore product stock. Cancellation was not completed."
                        );
                    }
                }
            }

            if (needsWalletRefund) {
                await creditWalletInSession({
                    userId: existingOrder.user,
                    amount: existingOrder.totalAmount,
                    orderId: existingOrder._id,
                    source: "refund",
                    description: `Wallet refund for cancelled order #${existingOrder._id}`,
                    idempotencyKey: `refund:cancel:${existingOrder._id}`,
                    session
                });
            }
        });

        return await Order.findOne({ _id: orderId, user: userId })
            .populate("orderItems.product", "name")
            .populate("orderItems.variant", "size sku price");
    } finally {
        await session.endSession();
    }
}

// Submit a return request for a delivered order.
async function requestOrderReturn(userId, orderId, reason, details = "") {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error("Invalid order ID");
    }

    if (typeof reason !== "string" || !reason.trim()) {
        throw new Error("Return reason is required");
    }

    if (reason.trim().length > 200) {
        throw new Error("Return reason cannot exceed 200 characters");
    }

    if (typeof details !== "string") {
        throw new Error("Return details must be text");
    }

    if (details.trim().length > 1000) {
        throw new Error("Return details cannot exceed 1000 characters");
    }

    const now = new Date();

    const order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            user: userId,
            orderStatus: "delivered",
            $or: [
                { "returnRequest.status": { $in: ["not_requested", "rejected"] } },
                { "returnRequest.status": { $exists: false } },
                { "returnRequest.status": null }
            ]
        },
        {
            $set: {
                "returnRequest.reason": reason.trim(),
                "returnRequest.details": details.trim() || null,
                "returnRequest.status": "pending",
                "returnRequest.requestedAt": now,
                "returnRequest.reviewedAt": null,
                "returnRequest.adminNote": null
            }
        },
        {
            new: true,
            runValidators: true
        }
    )
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price");

    if (order) return order;

    const existingOrder = await Order.findOne({ _id: orderId, user: userId });

    if (!existingOrder) throw new Error("Order not found");
    if (existingOrder.orderStatus !== "delivered") {
        throw new Error("Only delivered orders can be returned");
    }
    if (existingOrder.returnRequest && ["pending", "approved", "completed"].includes(existingOrder.returnRequest.status)) {
        throw new Error("A return request already exists for this order");
    }

    throw new Error("Could not submit return request. Please try again.");
}

// Admin approves or rejects a pending return request.
async function reviewOrderReturn(orderId, decision, adminNote = "") {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error("Invalid order ID");
    }

    if (!["approved", "rejected"].includes(decision)) {
        throw new Error("Decision must be approved or rejected");
    }

    if (typeof adminNote !== "string") {
        throw new Error("Admin note must be text");
    }

    const trimmedAdminNote = adminNote.trim();

    if (trimmedAdminNote.length > 1000) {
        throw new Error("Admin note cannot exceed 1000 characters");
    }

    const order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            orderStatus: "delivered",
            "returnRequest.status": "pending"
        },
        {
            $set: {
                "returnRequest.status": decision,
                "returnRequest.adminNote": trimmedAdminNote || null,
                "returnRequest.reviewedAt": new Date()
            }
        },
        {
            new: true,
            runValidators: true
        }
    )
        .populate("user", "name email")
        .populate("orderItems.product", "name")
        .populate("orderItems.variant", "size sku price");

    if (order) return order;

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) throw new Error("Order not found");
    if (existingOrder.orderStatus !== "delivered") {
        throw new Error("Only delivered orders can have return requests reviewed");
    }
    if (!existingOrder.returnRequest || existingOrder.returnRequest.status !== "pending") {
        throw new Error("This order has no pending return request");
    }

    throw new Error("Could not review return request. Please try again.");
}

// Admin confirms the returned goods have been received. A paid Razorpay order
// is credited to the wallet in the same transaction as the return completion.
async function completeOrderReturn(orderId, adminNote = "") {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new Error("Invalid order ID");
    }

    if (typeof adminNote !== "string") {
        throw new Error("Admin note must be text");
    }

    const trimmedAdminNote = adminNote.trim();
    if (trimmedAdminNote.length > 1000) {
        throw new Error("Admin note cannot exceed 1000 characters");
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const existingOrder = await Order.findOne({ _id: orderId }).session(session);

            if (!existingOrder) throw new Error("Order not found");

            const refundIdempotencyKey = `refund:return:${existingOrder._id}`;
            const alreadyCredited = await WalletTransaction.findOne({
                idempotencyKey: refundIdempotencyKey
            }).session(session);

            // Recovery path for a return that was marked completed by an earlier
            // version of the flow but did not create its wallet ledger entry.
            // It never restores stock again, and the unique idempotency key
            // prevents a second credit if this request is repeated.
            if (
                existingOrder.orderStatus === "returned" &&
                existingOrder.returnRequest?.status === "completed"
            ) {
                const canRecoverRefund =
                    existingOrder.paymentMethod === "razorpay" &&
                    ["paid", "refunded"].includes(existingOrder.paymentStatus) &&
                    Number(existingOrder.refundAmount || existingOrder.totalAmount) > 0;

                if (canRecoverRefund && !alreadyCredited) {
                    const amount = Number(existingOrder.refundAmount || existingOrder.totalAmount);
                    await creditWalletInSession({
                        userId: existingOrder.user,
                        amount,
                        orderId: existingOrder._id,
                        source: "refund",
                        description: `Wallet refund for returned order #${existingOrder._id}`,
                        idempotencyKey: refundIdempotencyKey,
                        session
                    });

                    await Order.updateOne(
                        { _id: existingOrder._id, orderStatus: "returned", "returnRequest.status": "completed" },
                        {
                            $set: {
                                paymentStatus: "refunded",
                                refundStatus: "completed",
                                refundAmount: amount
                            }
                        },
                        { session, runValidators: true }
                    );
                }

                return;
            }

            if (existingOrder.orderStatus !== "delivered") {
                throw new Error("Only delivered orders can be completed as returned");
            }
            if (!existingOrder.returnRequest || existingOrder.returnRequest.status !== "approved") {
                throw new Error("Only approved return requests can be completed");
            }

            // Some existing payment flows may already have changed the payment
            // status to "refunded". A wallet ledger key is the source of truth
            // for whether this refund has been credited to AquaCart wallet.
            const needsWalletRefund =
                existingOrder.paymentMethod === "razorpay" &&
                ["paid", "refunded"].includes(existingOrder.paymentStatus) &&
                Number(existingOrder.refundAmount || existingOrder.totalAmount) > 0;

            const updatedOrder = await Order.findOneAndUpdate(
                {
                    _id: orderId,
                    orderStatus: "delivered",
                    "returnRequest.status": "approved"
                },
                {
                    $set: {
                        orderStatus: "returned",
                        "returnRequest.status": "completed",
                        "returnRequest.reviewedAt": new Date(),
                        "returnRequest.adminNote": trimmedAdminNote || existingOrder.returnRequest.adminNote || null,
                        refundStatus: needsWalletRefund ? "completed" : "not_applicable",
                        refundAmount: needsWalletRefund
                            ? Math.round(existingOrder.totalAmount * 100) / 100
                            : 0,
                        ...(needsWalletRefund ? { paymentStatus: "refunded" } : {})
                    }
                },
                {
                    new: true,
                    runValidators: true,
                    session
                }
            );

            if (!updatedOrder) {
                throw new Error("Only approved return requests can be completed");
            }

            // Returned items are restocked after the return is received.
            for (const item of updatedOrder.orderItems) {
                const result = await ProductVariant.updateOne(
                    { _id: item.variant, product: item.product },
                    { $inc: { stock: item.quantity } },
                    { session }
                );

                if (result.modifiedCount !== 1) {
                    throw new Error("Could not restore returned product stock. Return was not completed.");
                }
            }

            if (needsWalletRefund) {
                await creditWalletInSession({
                    userId: existingOrder.user,
                    amount: existingOrder.totalAmount,
                    orderId: existingOrder._id,
                    source: "refund",
                    description: `Wallet refund for returned order #${existingOrder._id}`,
                    idempotencyKey: refundIdempotencyKey,
                    session
                });
            }
        });

        return await Order.findById(orderId)
            .populate("user", "name email")
            .populate("orderItems.product", "name")
            .populate("orderItems.variant", "size sku price");
    } finally {
        await session.endSession();
    }
}

module.exports = {
    cancelCustomerOrder,
    requestOrderReturn,
    reviewOrderReturn,
    completeOrderReturn
};