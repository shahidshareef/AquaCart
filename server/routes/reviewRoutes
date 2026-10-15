const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const {
    getReviewEligibilityController,
    submitReviewController,
    getPublishedReviewsController,
    getAdminReviewsController,
    moderateReviewController
} = require("../controllers/reviewController");

const router = express.Router();

// Public reviews include only admin-approved customer reviews.
router.get("/", getPublishedReviewsController);

// Customer eligibility is checked against delivered orders for this exact product.
router.get("/eligibility/:productId", authMiddleware, roleMiddleware("customer"), getReviewEligibilityController);
router.post("/", authMiddleware, roleMiddleware("customer"), (req, res, next) => {
    upload.array("images", 3)(req, res, (error) => {
        if (error) {
            return res.status(400).json({ message: error.message || "Unable to upload review photos." });
        }
        next();
    });
}, submitReviewController);

// Admin-only moderation endpoints.
router.get("/admin", authMiddleware, roleMiddleware("admin"), getAdminReviewsController);
router.patch("/admin/:id/moderation", authMiddleware, roleMiddleware("admin"), moderateReviewController);

module.exports = router;
