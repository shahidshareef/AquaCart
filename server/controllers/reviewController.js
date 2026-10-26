
const cloudinary = require("cloudinary").v2;

const {
    getReviewEligibility,
    submitReview,
    getPublishedReviews,
    getAdminReviews,
    moderateReview
} = require("../services/reviewService");

function sendError(res, error) {
    const statusCode = error.statusCode || 500;

    console.error("[AquaCart Reviews API Error]", {
        message: error.message,
        statusCode,
        stack: error.stack
    });

    return res.status(statusCode).json({
        message: statusCode === 500
            ? "Review request failed."
            : error.message
    });
}

async function removeUploadedImages(files) {
    for (const file of files || []) {
        // CloudinaryStorage provides the Cloudinary public ID as file.filename.
        if (!file.filename) {
            continue;
        }

        try {
            await cloudinary.uploader.destroy(file.filename, {
                resource_type: "image"
            });
        } catch (error) {
            console.error(
                "[AquaCart] Failed to remove rejected review image:",
                error.message
            );
        }
    }
}

async function getReviewEligibilityController(req, res) {
    try {
        const data = await getReviewEligibility(
            req.user.userId,
            req.params.productId
        );

        return res.status(200).json({
            message: "Review eligibility checked successfully",
            data
        });
    } catch (error) {
        return sendError(res, error);
    }
}

async function submitReviewController(req, res) {
    try {
        // Cloudinary returns the hosted HTTPS URL in file.path.
        const imagePaths = (req.files || []).map((file) => file.path);

        const review = await submitReview(
            req.user.userId,
            req.body || {},
            imagePaths
        );

        return res.status(201).json({
            message: "Review submitted and is awaiting admin approval.",
            data: review
        });
    } catch (error) {
        // Avoid leaving uploaded images behind when review submission fails.
        await removeUploadedImages(req.files);
        return sendError(res, error);
    }
}

async function getPublishedReviewsController(req, res) {
    try {
        const reviews = await getPublishedReviews(req.query.rating);

        return res.status(200).json({
            message: "Customer reviews fetched successfully.",
            data: reviews
        });
    } catch (error) {
        return sendError(res, error);
    }
}

async function getAdminReviewsController(req, res) {
    try {
        const reviews = await getAdminReviews(req.query.status);

        return res.status(200).json({
            message: "Reviews fetched successfully",
            data: reviews
        });
    } catch (error) {
        return sendError(res, error);
    }
}

async function moderateReviewController(req, res) {
    try {
        const { status, moderationNote } = req.body || {};

        const review = await moderateReview(
            req.params.id,
            req.user.userId,
            status,
            moderationNote
        );

        return res.status(200).json({
            message: `Review ${status} successfully`,
            data: review
        });
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    getReviewEligibilityController,
    submitReviewController,
    getPublishedReviewsController,
    getAdminReviewsController,
    moderateReviewController
};
