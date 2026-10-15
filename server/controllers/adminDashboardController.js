const { getDashboardData } = require("../services/adminDashboardService");

async function getDashboard(req, res) {
    try {
        const timezoneOffset = req.query.timezoneOffset ?? 0;
        const dashboardData = await getDashboardData(timezoneOffset);

        res.status(200).json({
            message: "Admin dashboard data fetched successfully",
            data: dashboardData
        });
    } catch (error) {
        console.error("Failed to fetch admin dashboard data:", error);
        res.status(500).json({
            message: "Failed to fetch dashboard data"
        });
    }
}

module.exports = {
    getDashboard
};