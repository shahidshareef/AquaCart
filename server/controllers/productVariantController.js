const {
    getProductVariants,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant
} = require("../services/productVariantService");

async function getVariants(req, res) {
    try {
        const { productId } = req.params;

        const variants = await getProductVariants(productId);

        res.status(200).json({
            message: "Product variants fetched successfully",
            data: variants
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch product variants"
        });
    }
}

async function createVariantController(req, res) {
    try {
        const { productId } = req.params;

        const {
            size,
            sku,
            price,
            stock,
            status
        } = req.body;

        if (!size) {
            return res.status(400).json({
                message: "Variant size is required"
            });
        }

        if (!sku) {
            return res.status(400).json({
                message: "Variant SKU is required"
            });
        }

        if (price === undefined) {
            return res.status(400).json({
                message: "Variant price is required"
            });
        }

        const variant = await createProductVariant({
            product: productId,
            size,
            sku,
            price,
            stock,
            status
        });

        res.status(201).json({
            message: "Product variant created successfully",
            data: variant
        });
    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "SKU already exists"
            });
        }

        res.status(500).json({
            message: "Failed to create product variant"
        });
    }
}

async function updateVariantController(req, res) {
    try {
        const { variantId } = req.params;

        const {
            size,
            sku,
            price,
            stock,
            status
        } = req.body;

        if (!size) {
            return res.status(400).json({
                message: "Variant size is required"
            });
        }

        if (!sku) {
            return res.status(400).json({
                message: "Variant SKU is required"
            });
        }

        if (price === undefined) {
            return res.status(400).json({
                message: "Variant price is required"
            });
        }

        const variant = await updateProductVariant(
            variantId,
            {
                size,
                sku,
                price,
                stock,
                status
            }
        );

        if (!variant) {
            return res.status(404).json({
                message: "Product variant not found"
            });
        }

        res.status(200).json({
            message: "Product variant updated successfully",
            data: variant
        });
    } catch (error) {
        console.log(error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "SKU already exists"
            });
        }

        res.status(500).json({
            message: "Failed to update product variant"
        });
    }
}

async function deleteVariantController(req, res) {
    try {
        const { variantId } = req.params;

        const variant = await deleteProductVariant(variantId);

        if (!variant) {
            return res.status(404).json({
                message: "Product variant not found"
            });
        }

        res.status(200).json({
            message: "Product variant deleted successfully",
            data: variant
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to delete product variant"
        });
    }
}

module.exports = {
    getVariants,
    createVariantController,
    updateVariantController,
    deleteVariantController
};