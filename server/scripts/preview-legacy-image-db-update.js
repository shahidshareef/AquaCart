
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Product = require("../models/Product");
const Review = require("../models/Review");

const REPORT_DIR = path.join(__dirname, "..", "migration-reports");

const MAPPING_FILE = path.join(
    REPORT_DIR,
    "legacy-image-cloudinary-mapping.json"
);

const PREVIEW_FILE = path.join(
    REPORT_DIR,
    "legacy-image-db-update-preview.json"
);

function getLegacyFilename(value) {
    if (typeof value !== "string") {
        return null;
    }

    const match = value.match(
        /(?:^|\/)uploads\/([^/?#]+)(?:[?#].*)?$/
    );

    if (!match) {
        return null;
    }

    try {
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
}

async function main() {
    if (!process.env.MONGO_URL) {
        throw new Error("MONGO_URL is missing from server/.env.");
    }

    if (!fs.existsSync(MAPPING_FILE)) {
        throw new Error("Cloudinary mapping report was not found.");
    }

    const mappingReport = JSON.parse(
        fs.readFileSync(MAPPING_FILE, "utf8")
    );

    if (
        mappingReport.expectedFileCount !== 11 ||
        !mappingReport.uploads
    ) {
        throw new Error("Cloudinary mapping report is incomplete.");
    }

    const mapping = mappingReport.uploads;

    for (const [filename, asset] of Object.entries(mapping)) {
        if (
            asset.verified !== true ||
            !asset.secureUrl ||
            !asset.publicId ||
            !asset.secureUrl.startsWith("https://res.cloudinary.com/")
        ) {
            throw new Error(
                `Invalid or unverified Cloudinary mapping: ${filename}`
            );
        }
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected successfully.");

    const [products, reviews] = await Promise.all([
        Product.find({}, { images: 1 }).lean(),
        Review.find({}, { images: 1 }).lean()
    ]);

    const changes = [];
    const unmappedLegacyReferences = [];

    function inspectDocuments(documents, collectionName) {
        for (const document of documents) {
            const images = Array.isArray(document.images)
                ? document.images
                : [];

            images.forEach((oldUrl, imageIndex) => {
                const filename = getLegacyFilename(oldUrl);

                // Leave Cloudinary URLs and other URLs unchanged.
                if (!filename) {
                    return;
                }

                const asset = mapping[filename];

                if (!asset || asset.verified !== true) {
                    unmappedLegacyReferences.push({
                        collection: collectionName,
                        documentId: String(document._id),
                        imageIndex,
                        oldUrl,
                        filename
                    });

                    return;
                }

                changes.push({
                    collection: collectionName,
                    documentId: String(document._id),
                    imageIndex,
                    oldUrl,
                    newUrl: asset.secureUrl,
                    filename
                });
            });
        }
    }

    inspectDocuments(products, "products");
    inspectDocuments(reviews, "reviews");

    const productChanges = changes.filter(
        (item) => item.collection === "products"
    );

    const reviewChanges = changes.filter(
        (item) => item.collection === "reviews"
    );

    const report = {
        generatedAt: new Date().toISOString(),
        mode: "PREVIEW ONLY - NO DATABASE CHANGES",
        productsInspected: products.length,
        reviewsInspected: reviews.length,
        totalProposedChanges: changes.length,
        proposedProductImageChanges: productChanges.length,
        proposedReviewImageChanges: reviewChanges.length,
        unmappedLegacyReferenceCount: unmappedLegacyReferences.length,
        changes,
        unmappedLegacyReferences
    };

    fs.mkdirSync(REPORT_DIR, { recursive: true });

    fs.writeFileSync(
        PREVIEW_FILE,
        JSON.stringify(report, null, 2),
        "utf8"
    );

    console.log("\n========== DATABASE UPDATE PREVIEW ==========");
    console.log(`Products inspected: ${products.length}`);
    console.log(`Reviews inspected: ${reviews.length}`);
    console.log(`Proposed image URL changes: ${changes.length}`);
    console.log(`Product image changes: ${productChanges.length}`);
    console.log(`Review image changes: ${reviewChanges.length}`);
    console.log(
        `Unmapped legacy references: ${unmappedLegacyReferences.length}`
    );
    console.log(`Preview saved to: ${PREVIEW_FILE}`);
    console.log("\nNo database records were modified.");

    if (unmappedLegacyReferences.length > 0) {
        console.log(
            "WARNING: Some legacy URLs lack verified mappings. Do not apply the migration."
        );
    }
}

main()
    .catch((error) => {
        console.error("\nPreview failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
