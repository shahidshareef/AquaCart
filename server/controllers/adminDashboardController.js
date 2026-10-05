const {
    getDashboardData
} = require("../services/adminDashboardService");

async function getDashboard(req, res) {
    try {
        const dashboardData = await getDashboardData();

        res.status(200).json({
            message: "Admin dashboard data fetched successfully",
            data: dashboardData
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to fetch dashboard data"
        });
    }
}

module.exports = {
    getDashboard
};