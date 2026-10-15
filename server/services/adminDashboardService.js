const Order = require("../models/Order");
const Product = require("../models/Product");
const Category = require("../models/Category");

const EXCLUDED_ORDER_STATUSES = ["cancelled", "returned"];
const EXCLUDED_PAYMENT_STATUSES = ["failed", "refunded"];

function addDays(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

function startOfDay(date) {
    const result = new Date(date);
    result.setUTCHours(0, 0, 0, 0);
    return result;
}

function makeBucket(label, startLocal, endLocal, timezoneOffset) {
    return {
        day: label,
        start: new Date(startLocal.getTime() - timezoneOffset * 60_000),
        end: new Date(endLocal.getTime() - timezoneOffset * 60_000),
        revenue: 0,
        previous: 0,
        orders: 0,
        previousOrders: 0
    };
}

function makePeriodBuckets(period, localNow, timezoneOffset) {
    if (period === "today") {
        const todayStart = startOfDay(localNow);
        const yesterdayStart = addDays(todayStart, -1);
        const current = [];
        const previous = [];

        for (let hour = 0; hour < 24; hour += 4) {
            const currentStart = new Date(todayStart);
            currentStart.setUTCHours(hour);
            const currentEnd = new Date(currentStart);
            currentEnd.setUTCHours(hour + 4);

            const previousStart = new Date(yesterdayStart);
            previousStart.setUTCHours(hour);
            const previousEnd = new Date(previousStart);
            previousEnd.setUTCHours(hour + 4);

            const label = new Date(Date.UTC(2000, 0, 1, hour))
                .toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    hour12: true,
                    timeZone: "UTC"
                });

            current.push(makeBucket(label, currentStart, currentEnd, timezoneOffset));
            previous.push(makeBucket(label, previousStart, previousEnd, timezoneOffset));
        }

        return { current, previous };
    }

    if (period === "week") {
        const currentWeekStart = startOfDay(localNow);
        const weekday = currentWeekStart.getUTCDay();
        currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - ((weekday + 6) % 7));
        const previousWeekStart = addDays(currentWeekStart, -7);
        const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const current = [];
        const previous = [];

        for (let index = 0; index < 7; index += 1) {
            const currentStart = addDays(currentWeekStart, index);
            const previousStart = addDays(previousWeekStart, index);
            current.push(makeBucket(labels[index], currentStart, addDays(currentStart, 1), timezoneOffset));
            previous.push(makeBucket(labels[index], previousStart, addDays(previousStart, 1), timezoneOffset));
        }

        return { current, previous };
    }

    const currentMonthStart = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth() + 1, 1));
    const previousMonthStart = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth() - 1, 1));
    const current = [];
    const previous = [];

    for (let index = 0; index < 5; index += 1) {
        const currentStart = addDays(currentMonthStart, index * 7);
        if (currentStart >= nextMonthStart) break;
        const currentEnd = new Date(Math.min(addDays(currentStart, 7).getTime(), nextMonthStart.getTime()));

        const previousStart = addDays(previousMonthStart, index * 7);
        const previousMonthEnd = new Date(Date.UTC(
            previousMonthStart.getUTCFullYear(),
            previousMonthStart.getUTCMonth() + 1,
            1
        ));
        if (previousStart < previousMonthEnd) {
            const previousEnd = new Date(Math.min(addDays(previousStart, 7).getTime(), previousMonthEnd.getTime()));
            previous.push(makeBucket(`Week ${index + 1}`, previousStart, previousEnd, timezoneOffset));
        } else {
            previous.push(makeBucket(`Week ${index + 1}`, previousMonthEnd, previousMonthEnd, timezoneOffset));
        }

        current.push(makeBucket(`Week ${index + 1}`, currentStart, currentEnd, timezoneOffset));
    }

    return { current, previous };
}

function addOrdersToBuckets(orders, buckets, valueKey, countKey) {
    for (const order of orders) {
        const createdAt = new Date(order.createdAt).getTime();
        const bucket = buckets.find((item) =>
            createdAt >= item.start.getTime() && createdAt < item.end.getTime()
        );

        if (bucket) {
            bucket[valueKey] += Number(order.totalAmount || 0);
            bucket[countKey] += 1;
        }
    }
}

function serializeBuckets(current, previous) {
    return current.map((bucket, index) => ({
        day: bucket.day,
        revenue: bucket.revenue,
        previous: previous[index]?.revenue || 0,
        orders: bucket.orders,
        previousOrders: previous[index]?.orders || 0
    }));
}

function sumRevenue(orders) {
    return orders.reduce((total, order) => total + Number(order.totalAmount || 0), 0);
}

async function getDashboardData(timezoneOffsetValue = 0) {
    const parsedOffset = Number(timezoneOffsetValue);
    // JavaScript's getTimezoneOffset() uses UTC minus local time, e.g. -330 for India.
    const timezoneOffset = Number.isFinite(parsedOffset)
        ? Math.max(-840, Math.min(840, parsedOffset))
        : 0;
    const now = new Date();
    const localNow = new Date(now.getTime() - timezoneOffset * 60_000);

    const todayBuckets = makePeriodBuckets("today", localNow, timezoneOffset);
    const weekBuckets = makePeriodBuckets("week", localNow, timezoneOffset);
    const monthBuckets = makePeriodBuckets("month", localNow, timezoneOffset);

    const allBuckets = [
        ...todayBuckets.current, ...todayBuckets.previous,
        ...weekBuckets.current, ...weekBuckets.previous,
        ...monthBuckets.current, ...monthBuckets.previous
    ];
    const earliestBucket = new Date(Math.min(...allBuckets.map((bucket) => bucket.start.getTime())));

    const validOrderFilter = {
        orderStatus: { $nin: EXCLUDED_ORDER_STATUSES },
        paymentStatus: { $nin: EXCLUDED_PAYMENT_STATUSES }
    };

    const [recentOrders, totalOrders, totalProducts, activeCategories, newOrdersToday, lifetimeRevenueOrders, salesOrders] = await Promise.all([
        Order.find()
            .populate("user", "name email phone")
            .populate("orderItems.product", "name")
            .populate("orderItems.variant", "size sku price")
            .sort({ createdAt: -1 })
            .limit(6),
        Order.countDocuments(),
        Product.countDocuments({ status: "active" }),
        Category.countDocuments({ status: "active" }),
        Order.countDocuments({ createdAt: { $gte: todayBuckets.current[0].start, $lt: todayBuckets.current[todayBuckets.current.length - 1].end } }),
        Order.find(validOrderFilter).select("totalAmount").lean(),
        Order.find({
            ...validOrderFilter,
            createdAt: { $gte: earliestBucket, $lt: now }
        }).select("createdAt totalAmount").lean()
    ]);

    addOrdersToBuckets(salesOrders, todayBuckets.current, "revenue", "orders");
    addOrdersToBuckets(salesOrders, todayBuckets.previous, "revenue", "orders");
    addOrdersToBuckets(salesOrders, weekBuckets.current, "revenue", "orders");
    addOrdersToBuckets(salesOrders, weekBuckets.previous, "revenue", "orders");
    addOrdersToBuckets(salesOrders, monthBuckets.current, "revenue", "orders");
    addOrdersToBuckets(salesOrders, monthBuckets.previous, "revenue", "orders");

    const todaySales = {
        label: "Today",
        subtotal: todayBuckets.current.reduce((sum, bucket) => sum + bucket.revenue, 0),
        salesData: serializeBuckets(todayBuckets.current, todayBuckets.previous)
    };
    const weekSales = {
        label: "This Week",
        subtotal: weekBuckets.current.reduce((sum, bucket) => sum + bucket.revenue, 0),
        salesData: serializeBuckets(weekBuckets.current, weekBuckets.previous)
    };
    const monthSales = {
        label: "This Month",
        subtotal: monthBuckets.current.reduce((sum, bucket) => sum + bucket.revenue, 0),
        salesData: serializeBuckets(monthBuckets.current, monthBuckets.previous)
    };

    return {
        totalRevenue: sumRevenue(lifetimeRevenueOrders),
        totalOrders,
        totalProducts,
        activeCategories,
        newOrdersToday,
        sales: {
            today: todaySales,
            week: weekSales,
            month: monthSales
        },
        recentOrders
    };
}

module.exports = {
    getDashboardData
};