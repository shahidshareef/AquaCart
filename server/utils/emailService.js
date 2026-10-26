const nodemailer = require("nodemailer");

const mailService = process.env.MAIL_SERVICE || "gmail";
const mailUser = process.env.MAIL_USER;
const mailPassword = process.env.MAIL_PASSWORD;
const mailFrom = process.env.MAIL_FROM || mailUser;

const clientUrl = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.replace(/\/+$/, "")
    : "";

if (!clientUrl) {
    console.warn(
        "Email service warning: CLIENT_URL is missing from the server environment."
    );
}

if (!mailUser || !mailPassword) {
    console.warn(
        "Email service warning: MAIL_USER or MAIL_PASSWORD is missing from .env"
    );
}

const transporter = nodemailer.createTransport({
    service: mailService,
    auth: {
        user: mailUser,
        pass: mailPassword,
    },
});

const escapeHtml = (value = "") => {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const sendEmail = async ({ to, subject, text, html }) => {
    if (!mailUser || !mailPassword) {
        throw new Error(
            "Email service is not configured. Please check MAIL_USER and MAIL_PASSWORD in the server .env file."
        );
    }

    try {
        const info = await transporter.sendMail({
            from: mailFrom,
            to,
            subject,
            text,
            html,
        });

        console.log(
            `Email sent successfully to ${to}. Message ID: ${info.messageId}`
        );

        return info;
    } catch (error) {
        console.error("Email sending failed:", error.message);

        throw new Error(`Unable to send email. ${error.message}`);
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

    return sendEmail({
        to: user.email,
        subject,
        text,
        html,
    });
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

    return sendEmail({
        to: user.email,
        subject,
        text,
        html,
    });
};

const sendPasswordResetEmail = async (user, resetToken) => {
    if (!clientUrl) {
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
        `${clientUrl}${resetPath}?token=${encodeURIComponent(resetToken)}`;

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

    return sendEmail({
        to: user.email,
        subject,
        text,
        html,
    });
};

module.exports = {
    sendEmailVerificationOtp,
    sendAdminOtp,
    sendPasswordResetEmail,
};