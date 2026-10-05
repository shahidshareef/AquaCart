const express = require("express");

const {
    getCustomers,
    getCustomerByIdController,
    updateCustomerStatusController
} = require("../controllers/customerController");

const router = express.Router();

router.get("/", getCustomers);

router.get("/:id", getCustomerByIdController);

router.patch(
    "/:id/status",
    updateCustomerStatusController
);

module.exports = router;