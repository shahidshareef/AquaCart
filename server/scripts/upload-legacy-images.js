
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const REPORT_DIR = path.join(__dirname, "..", "migration-reports");
const DRY_RUN_REPORT = path.join(
    REPORT_DIR,
    "legacy-image-dry-run.json"
);
const UPLOAD_REPORT = path.join(
    REPORT_DIR,
    "legacy-image-cloudinary-mapping.json"
);

const CLOUDINARY_FOLDER = "aquacart/legacy-uploads";

async function main() {
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
        throw new Error(
            "Cloudinary environment variables are missing from server/.env."
        );
    }

    if (!fs.existsSync(DRY_RUN_REPORT)) {
        throw new Error(
            "Dry-run report not found. Run the migration dry-run first."
        );
    }

    const dryRun = JSON.parse(
        fs.readFileSync(DRY_RUN_REPORT, "utf8")
    );

    if (
        dryRun.referencesMissingLocalFiles !== 0 ||
        dryRun.referencesWithLocalFiles !== dryRun.legacyReferenceCount
    ) {
        throw new Error(
            "The dry-run report contains missing or unmatched local images."
        );
    }

    const uploadsDir = path.join(__dirname, "..", "uploads");

    const uniqueFiles = [
        ...new Set(dryRun.references.map((item) => item.filename))
    ];

    if (uniqueFiles.length !== 11) {
        throw new Error(
            `Expected 11 unique image files, found ${uniqueFiles.length}.`
        );
    }

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    fs.mkdirSync(REPORT_DIR, { recursive: true });

    // Resume from a previous report so successful uploads aren't repeated.
    let existingUploads = {};

    if (fs.existsSync(UPLOAD_REPORT)) {
        const previousReport = JSON.parse(
            fs.readFileSync(UPLOAD_REPORT, "utf8")
        );

        existingUploads = previousReport.uploads || {};
    }

    const uploads = { ...existingUploads };

    console.log(`Images to migrate: ${uniqueFiles.length}`);
    console.log(`Cloudinary folder: ${CLOUDINARY_FOLDER}`);
    console.log("MongoDB will not be modified.\n");

    for (const filename of uniqueFiles) {
        const filePath = path.join(uploadsDir, filename);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Local image is missing: ${filename}`);
        }

        const previous = uploads[filename];

        // Reuse only an entry that has already been verified in Cloudinary.
        if (previous && previous.verified === true && previous.secureUrl) {
            console.log(`Already verified; skipping: ${filename}`);
            continue;
        }

        const publicId = path.parse(filename).name;

        console.log(`Uploading: ${filename}`);

        const result = await cloudinary.uploader.upload(filePath, {
            folder: CLOUDINARY_FOLDER,
            public_id: publicId,
            resource_type: "image",
            overwrite: false,
            unique_filename: false,
            use_filename: false
        });

        if (
            !result.secure_url ||
            !result.public_id ||
            result.resource_type !== "image"
        ) {
            throw new Error(
                `Cloudinary did not return a valid image result for ${filename}.`
            );
        }

        // Verify the returned Cloudinary asset can be found.
        const verifiedAsset = await cloudinary.api.resource(
            result.public_id,
            { resource_type: "image" }
        );

        if (!verifiedAsset.secure_url) {
            throw new Error(
                `Cloudinary verification failed for ${filename}.`
            );
        }

        uploads[filename] = {
            publicId: result.public_id,
            secureUrl: verifiedAsset.secure_url,
            format: verifiedAsset.format,
            bytes: verifiedAsset.bytes,
            verified: true
        };

        // Save after each successful upload so we can safely resume.
        fs.writeFileSync(
            UPLOAD_REPORT,
            JSON.stringify(
                {
                    generatedAt: new Date().toISOString(),
                    mode: "CLOUDINARY UPLOAD ONLY - NO DATABASE CHANGES",
                    cloudinaryFolder: CLOUDINARY_FOLDER,
                    expectedFileCount: uniqueFiles.length,
                    uploads
                },
                null,
                2
            ),
            "utf8"
        );

        console.log(`Verified: ${filename}`);
    }

    const uploadedCount = uniqueFiles.filter(
        (filename) =>
            uploads[filename] &&
            uploads[filename].verified === true &&
            uploads[filename].secureUrl
    ).length;

    if (uploadedCount !== uniqueFiles.length) {
        throw new Error(
            `Only ${uploadedCount} of ${uniqueFiles.length} images are verified.`
        );
    }

    console.log("\n========== UPLOAD SUMMARY ==========");
    console.log(`Expected images: ${uniqueFiles.length}`);
    console.log(`Verified images: ${uploadedCount}`);
    console.log(`Mapping report: ${UPLOAD_REPORT}`);
    console.log("\nMongoDB was not modified.");
}

main().catch((error) => {
    console.error("\nImage migration upload failed:", error.message);
    process.exitCode = 1;
});
