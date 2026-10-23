const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization token is required"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authorization token is required"
            });
        }

        const decodedToken = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Check current database status on every authenticated request. A JWT
        // remains cryptographically valid after an admin blocks a customer, so
        // token verification alone is not enough to revoke account access.
        if (decodedToken.role === "customer") {
            const user = await User.findById(decodedToken.userId)
                .select("name status role");

            if (!user || user.role !== "customer") {
                return res.status(401).json({
                    message: "This customer account could not be found. Please sign in again."
                });
            }

            if (user.status === "blocked") {
                return res.status(403).json({
                    accountBlocked: true,
                    message: `Your AquaCart account (${user.name}) has been blocked by an administrator. You cannot use this account. Please contact AquaCart support.`,
                    user: { name: user.name }
                });
            }
        }

        req.user = decodedToken;

        return next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = authMiddleware;