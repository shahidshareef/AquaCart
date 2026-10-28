const express = require("express");

const {
    getWalletController,
    getWalletTransactionsController
} = require("../controllers/walletController");

const router = express.Router();

router.get("/", getWalletController);

router.get("/transactions", getWalletTransactionsController);

module.exports = router;
