
const {
    getCustomerWallet,
    getWalletTransactions
} = require("../services/walletService");

async function getWalletController(req, res) {
    try {
        const wallet = await getCustomerWallet(req.user.userId);

        return res.status(200).json({
            message: "Wallet fetched successfully",
            data: wallet
        });
    } catch (error) {
        console.error("Get wallet error:", error);

        return res.status(500).json({
            message: "Unable to fetch your wallet."
        });
    }
}

async function getWalletTransactionsController(req, res) {
    try {
        const rawPage = req.query.page ?? "1";
        const rawLimit = req.query.limit ?? "20";

        const page = Number(rawPage);
        const limit = Number(rawLimit);

        if (
            !/^[1-9]\d*$/.test(String(rawPage)) ||
            !/^[1-9]\d*$/.test(String(rawLimit)) ||
            !Number.isSafeInteger(page) ||
            !Number.isSafeInteger(limit) ||
            limit > 100
        ) {
            return res.status(400).json({
                message:
                    "Page must be a positive integer and limit must be between 1 and 100."
            });
        }

        const result = await getWalletTransactions(
            req.user.userId,
            page,
            limit
        );

        return res.status(200).json({
            message: "Wallet transactions fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Get wallet transactions error:", error);

        return res.status(500).json({
            message: "Unable to fetch wallet transactions."
        });
    }
}

module.exports = {
    getWalletController,
    getWalletTransactionsController
};
