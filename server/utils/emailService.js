
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const CLIENT_URL = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.replace(/\/+$/, "")
    : "";

const GMAIL_FROM = process.env.GMAIL_FROM;

const CREDENTIALS_PATH = path.join(__dirname, "..", "credentials.json");
const TOKEN_PATH = path.join(__dirname, "..", "token.json");

let gmailClientPromise;

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const readJsonConfig = (envName, filePath, description) => {
    let raw;

    if (process.env[envName]) {
        try {
            raw = Buffer.from(process.env[envName], "base64").toString("utf8");
        } catch {
            throw new Error(`${envName} is not valid Base64.`);
        }
    } else if (fs.existsSync(filePath)) {
        raw = fs.readFileSync(filePath, "utf8");
    } else {
        throw new Error(
            `${description} is missing. Configure ${envName} in the environment or provide ${path.basename(filePath)} locally.`
        );
    }

    try {
        return JSON.parse(raw);
    } catch {
        throw new Error(
            `${description} could not be parsed. Check the ${envName} value or local JSON file.`
        );
    }
};

const getGmailClient = async () => {
    if (!gmailClientPromise) {
        gmailClientPromise = (async () => {
            if (!GMAIL_FROM) {
                throw new Error(
                    "GMAIL_FROM is missing from the server environment."
                );
            }

            const credentialData = readJsonConfig(
                "GMAIL_CREDENTIALS_BASE64",
                CREDENTIALS_PATH,
                "Google OAuth credentials"
            );

            const credentials = credentialData.installed || credentialData.web;

            if (
                !credentials?.client_id ||
                !credentials?.client_secret ||
                !credentials?.redirect_uris?.[0]
            ) {
                throw new Error(
                    "Invalid Google OAuth credentials configuration."
                );
            }

            const token = readJsonConfig(
                "GMAIL_TOKEN_BASE64",
                TOKEN_PATH,
                "Google OAuth token"
            );

            if (!token.refresh_token) {
                throw new Error(
                    "Google OAuth token is missing its refresh token. Re-authorize Gmail locally."
                );
            }

            const auth = new google.auth.OAuth2(
                credentials.client_id,
                credentials.client_secret,
                credentials.redirect_uris[0]
            );

            auth.setCredentials(token);

            // Refresh/check authorization without reading Gmail profile data.
            await auth.getAccessToken();

            return google.gmail({
                version: "v1",
                auth,
            });
        })().catch((error) => {
            gmailClientPromise = undefined;
            throw error;
        });
    }

    return gmailClientPromise;
};

const encodeMimeHeader = (value = "") =>
    `=?UTF-8?B?${Buffer.from(String(value), "utf8").toString("base64")}?=`;

const createRawMessage = ({ to, subject, text, html }) => {
    const safeTo = String(to).replace(/[\r\n]/g, "");
    const safeFrom = String(GMAIL_FROM).replace(/[\r\n]/g, "");
    const safeSubject = encodeMimeHeader(subject);

    const boundary = `aquacart_${Date.now()}_${Math.random()
        .toString(16)
        .slice(2)}`;

    const textBase64 = Buffer.from(text || "", "utf8").toString("base64");
    const htmlBase64 = Buffer.from(html || "", "utf8").toString("base64");

    const mimeMessage = [
        `From: ${safeFrom}`,
        `To: ${safeTo}`,
        `Subject: ${safeSubject}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: base64",
        "",
        textBase64,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: base64",
        "",
        htmlBase64,
        `--${boundary}--`,
        "",
    ].join("\r\n");

    return Buffer.from(mimeMessage, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
};

const sendEmail = async ({ to, subject, text, html }) => {
    if (!to) {
        throw new Error("Cannot send email: recipient address is missing.");
    }

    try {
        const gmail = await getGmailClient();

        const raw = createRawMessage({
            to,
            subject,
            text,
            html,
        });

        const response = await gmail.users.messages.send({
            userId: "me",
            requestBody: { raw },
        });

        console.log(
            `Email accepted by Gmail for ${to}. Message ID: ${response.data.id}`
        );

        return { messageId: response.data.id };
    } catch (error) {
        const apiMessage =
            error.response?.data?.error?.message || error.message;

        console.error("Gmail API email failed:", apiMessage);

        throw new Error(`Unable to send email. ${apiMessage}`);
    }
};

const sendEmailVerificationOtp = async (user) => {
    const name = escapeHtml(user.name);
    const otp = user.emailVerificationOtp;

    const subject = "Verify your AquaCart email";

    const text = `
Hello ${user.name},

Welcome to AquaCart!

Your email verification OTP is:

${otp}

This OTP will expire in 10 minutes.

If you did not create an AquaCart account, you can safely ignore this email.

Regards,
AquaCart Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Verify your AquaCart email</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
        <h1 style="margin:0 0 16px;color:#0f172a;">Welcome to AquaCart</h1>
        <p style="font-size:16px;line-height:1.6;">Hello ${name},</p>
        <p style="font-size:16px;line-height:1.6;">Thank you for creating your AquaCart account. Use the OTP below to verify your email address.</p>
        <div style="margin:28px 0;text-align:center;">
            <div style="display:inline-block;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:18px 30px;">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f172a;">${otp}</span>
            </div>
        </div>
        <p style="font-size:14px;color:#64748b;">This OTP will expire in 10 minutes.</p>
        <p style="font-size:14px;color:#64748b;">If you did not create an AquaCart account, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
        <p style="font-size:13px;color:#94a3b8;">AquaCart Team</p>
    </div>
</body>
</html>
`;

    return sendEmail({ to: user.email, subject, text, html });
};

const sendAdminOtp = async (user) => {
    const name = escapeHtml(user.name);
    const otp = user.adminOtp;

    const subject = "AquaCart Admin Login OTP";

    const text = `
Hello ${user.name},

Your AquaCart administrator login OTP is:

${otp}

This OTP will expire in 10 minutes.

If you did not attempt to sign in to the AquaCart Admin Panel, please secure your account immediately.

Regards,
AquaCart Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>AquaCart Admin Login OTP</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
        <h1 style="margin:0 0 16px;color:#0f172a;">AquaCart Admin Login</h1>
        <p style="font-size:16px;line-height:1.6;">Hello ${name},</p>
        <p style="font-size:16px;line-height:1.6;">Use the following OTP to complete your administrator login:</p>
        <div style="margin:28px 0;text-align:center;">
            <div style="display:inline-block;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:18px 30px;">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f172a;">${otp}</span>
            </div>
        </div>
        <p style="font-size:14px;color:#64748b;">This OTP will expire in 10 minutes.</p>
        <p style="font-size:14px;color:#64748b;">Never share this OTP with anyone.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
        <p style="font-size:13px;color:#94a3b8;">AquaCart Team</p>
    </div>
</body>
</html>
`;

    return sendEmail({ to: user.email, subject, text, html });
};

const sendPasswordResetEmail = async (user, resetToken) => {
    if (!CLIENT_URL) {
        throw new Error(
            "Password reset email cannot be sent because CLIENT_URL is missing from the server environment."
        );
    }

    const name = escapeHtml(user.name);
    const isAdmin = user.role === "admin";

    const resetPath = isAdmin
        ? "/admin/set-new-password"
        : "/set-new-password";

    const resetUrl =
        `${CLIENT_URL}${resetPath}?token=${encodeURIComponent(resetToken)}`;

    const subject = "Reset your AquaCart password";

    const text = `
Hello ${user.name},

We received a request to reset your AquaCart password.

Use the following link to create a new password:

${resetUrl}

This password reset link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
AquaCart Team
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Reset your AquaCart password</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
        <h1 style="margin:0 0 16px;color:#0f172a;">Reset your AquaCart password</h1>
        <p style="font-size:16px;line-height:1.6;">Hello ${name},</p>
        <p style="font-size:16px;line-height:1.6;">We received a request to reset your AquaCart password.</p>
        <div style="margin:30px 0;text-align:center;">
            <a href="${resetUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:bold;">Reset Password</a>
        </div>
        <p style="font-size:14px;color:#64748b;">This password reset link will expire in 15 minutes.</p>
        <p style="font-size:14px;color:#64748b;word-break:break-word;">If the button does not work, copy and open this link:<br />${resetUrl}</p>
        <p style="font-size:14px;color:#64748b;">If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
        <p style="font-size:13px;color:#94a3b8;">AquaCart Team</p>
    </div>
</body>
</html>
`;

    return sendEmail({ to: user.email, subject, text, html });
};

module.exports = {
    sendEmailVerificationOtp,
    sendAdminOtp,
    sendPasswordResetEmail,
};