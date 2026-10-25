const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

async function getReviewEligibility(userId, productId) {
    if (!isValidObjectId(productId)) {
        throw createError("Invalid product ID.", 400);
    }

    const product = await Product.findById(productId).select("_id");

    if (!product) {
        throw createError("Product not found.", 404);
    }

    const existingReview = await Review.findOne({
        user: userId,
        product: productId
    }).select("_id status");

    if (existingReview) {
        return {
            canReview: false,
            alreadyReviewed: true,
            reviewStatus: existingReview.status,
            reason: existingReview.status === "pending"
                ? "Your review is awaiting admin approval."
                : existingReview.status === "rejected"
                    ? "You have already submitted a review for this product, and it was rejected."
                    : "You have already reviewed this product."
        };
    }

    const deliveredOrder = await Order.findOne({
        user: userId,
        orderStatus: "delivered",
        orderItems: {
            $elemMatch: {
                product: product._id
            }
        }
    }).select("_id");

    if (!deliveredOrder) {
        return {
            canReview: false,
            alreadyReviewed: false,
            reason: "You can review this product after an order containing it has been delivered."
        };
    }

    return {
        canReview: true,
        alreadyReviewed: false,
        reason: "This product was delivered to you."
    };
}

async function submitReview(userId, payload, imagePaths = []) {
    const { productId, rating, title, comment } = payload || {};

    if (!isValidObjectId(productId)) {
        throw createError("A valid product is required.", 400);
    }

    const numericRating = Number(rating);

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        throw createError("Please select a rating from 1 to 5 stars.", 400);
    }

    const normalizedTitle = String(title || "").trim();
    const normalizedComment = String(comment || "").trim();

    if (!normalizedTitle || normalizedTitle.length > 120) {
        throw createError(
            "Review title is required and must be 120 characters or fewer.",
            400
        );
    }

    if (!normalizedComment || normalizedComment.length > 2000) {
        throw createError(
            "Review comment is required and must be 2000 characters or fewer.",
            400
        );
    }

    if (imagePaths.length > 3) {
        throw createError("You can upload up to 3 photos per review.", 400);
    }

    const eligibility = await getReviewEligibility(userId, productId);

    if (!eligibility.canReview) {
        throw createError(
            eligibility.reason,
            eligibility.alreadyReviewed ? 409 : 403
        );
    }

    try {
        return await Review.create({
            user: userId,
            product: productId,
            rating: numericRating,
            title: normalizedTitle,
            comment: normalizedComment,
            images: imagePaths,
            status: "pending"
        });
    } catch (error) {
        if (error.code === 11000) {
            throw createError(
                "You have already submitted a review for this product.",
                409
            );
        }

        throw error;
    }
}

async function getPublishedReviews(rating) {
    const filter = { status: "approved" };

    if (rating !== undefined && rating !== "") {
        const numericRating = Number(rating);

        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            throw createError("Rating filter must be a number from 1 to 5.", 400);
        }

        filter.rating = numericRating;
    }

    return Review.find(filter)
        .populate("user", "name")
        .populate("product", "name images status")
        .sort({ rating: -1, createdAt: -1 });
}

async function getAdminReviews(status) {
    const filter = ["pending", "approved", "rejected"].includes(status)
        ? { status }
        : {};

    return Review.find(filter)
        .populate("user", "name email")
        .populate("product", "name images")
        .sort({ createdAt: -1 });
}

async function moderateReview(reviewId, adminId, status, moderationNote = "") {
    if (!isValidObjectId(reviewId)) {
        throw createError("Invalid review ID.", 400);
    }

    if (!["approved", "rejected"].includes(status)) {
        throw createError("Choose approve or reject.", 400);
    }

    const review = await Review.findByIdAndUpdate(
        reviewId,
        {
            status,
            moderationNote: String(moderationNote || "").trim(),
            moderatedAt: new Date(),
            moderatedBy: adminId
        },
        {
            new: true,
            runValidators: true
        }
    )
        .populate("user", "name email")
        .populate("product", "name images");

    if (!review) {
        throw createError("Review not found.", 404);
    }

    return review;
}

module.exports = {
    getReviewEligibility,
    submitReview,
    getPublishedReviews,
    getAdminReviews,
    moderateReview
};