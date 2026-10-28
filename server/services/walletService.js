
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

async function getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ user: userId });

    if (wallet) {
        return wallet;
    }

    try {
        wallet = await Wallet.create({
            user: userId,
            balance: 0,
            currency: "INR"
        });

        return wallet;
    } catch (error) {
        // Another request may have created this user's wallet
        // between our initial lookup and the insert.
        if (error.code === 11000) {
            wallet = await Wallet.findOne({ user: userId });

            if (wallet) {
                return wallet;
            }
        }

        throw error;
    }
}

async function getCustomerWallet(userId) {
    const wallet = await getOrCreateWallet(userId);

    return {
        id: wallet._id,
        balance: wallet.balance,
        currency: wallet.currency,
        updatedAt: wallet.updatedAt
    };
}

async function getWalletTransactions(
    userId,
    page = 1,
    limit = 20
) {
    const wallet = await getOrCreateWallet(userId);

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
        WalletTransaction.find({
            user: userId,
            wallet: wallet._id
        })
            .select(
                "type source amount balanceAfter order description createdAt"
            )
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit)
            .populate("order", "_id createdAt orderStatus"),

        WalletTransaction.countDocuments({
            user: userId,
            wallet: wallet._id
        })
    ]);

    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

module.exports = {
    getOrCreateWallet,
    getCustomerWallet,
    getWalletTransactions
};
