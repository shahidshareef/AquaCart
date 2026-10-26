
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Product = require("../models/Product");
const Review = require("../models/Review");

const REPORT_DIR = path.join(__dirname, "..", "migration-reports");

const PREVIEW_FILE = path.join(
    REPORT_DIR,
    "legacy-image-db-update-preview.json"
);

const RESULT_FILE = path.join(
    REPORT_DIR,
    "legacy-image-db-update-result.json"
);

function validatePreview(report) {
    if (report.mode !== "PREVIEW ONLY - NO DATABASE CHANGES") {
        throw new Error("Unexpected preview report mode.");
    }

    if (
        report.totalProposedChanges !== 11 ||
        report.proposedProductImageChanges !== 10 ||
        report.proposedReviewImageChanges !== 1 ||
        report.unmappedLegacyReferenceCount !== 0 ||
        !Array.isArray(report.changes) ||
        report.changes.length !== 11
    ) {
        throw new Error(
            "Preview totals do not match the expected migration. Nothing was changed."
        );
    }

    const seen = new Set();

    for (const change of report.changes) {
        if (
            !["products", "reviews"].includes(change.collection) ||
            !mongoose.isValidObjectId(change.documentId) ||
            !Number.isInteger(change.imageIndex) ||
            change.imageIndex < 0 ||
            typeof change.oldUrl !== "string" ||
            typeof change.newUrl !== "string" ||
            !change.oldUrl.includes("/uploads/") ||
            !change.newUrl.startsWith("https://res.cloudinary.com/") ||
            !change.filename
        ) {
            throw new Error(
                "Preview contains an invalid change. Nothing was changed."
            );
        }

        const key =
            `${change.collection}:${change.documentId}:${change.imageIndex}`;

        if (seen.has(key)) {
            throw new Error(
                `Duplicate image position in preview: ${key}`
            );
        }

        seen.add(key);
    }
}

async function main() {
    if (process.env.APPLY_LEGACY_IMAGE_MIGRATION !== "YES") {
        throw new Error(
            'Safety check: set $env:APPLY_LEGACY_IMAGE_MIGRATION = "YES" in PowerShell to authorize this update.'
        );
    }

    if (!process.env.MONGO_URL) {
        throw new Error("MONGO_URL is missing from server/.env.");
    }

    if (!fs.existsSync(PREVIEW_FILE)) {
        throw new Error("The database preview report was not found.");
    }

    const preview = JSON.parse(
        fs.readFileSync(PREVIEW_FILE, "utf8")
    );

    validatePreview(preview);

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected successfully.");

    const session = await mongoose.startSession();

    let updatedCount = 0;

    try {
        await session.withTransaction(async () => {
            updatedCount = 0;

            for (const change of preview.changes) {
                const Model =
                    change.collection === "products"
                        ? Product
                        : Review;

                const fieldPath = `images.${change.imageIndex}`;

                // Match the exact old URL at the exact array position.
                // If the record changed after the preview, abort the transaction.
                const result = await Model.updateOne(
                    {
                        _id: new mongoose.Types.ObjectId(change.documentId),
                        [fieldPath]: change.oldUrl
                    },
                    {
                        $set: {
                            [fieldPath]: change.newUrl
                        }
                    },
                    { session }
                );

                if (result.matchedCount !== 1 || result.modifiedCount !== 1) {
                    throw new Error(
                        `Conflict at ${change.collection} document ` +
                        `${change.documentId}, image index ${change.imageIndex}. ` +
                        "The transaction will be aborted; check the record before retrying."
                    );
                }

                updatedCount++;
                console.log(
                    `Prepared ${updatedCount}/11: ` +
                    `${change.collection} / ${change.filename}`
                );
            }
        }, {
            readConcern: { level: "snapshot" },
            writeConcern: { w: "majority" },
            readPreference: "primary"
        });
    } finally {
        await session.endSession();
    }

    // Verify the saved values after the transaction commits.
    const verificationErrors = [];

    for (const change of preview.changes) {
        const Model =
            change.collection === "products"
                ? Product
                : Review;

        const document = await Model.findById(change.documentId)
            .select({ images: 1 })
            .lean();

        if (
            !document ||
            !Array.isArray(document.images) ||
            document.images[change.imageIndex] !== change.newUrl
        ) {
            verificationErrors.push({
                collection: change.collection,
                documentId: change.documentId,
                imageIndex: change.imageIndex
            });
        }
    }

    const resultReport = {
        completedAt: new Date().toISOString(),
        mode: "DATABASE MIGRATION APPLIED",
        proposedChanges: preview.totalProposedChanges,
        updatesCommitted: updatedCount,
        verificationPassed: verificationErrors.length === 0,
        verificationErrors
    };

    fs.mkdirSync(REPORT_DIR, { recursive: true });

    fs.writeFileSync(
        RESULT_FILE,
        JSON.stringify(resultReport, null, 2),
        "utf8"
    );

    console.log("\n========== MIGRATION RESULT ==========");
    console.log(`Updates committed: ${updatedCount}`);
    console.log(
        `Post-update verification: ${
            verificationErrors.length === 0 ? "PASSED" : "FAILED"
        }`
    );
    console.log(`Result report: ${RESULT_FILE}`);

    if (verificationErrors.length > 0) {
        throw new Error(
            "Some updated URLs failed verification. Review the result report."
        );
    }

    console.log(
        "Success! The 11 legacy image URLs now point to Cloudinary."
    );
}

main()
    .catch((error) => {
        console.error("\nDatabase migration failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
