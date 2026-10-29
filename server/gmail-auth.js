
const { authenticate } = require("@google-cloud/local-auth");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
const TOKEN_PATH = path.join(__dirname, "token.json");

async function main() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error("credentials.json was not found in the server folder.");
    }

    const auth = await authenticate({
        keyfilePath: CREDENTIALS_PATH,
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
    });

    const token = auth.credentials;

    if (!token.refresh_token) {
        throw new Error(
            "Google did not return a refresh token. Check OAuth consent settings."
        );
    }

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), {
        mode: 0o600,
    });

    console.log("Gmail authorization successful.");
    console.log("Gmail sending permission granted.");
    console.log("Refresh token saved to server/token.json.");
    console.log("Keep credentials.json and token.json private.");
}

main().catch((error) => {
    console.error("Gmail authorization failed:", error.message);
    process.exitCode = 1;
});