const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function createRazorpayOrder(amount, receipt) {
    return razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt
    });
}

function verifyRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
) {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpaySignature, "hex");

    return (
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    );
}


async function fetchRazorpayPayment(paymentId) {
    return razorpay.payments.fetch(paymentId);
}

module.exports = {
    createRazorpayOrder,
    verifyRazorpaySignature,
    fetchRazorpayPayment
};