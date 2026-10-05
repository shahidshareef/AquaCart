import AdminLayout from "../../components/admin/AdminLayout";
import SalesChart from "../../components/admin/SalesChart";
import { useState } from "react";

function AdminDashboard() {

    const [selectedMetric, setSelectedMetric] = useState("revenue");
    const [selectedPeriod, setSelectedPeriod] = useState("week");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderStatus, setOrderStatus] = useState("Pending");
    const [updateMessage, setUpdateMessage] = useState("");

    const salesData = [
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
    ];


    const [recentOrders, setRecentOrders] = useState([
        {
            id: "#1005",
            initials: "RM",
            customer: "Rahul M.",
            email: "rahul.m@example.com",
            phone: "+91 98765 43210",
            amount: "₹599",
            status: "Pending",
            placedDate: "Oct 24, 2023 at 2:30 PM",
            latestUpdate: "Oct 24, 2:30 PM",
            address:
                "Flat 402, Green Glen Heights, Outer Ring Road, Bellandur, Bengaluru - 560103",
            product: "Hydro Luxe Pure Steel Bottle",
            variant: "750ml · Matte Black",
            sku: "HL-750-BLK",
            quantity: 1,
            shippingFee: "FREE (₹0)",
            tax: "Included",
            paymentMethod: "Cash on Delivery (COD)",
            shippingCarrier: "Standard Dispatch (BlueDart)"
        },

        {
            id: "#1004",
            initials: "PS",
            customer: "Priya Sharma",
            email: "priya.s@example.com",
            phone: "+91 98765 43211",
            amount: "₹1,098",
            status: "Shipped",
            placedDate: "Oct 24, 2023 at 1:45 PM",
            latestUpdate: "Oct 24, 3:15 PM",
            address:
                "12 MG Road, Ernakulam, Kerala - 682016",
            product: "Hydro Luxe Pure Steel Bottle",
            variant: "1L · Silver",
            sku: "HL-1000-SLV",
            quantity: 2,
            shippingFee: "FREE (₹0)",
            tax: "Included",
            paymentMethod: "Cash on Delivery (COD)",
            shippingCarrier: "Standard Dispatch (BlueDart)"
        },

        {
            id: "#1003",
            initials: "AK",
            customer: "Anish Kumar",
            email: "anish.k@example.com",
            phone: "+91 98765 43212",
            amount: "₹499",
            status: "Delivered",
            placedDate: "Oct 23, 2023 at 6:20 PM",
            latestUpdate: "Oct 26, 11:00 AM",
            address:
                "45 Park Street, Kozhikode, Kerala - 673001",
            product: "Aqua Basic Steel Bottle",
            variant: "500ml · Silver",
            sku: "AB-500-SLV",
            quantity: 1,
            shippingFee: "FREE (₹0)",
            tax: "Included",
            paymentMethod: "Cash on Delivery (COD)",
            shippingCarrier: "Standard Dispatch (BlueDart)"
        }
    ]);


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
                            className={selectedPeriod === "today" ? "active" : ""}
                            onClick={() =>
                                setSelectedPeriod("today")
                            }
                        >
                            Today
                        </button>

                        <button
                            type="button"
                            className={selectedPeriod === "week" ? "active" : ""}
                            onClick={() =>
                                setSelectedPeriod("week")
                            }
                        >
                            This Week
                        </button>

                        <button
                            type="button"
                            className={selectedPeriod === "month" ? "active" : ""}
                            onClick={() =>
                                setSelectedPeriod("month")
                            }
                        >
                            This Month
                        </button>

                    </div>


                    <div>

                        <span>
                            SUBTOTAL TODAY
                        </span>

                        <strong>
                            ₹3,594
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
                            Daily earnings trends and customer purchase volume
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
                        salesData={salesData}
                        selectedMetric={selectedMetric}
                    />

                </div>


                <div className="chart-legend">

                    <span>
                        ● Current Week (₹)
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


                    <button type="button">
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


                    {recentOrders.map((order) => (

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

                    ))}

                </div>


                <div className="recent-orders-footer">

                    <span>
                        Showing 3 most recent customer purchases
                    </span>

                    <strong>
                        Subtotal Today: ₹3,594
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

                                        <option value="Shipped">
                                            Shipped
                                        </option>

                                        <option value="Delivered">
                                            Delivered
                                        </option>

                                        <option value="Cancelled">
                                            Cancelled
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