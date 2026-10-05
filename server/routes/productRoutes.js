const express = require("express");

const {
    getProducts,
    getProductByIdController,
    createProductController,
    updateProductController,
    deleteProductController
} = require("../controllers/productController");

const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getProducts);

router.get("/:id", getProductByIdController);

router.post(
    "/",
    upload.single("image"),
    createProductController
);

router.put("/:id", upload.single("image"),updateProductController);

router.delete("/:id", deleteProductController);

module.exports = router;