const express = require("express");

const {
    getVariants,
    createVariantController,
    updateVariantController,
    deleteVariantController
} = require("../controllers/productVariantController");

const router = express.Router();

router.get("/:productId/variants", getVariants);

router.post("/:productId/variants", createVariantController);

router.put("/variants/:variantId", updateVariantController);

router.delete("/variants/:variantId", deleteVariantController);

module.exports = router;