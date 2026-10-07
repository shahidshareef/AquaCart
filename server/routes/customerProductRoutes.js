const express = require("express");

const {
    getFeaturedProductsController,
    getCustomerProductsController,
    getCustomerProductByIdController,
    getRelatedProductsController,
    getProductReviewsController
} = require("../controllers/customerProductController");

const router = express.Router();

router.get("/featured", getFeaturedProductsController);
router.get("/", getCustomerProductsController);
router.get("/:id/related", getRelatedProductsController);
router.get("/:id/reviews", getProductReviewsController);
router.get("/:id", getCustomerProductByIdController);

module.exports = router;