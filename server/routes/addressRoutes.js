const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    getAddressesController,
    createAddressController,
    updateAddressController,
    deleteAddressController
} = require("../controllers/addressController");

const router = express.Router();

// Get all addresses belonging to the logged-in customer
router.get(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    getAddressesController
);

// Create a new address
router.post(
    "/",
    authMiddleware,
    roleMiddleware("customer"),
    createAddressController
);

// Update an existing address
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("customer"),
    updateAddressController
);

// Delete an existing address
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("customer"),
    deleteAddressController
);

module.exports = router;