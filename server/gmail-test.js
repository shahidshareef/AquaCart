
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

function encodeMessage(message) {
    return Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function main() {
    const credentials = JSON.parse(
        fs.readFileSync(CREDENTIALS_PATH, "utf8")
    ).installed;

    const token = JSON.parse(
        fs.readFileSync(TOKEN_PATH, "utf8")
    );

    const auth = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uris[0]
    );

    auth.setCredentials(token);

    const gmail = google.gmail({ version: "v1", auth });

    const raw = encodeMessage(
        [
            "To: rsoundzz578@gmail.com",
            "Subject: AquaCart Gmail API Test",
            "Content-Type: text/plain; charset=utf-8",
            "",
            "Success! AquaCart can send email through Gmail API.",
        ].join("\r\n")
    );

    const result = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
    });

    console.log("Test email sent successfully.");
    console.log("Message ID:", result.data.id);
}

main().catch((error) => {
    console.error(
        "Test email failed:",
        error.response?.data?.error?.message || error.message
    );
    process.exitCode = 1;
});