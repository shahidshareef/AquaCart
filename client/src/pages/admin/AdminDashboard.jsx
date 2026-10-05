import AdminLayout from "../../components/admin/AdminLayout";
import SalesChart from "../../components/admin/SalesChart";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {

    const navigate = useNavigate();

    const [selectedMetric, setSelectedMetric] = useState("revenue");
    const [selectedPeriod, setSelectedPeriod] = useState("week");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderStatus, setOrderStatus] = useState("Pending");
    const [updateMessage, setUpdateMessage] = useState("");

    const [recentOrders, setRecentOrders] = useState([]);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [dashboardMessage, setDashboardMessage] = useState("");


    useEffect(() => {

        async function fetchDashboardData() {

            try {

                setDashboardLoading(true);
                setDashboardMessage("");

                const response = await fetch(
                    "http://localhost:5000/api/admin/dashboard"
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch dashboard data"
                    );
                }

                const orders = result.data.recentOrders || [];

                const formattedOrders = orders.map((order) => {

                    const customerName =
                        order.user?.name || "Unknown Customer";

                    const initials = customerName
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                    const firstItem = order.orderItems?.[0];

                    const orderDate = order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "Date unavailable";

                    let paymentMethod = "Unknown";

                    if (order.paymentMethod === "cod") {
                        paymentMethod = "Cash on Delivery (COD)";
                    } else if (order.paymentMethod === "razorpay") {
                        paymentMethod = "Razorpay";
                    }

                    const status = order.orderStatus
                        ? order.orderStatus.charAt(0).toUpperCase() +
                          order.orderStatus.slice(1)
                        : "Pending";

                    return {
                        id: `#${order._id.slice(-6)}`,
                        mongoId: order._id,
                        initials: initials,
                        customer: customerName,
                        email: order.user?.email || "No email",
                        phone: order.user?.phone || "No phone",
                        amount: `₹${Number(order.totalAmount || 0).toLocaleString("en-IN")}`,
                        status: status,
                        placedDate: orderDate,
                        latestUpdate: orderDate,
                        address: formatAddress(order.shippingAddress),
                        product:
                            firstItem?.product?.name ||
                            "Product unavailable",
                        variant:
                            firstItem?.variant?.size ||
                            "Variant unavailable",
                        sku:
                            firstItem?.variant?.sku ||
                            "SKU unavailable",
                        quantity: firstItem?.quantity || 0,
                        shippingFee: "FREE (₹0)",
                        tax: "Included",
                        paymentMethod: paymentMethod,
                        shippingCarrier: "Standard Dispatch"
                    };
                });

                setRecentOrders(formattedOrders);

            } catch (error) {

                console.log(error);

                setDashboardMessage(
                    "Something went wrong while fetching dashboard data."
                );

            } finally {

                setDashboardLoading(false);

            }
        }

        fetchDashboardData();

    }, []);


    function formatAddress(address) {

        if (!address) {
            return "Shipping address unavailable";
        }

        return [
            address.fullName,
            address.addressLine,
            address.city,
            address.state,
            address.pincode
        ]
            .filter(Boolean)
            .join(", ");
    }


    const periodData = {

        today: {
            label: "Today",
            subtotal: "₹3,594",

            salesData: [
                {
                    day: "9 AM",
                    revenue: 450,
                    previous: 380,
                    orders: 1,
                    previousOrders: 1
                },
                {
                    day: "11 AM",
                    revenue: 720,
                    previous: 600,
                    orders: 2,
                    previousOrders: 2
                },
                {
                    day: "1 PM",
                    revenue: 980,
                    previous: 850,
                    orders: 3,
                    previousOrders: 2
                },
                {
                    day: "3 PM",
                    revenue: 540,
                    previous: 480,
                    orders: 2,
                    previousOrders: 2
                },
                {
                    day: "5 PM",
                    revenue: 904,
                    previous: 780,
                    orders: 3,
                    previousOrders: 2
                }
            ]
        },


        week: {
            label: "This Week",
            subtotal: "₹1,93,200",

            salesData: [
                {
                    day: "Mon",
                    revenue: 18000,
                    previous: 15000,
                    orders: 8,
                    previousOrders: 7
                },
                {
                    day: "Tue",
                    revenue: 22000,
                    previous: 19000,
                    orders: 10,
                    previousOrders: 9
                },
                {
                    day: "Wed",
                    revenue: 26000,
                    previous: 23000,
                    orders: 12,
                    previousOrders: 10
                },
                {
                    day: "Thu",
                    revenue: 24000,
                    previous: 21000,
                    orders: 11,
                    previousOrders: 10
                },
                {
                    day: "Fri",
                    revenue: 31200,
                    previous: 27000,
                    orders: 12,
                    previousOrders: 11
                },
                {
                    day: "Sat",
                    revenue: 38000,
                    previous: 32000,
                    orders: 15,
                    previousOrders: 13
                },
                {
                    day: "Sun",
                    revenue: 34000,
                    previous: 29000,
                    orders: 13,
                    previousOrders: 12
                }
            ]
        },


        month: {
            label: "This Month",
            subtotal: "₹8,42,650",

            salesData: [
                {
                    day: "Week 1",
                    revenue: 182500,
                    previous: 160000,
                    orders: 42,
                    previousOrders: 37
                },
                {
                    day: "Week 2",
                    revenue: 205000,
                    previous: 178000,
                    orders: 48,
                    previousOrders: 41
                },
                {
                    day: "Week 3",
                    revenue: 214350,
                    previous: 190000,
                    orders: 51,
                    previousOrders: 45
                },
                {
                    day: "Week 4",
                    revenue: 240800,
                    previous: 211000,
                    orders: 57,
                    previousOrders: 49
                }
            ]
        }

    };


    const selectedPeriodData = periodData[selectedPeriod];


    function openOrderModal(order) {
        setSelectedOrder(order);
        setOrderStatus(order.status);
        setUpdateMessage("");
    }


    function closeOrderModal() {
        setSelectedOrder(null);
        setUpdateMessage("");
    }


    function handleStatusChange(event) {
        setOrderStatus(event.target.value);
    }


    function handleUpdateOrder() {

        setRecentOrders((currentOrders) =>
            currentOrders.map((order) =>
                order.id === selectedOrder.id
                    ? {
                        ...order,
                        status: orderStatus
                    }
                    : order
            )
        );

        setSelectedOrder({
            ...selectedOrder,
            status: orderStatus
        });

        setUpdateMessage(
            `Order ${selectedOrder.id} updated to ${orderStatus}.`
        );
    }


    function handlePeriodChange(period) {
        setSelectedPeriod(period);
    }


    function handleViewAllOrders() {
        navigate("/admin/orders");
    }


    return (
        <AdminLayout>

            {/* Dashboard Header */}

            <div className="dashboard-header">

                <div>

                    <div>

                        <span>
                            AquaCart Admin
                        </span>

                        <span>
                            • Live Sync
                        </span>

                    </div>

                    <h2>
                        Dashboard
                    </h2>

                    <p>
                        Overview of store performance, sales revenue,
                        and management.
                    </p>

                </div>


                <div>

                    <div>

                        <button
                            type="button"
                            className={
                                selectedPeriod === "today"
                                    ? "period-selected"
                                    : ""
                            }
                            onClick={() =>
                                handlePeriodChange("today")
                            }
                        >
                            Today
                        </button>


                        <button
                            type="button"
                            className={
                                selectedPeriod === "week"
                                    ? "period-selected"
                                    : ""
                            }
                            onClick={() =>
                                handlePeriodChange("week")
                            }
                        >
                            This Week
                        </button>


                        <button
                            type="button"
                            className={
                                selectedPeriod === "month"
                                    ? "period-selected"
                                    : ""
                            }
                            onClick={() =>
                                handlePeriodChange("month")
                            }
                        >
                            This Month
                        </button>

                    </div>


                    <div>

                        <span>
                            SUBTOTAL {selectedPeriodData.label.toUpperCase()}
                        </span>

                        <strong>
                            {selectedPeriodData.subtotal}
                        </strong>

                    </div>

                </div>

            </div>


            {/* Statistics Cards */}

            <div className="dashboard-stats">

                <div className="dashboard-stat-card">

                    <div className="stat-card-header">

                        <span>
                            TOTAL REVENUE
                        </span>

                        <span className="stat-icon revenue-icon">
                            ₹
                        </span>

                    </div>

                    <h3>
                        ₹1,24,850
                    </h3>

                    <p className="stat-success">
                        ↑ +14.2% vs last month
                    </p>

                </div>


                <div className="dashboard-stat-card">

                    <div className="stat-card-header">

                        <span>
                            TOTAL ORDERS
                        </span>

                        <span className="stat-icon orders-icon">
                            🛍
                        </span>

                    </div>

                    <h3>
                        48 Orders
                    </h3>

                    <p className="stat-orders">

                        • +8 new today

                        <span>
                            lifetime placed
                        </span>

                    </p>

                </div>


                <div className="dashboard-stat-card">

                    <div className="stat-card-header">

                        <span>
                            TOTAL PRODUCTS
                        </span>

                        <span className="stat-icon products-icon">
                            📦
                        </span>

                    </div>

                    <h3>
                        10 Active
                    </h3>

                    <p className="stat-success">
                        ✓ In 4 active categories
                    </p>

                </div>

            </div>


            {/* Sales Overview */}

            <div className="sales-overview">

                <div className="sales-overview-header">

                    <div>

                        <h2>
                            Sales & Revenue Overview
                        </h2>

                        <p>
                            {selectedPeriodData.label} earnings trends
                            and customer purchase volume
                        </p>

                    </div>


                    <div className="sales-overview-controls">

                        <div className="metric-toggle">

                            <button
                                type="button"
                                className={
                                    selectedMetric === "revenue"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setSelectedMetric("revenue")
                                }
                            >
                                Revenue
                            </button>


                            <button
                                type="button"
                                className={
                                    selectedMetric === "orders"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setSelectedMetric("orders")
                                }
                            >
                                Orders Volume
                            </button>

                        </div>

                    </div>

                </div>


                <div className="sales-chart">

                    <SalesChart
                        salesData={selectedPeriodData.salesData}
                        selectedMetric={selectedMetric}
                    />

                </div>


                <div className="chart-legend">

                    <span>
                        ● {selectedPeriodData.label} (₹)
                    </span>

                    <span>
                        ┄ Previous Period
                    </span>

                </div>

            </div>


            {/* Recent Orders */}

            <div className="recent-orders">

                <div className="recent-orders-header">

                    <div>

                        <h2>
                            Recent Orders
                        </h2>

                        <p>
                            Latest transactions placed by customers
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={handleViewAllOrders}
                    >
                        View All Orders →
                    </button>

                </div>


                <div className="recent-orders-table">

                    <div className="recent-orders-row recent-orders-heading">

                        <span>
                            ORDER ID
                        </span>

                        <span>
                            CUSTOMER
                        </span>

                        <span>
                            AMOUNT
                        </span>

                        <span>
                            STATUS
                        </span>

                        <span>
                            ACTION
                        </span>

                    </div>


                    {dashboardLoading ? (

                        <div className="recent-orders-row">
                            <span>
                                Loading recent orders...
                            </span>
                        </div>

                    ) : dashboardMessage ? (

                        <div className="recent-orders-row">
                            <span>
                                {dashboardMessage}
                            </span>
                        </div>

                    ) : recentOrders.length === 0 ? (

                        <div className="recent-orders-row">
                            <span>
                                No orders found.
                            </span>
                        </div>

                    ) : (

                        recentOrders.map((order) => (

                            <div
                                className="recent-orders-row"
                                key={order.id}
                            >

                                <span>
                                    {order.id}
                                </span>


                                <span className="order-customer">

                                    <span className="customer-avatar">
                                        {order.initials}
                                    </span>

                                    {order.customer}

                                </span>


                                <span>
                                    {order.amount}
                                </span>


                                <span
                                    className={`order-status ${order.status.toLowerCase()}`}
                                >
                                    {order.status}
                                </span>


                                <button
                                    type="button"
                                    onClick={() =>
                                        openOrderModal(order)
                                    }
                                >
                                    View
                                </button>

                            </div>

                        ))

                    )}

                </div>


                <div className="recent-orders-footer">

                    <span>
                        Showing {recentOrders.length} most recent customer purchases
                    </span>

                    <strong>
                        Subtotal {selectedPeriodData.label}:{" "}
                        {selectedPeriodData.subtotal}
                    </strong>

                </div>

            </div>


            {/* Order Details Modal */}

            {selectedOrder && (

                <div
                    className="order-modal-overlay"
                    onClick={closeOrderModal}
                >

                    <div
                        className="order-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* Modal Header */}

                        <div className="order-modal-header">

                            <div>

                                <div className="order-modal-title">

                                    <h2>
                                        Order Details — {selectedOrder.id}
                                    </h2>


                                    <span
                                        className={`order-status ${orderStatus.toLowerCase()}`}
                                    >
                                        • {orderStatus}
                                    </span>

                                </div>


                                <p>
                                    Placed on {selectedOrder.placedDate}
                                </p>

                            </div>


                            <button
                                type="button"
                                className="order-modal-close"
                                onClick={closeOrderModal}
                            >
                                ✕
                            </button>

                        </div>


                        <div className="order-modal-content">

                            {/* Customer & Delivery Information */}

                            <div className="customer-delivery-info">

                                <div className="customer-info">

                                    <div className="customer-modal-avatar">
                                        {selectedOrder.initials}
                                    </div>


                                    <div>

                                        <h3>
                                            {selectedOrder.customer}
                                        </h3>

                                        <p>
                                            {selectedOrder.email}
                                        </p>

                                        <p>
                                            {selectedOrder.phone}
                                        </p>

                                    </div>

                                </div>


                                <div className="shipping-info">

                                    <h3>
                                        📍 Shipping Address
                                    </h3>

                                    <p>
                                        {selectedOrder.address}
                                    </p>

                                </div>

                            </div>


                            {/* Items Ordered */}

                            <div className="modal-section">

                                <h3 className="modal-section-label">
                                    ITEMS ORDERED
                                </h3>


                                <div className="ordered-item">

                                    <div className="product-icon">
                                        💧
                                    </div>


                                    <div className="ordered-product-details">

                                        <h3>
                                            {selectedOrder.product}
                                        </h3>

                                        <p>
                                            {selectedOrder.variant}
                                        </p>

                                        <span>
                                            SKU: {selectedOrder.sku}
                                        </span>

                                    </div>


                                    <div className="ordered-product-price">

                                        <strong>
                                            {selectedOrder.amount}
                                        </strong>

                                        <span>
                                            Qty: {selectedOrder.quantity}
                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* Payment & Order Summary */}

                            <div className="payment-summary-grid">

                                <div className="payment-carrier">

                                    <div className="info-item">

                                        <span>
                                            PAYMENT METHOD
                                        </span>

                                        <strong>
                                            💳 {selectedOrder.paymentMethod}
                                        </strong>

                                    </div>


                                    <div className="info-item">

                                        <span>
                                            SHIPPING CARRIER
                                        </span>

                                        <strong>
                                            🚚 {selectedOrder.shippingCarrier}
                                        </strong>

                                    </div>

                                </div>


                                <div className="cost-summary">

                                    <div>

                                        <span>
                                            Subtotal
                                        </span>

                                        <strong>
                                            {selectedOrder.amount}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Shipping Fee
                                        </span>

                                        <strong className="free-text">
                                            {selectedOrder.shippingFee}
                                        </strong>

                                    </div>


                                    <div>

                                        <span>
                                            Estimated Tax
                                        </span>

                                        <strong>
                                            {selectedOrder.tax}
                                        </strong>

                                    </div>


                                    <div className="total-row">

                                        <span>
                                            Total Amount
                                        </span>

                                        <strong>
                                            {selectedOrder.amount}
                                        </strong>

                                    </div>

                                </div>

                            </div>


                            {/* Status Update */}

                            <div className="status-update-bar">

                                <div className="status-update-control">

                                    <span>
                                        Update Status:
                                    </span>


                                    <select
                                        value={orderStatus}
                                        onChange={handleStatusChange}
                                    >

                                        <option value="Pending">
                                            Pending
                                        </option>

                                        <option value="Confirmed">
                                            Confirmed
                                        </option>

                                        <option value="Processing">
                                            Processing
                                        </option>

                                        <option value="Shipped">
                                            Shipped
                                        </option>

                                        <option value="Delivered">
                                            Delivered
                                        </option>

                                        <option value="Cancelled">
                                            Cancelled
                                        </option>

                                        <option value="Returned">
                                            Returned
                                        </option>

                                    </select>

                                </div>


                                <span className="latest-update">
                                    Latest update: {selectedOrder.latestUpdate}
                                </span>

                            </div>


                            {/* Update Message */}

                            {updateMessage && (

                                <div className="order-update-message">
                                    {updateMessage}
                                </div>

                            )}

                        </div>


                        {/* Modal Footer */}

                        <div className="order-modal-footer">

                            <button
                                type="button"
                                className="modal-close-button"
                                onClick={closeOrderModal}
                            >
                                Close
                            </button>


                            <div className="modal-footer-actions">

                                <button
                                    type="button"
                                    className="print-invoice-button"
                                    onClick={() =>
                                        window.print()
                                    }
                                >
                                    🖨 Print Invoice
                                </button>

                                <button
                                    type="button"
                                    className="update-order-button"
                                    onClick={handleUpdateOrder}
                                >
                                    ✓ Update Order
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </AdminLayout>
    );
}

export default AdminDashboard;