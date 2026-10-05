function roleMiddleware(allowedRole) {
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        if (req.user.role !== allowedRole) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
}

module.exports = roleMiddleware;