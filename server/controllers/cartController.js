const {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
} = require("../services/cartService");

async function getCartController(req, res) {
    try {
        const userId = req.user.userId;

        const cart = await getCart(userId);

        return res.status(200).json({
            message: "Cart fetched successfully",
            data: cart
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Failed to fetch cart"
        });
    }
}

async function addToCartController(req, res) {
    try {
        const userId = req.user.userId;

        const {
            productId,
            variantId,
            quantity
        } = req.body;

        if (!productId || !variantId || !quantity) {
            return res.status(400).json({
                message: "Product, variant and quantity are required"
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be at least 1"
            });
        }

        const result = await addToCart(
            userId,
            productId,
            variantId,
            quantity
        );

        return res.status(201).json({
            message: result.alreadyInCart
                ? "Item was already in cart. Quantity updated."
                : "Product added to cart successfully",
            data: result.cart,
            alreadyInCart: result.alreadyInCart
        });
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message
        });
    }
}

async function updateCartItemController(req, res) {
    try {
        const userId = req.user.userId;

        const {
            variantId,
            quantity
        } = req.body;

        if (!variantId || !quantity) {
            return res.status(400).json({
                message: "Variant and quantity are required"
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be at least 1"
            });
        }

        const cart = await updateCartItem(
            userId,
            variantId,
            quantity
        );

        return res.status(200).json({
            message: "Cart item updated successfully",
            data: cart
        });
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message
        });
    }
}

async function removeCartItemController(req, res) {
    try {
        const userId = req.user.userId;

        const { variantId } = req.params;

        if (!variantId) {
            return res.status(400).json({
                message: "Variant ID is required"
            });
        }

        const cart = await removeCartItem(
            userId,
            variantId
        );

        return res.status(200).json({
            message: "Cart item removed successfully",
            data: cart
        });
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message
        });
    }
}

async function clearCartController(req, res) {
    try {
        const userId = req.user.userId;

        const cart = await clearCart(userId);

        return res.status(200).json({
            message: "Cart cleared successfully",
            data: cart
        });
    } catch (error) {
        console.error(error);

        return res.status(400).json({
            message: error.message
        });
    }
}

module.exports = {
    getCartController,
    addToCartController,
    updateCartItemController,
    removeCartItemController,
    clearCartController
};