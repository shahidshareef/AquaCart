const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

/**
 * Credit a customer's wallet inside the caller's MongoDB transaction.
 * The idempotency key is unique per order and refund path, preventing a
 * cancellation/return retry from crediting the same refund twice.
 */
async function creditWalletInSession({
    userId,
    amount,
    orderId,
    source = "refund",
    description,
    idempotencyKey,
    session
}) {
    const normalizedAmount = Math.round(Number(amount) * 100) / 100;

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        throw new Error("Refund amount must be greater than zero");
    }

    if (!session) {
        throw new Error("A database transaction is required for wallet credits");
    }

    const existingTransaction = await WalletTransaction.findOne({
        idempotencyKey
    }).session(session);

    if (existingTransaction) {
        return {
            credited: false,
            transaction: existingTransaction
        };
    }

    let wallet = await Wallet.findOne({ user: userId }).session(session);

    if (!wallet) {
        const createdWallets = await Wallet.create(
            [{ user: userId, balance: 0, currency: "INR" }],
            { session }
        );
        wallet = createdWallets[0];
    }

    const updatedWallet = await Wallet.findOneAndUpdate(
        {
            _id: wallet._id,
            user: userId
        },
        {
            $inc: { balance: normalizedAmount }
        },
        {
            new: true,
            runValidators: true,
            session
        }
    );

    if (!updatedWallet) {
        throw new Error("Could not update the customer wallet");
    }

    const [transaction] = await WalletTransaction.create(
        [{
            wallet: updatedWallet._id,
            user: userId,
            type: "credit",
            source,
            amount: normalizedAmount,
            balanceAfter: Math.round(updatedWallet.balance * 100) / 100,
            order: orderId,
            idempotencyKey,
            description
        }],
        { session }
    );

    return {
        credited: true,
        transaction
    };
}

module.exports = {
    creditWalletInSession
};