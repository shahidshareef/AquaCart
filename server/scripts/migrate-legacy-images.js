
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Product = require("../models/Product");
const Review = require("../models/Review");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const REPORT_DIR = path.join(__dirname, "..", "migration-reports");
const REPORT_FILE = path.join(
    REPORT_DIR,
    "legacy-image-dry-run.json"
);

// Match only legacy URLs containing an /uploads/ path.
// Examples:
// /uploads/example.jpg
// uploads/example.jpg
// https://aquacart.onrender.com/uploads/example.jpg
function getLegacyFilename(value) {
    if (typeof value !== "string") {
        return null;
    }

    const match = value.match(
        /(?:^|\/)uploads\/([^/?#]+)(?:[?#].*)?$/
    );

    return match ? decodeURIComponent(match[1]) : null;
}

async function main() {
    if (!process.env.MONGO_URL) {
        throw new Error(
            "MONGO_URL is missing from the server .env file."
        );
    }

    if (!fs.existsSync(UPLOADS_DIR)) {
        throw new Error(
            `Uploads directory not found: ${UPLOADS_DIR}`
        );
    }

    const localFiles = fs.readdirSync(UPLOADS_DIR, {
        withFileTypes: true
    })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);

    const localFileSet = new Set(localFiles);

    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB connected successfully.");
    console.log(`Local image files found: ${localFiles.length}`);

    const [products, reviews] = await Promise.all([
        Product.find({}, { images: 1 }).lean(),
        Review.find({}, { images: 1 }).lean()
    ]);

    const references = [];
    const missingLocalFiles = [];
    const matchingLocalFiles = new Set();

    function inspectDocuments(documents, collectionName) {
        for (const document of documents) {
            const images = Array.isArray(document.images)
                ? document.images
                : [];

            images.forEach((imageUrl, index) => {
                const filename = getLegacyFilename(imageUrl);

                // Ignore Cloudinary URLs and other non-legacy URLs.
                if (!filename) {
                    return;
                }

                const localFileExists = localFileSet.has(filename);

                const reference = {
                    collection: collectionName,
                    documentId: String(document._id),
                    imageIndex: index,
                    legacyUrl: imageUrl,
                    filename,
                    localFileExists
                };

                references.push(reference);

                if (localFileExists) {
                    matchingLocalFiles.add(filename);
                } else {
                    missingLocalFiles.push(reference);
                }
            });
        }
    }

    inspectDocuments(products, "products");
    inspectDocuments(reviews, "reviews");

    const report = {
        generatedAt: new Date().toISOString(),
        mode: "DRY RUN - NO DATABASE CHANGES",
        localUploadsDirectory: UPLOADS_DIR,
        localImageFileCount: localFiles.length,
        productDocumentCount: products.length,
        reviewDocumentCount: reviews.length,
        legacyReferenceCount: references.length,
        referencesWithLocalFiles: references.filter(
            (item) => item.localFileExists
        ).length,
        referencesMissingLocalFiles: missingLocalFiles.length,
        distinctLocalFilesReferenced: matchingLocalFiles.size,
        localFilesNotReferenced: localFiles.filter(
            (filename) => !matchingLocalFiles.has(filename)
        ),
        references,
        missingLocalFiles
    };

    fs.mkdirSync(REPORT_DIR, { recursive: true });

    fs.writeFileSync(
        REPORT_FILE,
        JSON.stringify(report, null, 2),
        "utf8"
    );

    console.log("\n========== DRY-RUN SUMMARY ==========");
    console.log(`Products inspected: ${products.length}`);
    console.log(`Reviews inspected: ${reviews.length}`);
    console.log(`Legacy image references: ${references.length}`);
    console.log(
        `References with local files: ${report.referencesWithLocalFiles}`
    );
    console.log(
        `References missing local files: ${report.referencesMissingLocalFiles}`
    );
    console.log(
        `Distinct local files referenced: ${matchingLocalFiles.size}`
    );
    console.log(`Report saved to: ${REPORT_FILE}`);
    console.log("\nNo images were uploaded.");
    console.log("No database records were modified.");
}

main()
    .catch((error) => {
        console.error("\nDry-run failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
