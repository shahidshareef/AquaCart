const express = require("express");

const {
    getFeaturedProductsController,
    getCustomerProductsController
} = require("../controllers/customerProductController");

const router = express.Router();

router.get("/featured", getFeaturedProductsController);
router.get("/", getCustomerProductsController);

module.exports = router;