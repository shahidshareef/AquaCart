const express = require("express");

const {
    getDashboard
} = require("../controllers/adminDashboardController");

const router = express.Router();

router.get("/dashboard", getDashboard);

module.exports = router;