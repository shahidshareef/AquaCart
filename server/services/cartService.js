const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

async function getCart(userId) {
    const cart = await Cart.findOne({
        user: userId
    })
        .populate("items.product")
        .populate("items.variant");

    return cart;
}

async function addToCart(userId, productId, variantId, quantity) {
    const product = await Product.findOne({
        _id: productId,
        status: "active"
    });

    if (!product) {
        throw new Error("Product not found");
    }

    const variant = await ProductVariant.findOne({
        _id: variantId,
        product: productId,
        status: "active"
    });

    if (!variant) {
        throw new Error("Product variant not found");
    }

    if (quantity > variant.stock) {
        throw new Error("Requested quantity is not available");
    }

    let cart = await Cart.findOne({
        user: userId
    });

    if (!cart) {
        cart = new Cart({
            user: userId,
            items: [
                {
                    product: productId,
                    variant: variantId,
                    quantity: quantity
                }
            ]
        });

        await cart.save();

        return {
            cart: await Cart.findOne({
                user: userId
            })
                .populate("items.product")
                .populate("items.variant"),
            alreadyInCart: false
        };
    }

    const existingItem = cart.items.find(
        (item) =>
            item.variant.toString() === variantId.toString()
    );

    if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > variant.stock) {
            throw new Error("Requested quantity is not available");
        }

        existingItem.quantity = newQuantity;

        await cart.save();

        return {
            cart: await Cart.findOne({
                user: userId
            })
                .populate("items.product")
                .populate("items.variant"),
            alreadyInCart: true
        };
    }

    cart.items.push({
        product: productId,
        variant: variantId,
        quantity: quantity
    });

    await cart.save();

    return {
        cart: await Cart.findOne({
            user: userId
        })
            .populate("items.product")
            .populate("items.variant"),
        alreadyInCart: false
    };
}

async function updateCartItem(userId, variantId, quantity) {
    const cart = await Cart.findOne({
        user: userId
    });

    if (!cart) {
        throw new Error("Cart not found");
    }

    const item = cart.items.find(
        (item) =>
            item.variant.toString() === variantId.toString()
    );

    if (!item) {
        throw new Error("Cart item not found");
    }

    const variant = await ProductVariant.findById(
        variantId
    );

    if (!variant || variant.status !== "active") {
        throw new Error("Product variant not found");
    }

    if (quantity > variant.stock) {
        throw new Error("Requested quantity is not available");
    }

    item.quantity = quantity;

    await cart.save();

    return Cart.findOne({
        user: userId
    })
        .populate("items.product")
        .populate("items.variant");
}

async function removeCartItem(userId, variantId) {
    const cart = await Cart.findOne({
        user: userId
    });

    if (!cart) {
        throw new Error("Cart not found");
    }

    const itemIndex = cart.items.findIndex(
        (item) =>
            item.variant.toString() === variantId.toString()
    );

    if (itemIndex === -1) {
        throw new Error("Cart item not found");
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return Cart.findOne({
        user: userId
    })
        .populate("items.product")
        .populate("items.variant");
}

async function clearCart(userId) {
    const cart = await Cart.findOne({
        user: userId
    });

    if (!cart) {
        throw new Error("Cart not found");
    }

    cart.items = [];

    await cart.save();

    return Cart.findOne({
        user: userId
    })
        .populate("items.product")
        .populate("items.variant");
}

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
};