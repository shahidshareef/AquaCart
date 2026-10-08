const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getCartController,
    addToCartController,
    updateCartItemController,
    removeCartItemController,
    clearCartController
} = require("../controllers/cartController");

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    getCartController
);

router.post(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    addToCartController
);

router.delete(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    clearCartController
);

router.put(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    updateCartItemController
);

router.delete(
    "/:variantId",
    authMiddleware,
    roleMiddleware("customer"),
    removeCartItemController
);

module.exports = router;