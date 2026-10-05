import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

function Orders() {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Orders");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    const [orderStatus, setOrderStatus] = useState("");

    useEffect(function () {
        async function getOrders() {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/admin/orders"
                );

                const data = await response.json();

                if (!response.ok) {
                    setMessage(
                        data.message || "Failed to fetch orders."
                    );
                    setMessageType("error");
                    return;
                }

                setOrders(data.data);
            } catch (error) {
                console.log(error);

                setMessage(
                    "Something went wrong while loading orders."
                );
                setMessageType("error");
            } finally {
                setLoading(false);
            }
        }

        getOrders();
    }, []);

    async function handleViewDetails(orderId) {
        try {
            setMessage("");
            setMessageType("");

            const response = await fetch(
                `http://localhost:5000/api/admin/orders/${orderId}`
            );

            const result = await response.json();

            if (!response.ok) {
                setMessage(
                    result.message || "Failed to fetch order."
                );
                setMessageType("error");
                return;
            }

            setSelectedOrder(result.data);
            setOrderStatus(result.data.orderStatus);
            setShowOrderModal(true);

        } catch (error) {
            console.log(error);

            setMessage(
                "Something went wrong while fetching the order."
            );
            setMessageType("error");
        }
    }

    function closeOrderModal() {
        setShowOrderModal(false);
        setSelectedOrder(null);
        setOrderStatus("");
    }

    function handleStatusChange(event) {
        setOrderStatus(event.target.value);
    }

    async function handleUpdateStatus() {

        if (!selectedOrder) {
            return;
        }

        try {
            setMessage("");
            setMessageType("");

            const response = await fetch(
                `http://localhost:5000/api/admin/orders/${selectedOrder._id}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        orderStatus: orderStatus
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setMessage(
                    result.message || "Failed to update order status."
                );
                setMessageType("error");
                return;
            }

            setSelectedOrder(result.data);
            setOrderStatus(result.data.orderStatus);

            setOrders(function (currentOrders) {
                return currentOrders.map(function (order) {

                    if (order._id === result.data._id) {
                        return result.data;
                    }

                    return order;
                });
            });

            setMessage("Order status updated successfully.");
            setMessageType("success");

        } catch (error) {
            console.log(error);

            setMessage(
                "Something went wrong while updating the order status."
            );
            setMessageType("error");
        }
    }

    function getStatusClass(orderStatus) {

        if (orderStatus === "pending") {
            return "bg-yellow-50 text-yellow-700";
        }

        if (orderStatus === "confirmed") {
            return "bg-blue-50 text-blue-700";
        }

        if (orderStatus === "processing") {
            return "bg-sky-50 text-sky-700";
        }

        if (orderStatus === "shipped") {
            return "bg-indigo-50 text-indigo-700";
        }

        if (orderStatus === "delivered") {
            return "bg-green-50 text-green-700";
        }

        if (orderStatus === "cancelled") {
            return "bg-red-50 text-red-700";
        }

        if (orderStatus === "returned") {
            return "bg-slate-100 text-slate-600";
        }

        return "bg-slate-100 text-slate-600";
    }

    function getStatusLabel(orderStatus) {

        if (!orderStatus) {
            return "Unknown";
        }

        return (
            orderStatus.charAt(0).toUpperCase() +
            orderStatus.slice(1)
        );
    }

    function getCustomerInitials(name) {

        if (!name) {
            return "CU";
        }

        const words = name.trim().split(" ");

        if (words.length === 1) {
            return words[0].slice(0, 2).toUpperCase();
        }

        return (
            words[0].charAt(0) +
            words[words.length - 1].charAt(0)
        ).toUpperCase();
    }

    function getPlacedDate(date) {

        if (!date) {
            return "Unknown date";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit"
            }
        );
    }

    const filteredOrders = orders.filter(function (order) {

        const searchText = search.toLowerCase().trim();

        const orderId = order._id
            ? order._id.toLowerCase()
            : "";

        const customerName = order.user?.name
            ? order.user.name.toLowerCase()
            : "";

        const customerPhone = order.user?.phone
            ? order.user.phone.toLowerCase()
            : "";

        const matchesSearch =
            orderId.includes(searchText) ||
            customerName.includes(searchText) ||
            customerPhone.includes(searchText);

        const matchesStatus =
            statusFilter === "All Orders" ||
            order.orderStatus === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    return (
        <AdminLayout pageTitle="Orders">

            <div className="space-y-6">

                {/* Workspace Header */}

                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                    <div>

                        <h2 className="text-2xl font-bold text-slate-900">
                            Orders
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Track customer orders and update shipping and fulfillment status.
                        </p>

                    </div>


                    {/* Search + Filter */}

                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

                        <div className="relative w-full sm:w-80">

                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔍
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={function (event) {
                                    setSearch(event.target.value);
                                }}
                                placeholder="Search by Order ID, customer name, phone..."
                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />

                        </div>


                        <select
                            value={statusFilter}
                            onChange={function (event) {
                                setStatusFilter(event.target.value);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-44"
                        >

                            <option value="All Orders">
                                All Orders
                            </option>

                            <option value="pending">
                                Pending
                            </option>

                            <option value="confirmed">
                                Confirmed
                            </option>

                            <option value="processing">
                                Processing
                            </option>

                            <option value="shipped">
                                Shipped
                            </option>

                            <option value="delivered">
                                Delivered
                            </option>

                            <option value="cancelled">
                                Cancelled
                            </option>

                            <option value="returned">
                                Returned
                            </option>

                        </select>

                    </div>

                </div>


                {/* Message */}

                {message && (
                    <div
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            messageType === "error"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-700"
                        }`}
                    >
                        {message}
                    </div>
                )}


                {/* Orders Table */}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[950px]">

                            <thead>

                                <tr className="border-b border-slate-200 bg-slate-50">

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Order ID
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Customer
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Date
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Total
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Payment
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="px-6 py-10 text-center text-sm text-slate-500"
                                        >
                                            Loading orders...
                                        </td>

                                    </tr>

                                ) : orders.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="px-6 py-10 text-center text-sm text-slate-500"
                                        >
                                            No orders found.
                                        </td>

                                    </tr>

                                ) : filteredOrders.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="px-6 py-10 text-center text-sm text-slate-500"
                                        >
                                            No orders match your search or filter.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredOrders.map(function (order) {

                                        return (

                                            <tr
                                                key={order._id}
                                                className="border-b border-slate-100 last:border-b-0"
                                            >

                                                <td className="px-6 py-5">

                                                    <span className="text-sm font-semibold text-slate-800">
                                                        #{order._id.slice(0, 8)}
                                                    </span>

                                                </td>


                                                <td className="px-6 py-5">

                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {order.user?.name || "Unknown Customer"}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {order.user?.phone || "No phone number"}
                                                    </p>

                                                </td>


                                                <td className="px-6 py-5 text-sm text-slate-600">

                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        }
                                                    )}

                                                </td>


                                                <td className="px-6 py-5 text-sm font-semibold text-slate-800">
                                                    ₹{order.totalAmount}
                                                </td>


                                                <td className="px-6 py-5">

                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                                                        {order.paymentMethod}
                                                    </span>

                                                </td>


                                                <td className="px-6 py-5">

                                                    <span
                                                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                            order.orderStatus
                                                        )}`}
                                                    >

                                                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>

                                                        {getStatusLabel(
                                                            order.orderStatus
                                                        )}

                                                    </span>

                                                </td>


                                                <td className="px-6 py-5 text-right">

                                                    <button
                                                        type="button"
                                                        onClick={function () {
                                                            handleViewDetails(order._id);
                                                        }}
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
                                                    >
                                                        View Details
                                                    </button>

                                                </td>

                                            </tr>

                                        );

                                    })

                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* Footer */}

                    {!loading && orders.length > 0 && (

                        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                            <p className="text-sm text-slate-500">
                                Showing {filteredOrders.length} of {orders.length} orders
                            </p>

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    disabled
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white"
                                >
                                    1
                                </button>

                                <button
                                    type="button"
                                    disabled
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400"
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    )}

                </div>

            </div>


            {/* Order Details Modal */}

            {showOrderModal && selectedOrder && (

                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6"
                    onClick={closeOrderModal}
                >

                    <div
                        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                        onClick={function (event) {
                            event.stopPropagation();
                        }}
                    >

                        {/* Modal Header */}

                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

                            <div className="min-w-0">

                                <div className="flex flex-wrap items-center gap-3">

                                    <h2 className="text-xl font-bold text-slate-900">
                                        Order Details — #{selectedOrder._id.slice(0, 8)}
                                    </h2>

                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                            selectedOrder.orderStatus
                                        )}`}
                                    >
                                        • {getStatusLabel(selectedOrder.orderStatus)}
                                    </span>

                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Placed on {getPlacedDate(selectedOrder.createdAt)}
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={closeOrderModal}
                                className="ml-4 rounded-lg px-3 py-2 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                ✕
                            </button>

                        </div>


                        {/* Modal Content */}

                        <div className="overflow-y-auto">

                            <div className="space-y-6 px-6 py-6">

                                {/* Customer + Shipping */}

                                <div className="grid gap-6 md:grid-cols-2">

                                    <div>

                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Customer
                                        </p>

                                        <div className="mt-3 flex items-center gap-3">

                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                                                {getCustomerInitials(
                                                    selectedOrder.user?.name
                                                )}
                                            </div>

                                            <div className="min-w-0">

                                                <h3 className="text-sm font-bold text-slate-900">
                                                    {selectedOrder.user?.name || "Unknown Customer"}
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {selectedOrder.user?.email || "No email"}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {selectedOrder.user?.phone || "No phone number"}
                                                </p>

                                            </div>

                                        </div>

                                    </div>


                                    <div>

                                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            📍 Shipping Address
                                        </h3>

                                        <div className="mt-3 rounded-lg bg-slate-50 p-4">

                                            <p className="text-sm font-semibold text-slate-800">
                                                {selectedOrder.shippingAddress?.fullName || "N/A"}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-600">
                                                {selectedOrder.shippingAddress?.phone || "N/A"}
                                            </p>

                                            <p className="mt-2 text-sm text-slate-600">
                                                {selectedOrder.shippingAddress?.addressLine || "N/A"}
                                            </p>

                                            <p className="text-sm text-slate-600">

                                                {selectedOrder.shippingAddress?.city || "N/A"},
                                                {" "}
                                                {selectedOrder.shippingAddress?.state || "N/A"}
                                                {" - "}
                                                {selectedOrder.shippingAddress?.pincode || "N/A"}

                                            </p>

                                        </div>

                                    </div>

                                </div>


                                {/* Items Ordered */}

                                <div className="border-t border-slate-200 pt-6">

                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        ITEMS ORDERED
                                    </h3>


                                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">

                                        {selectedOrder.orderItems?.map(function (item, index) {

                                            return (

                                                <div
                                                    key={item._id || index}
                                                    className="flex flex-col gap-4 border-b border-slate-200 p-4 last:border-b-0 sm:flex-row sm:items-center"
                                                >

                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xl">
                                                        💧
                                                    </div>


                                                    <div className="min-w-0 flex-1">

                                                        <h3 className="text-sm font-bold text-slate-900">
                                                            {item.product?.name || "Unknown Product"}
                                                        </h3>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {item.variant?.size || "N/A"}
                                                        </p>

                                                        <span className="mt-1 block text-xs text-slate-400">
                                                            SKU: {item.variant?.sku || "N/A"}
                                                        </span>

                                                    </div>


                                                    <div className="sm:text-right">

                                                        <strong className="text-sm font-bold text-slate-900">
                                                            ₹{item.price}
                                                        </strong>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Qty:{" "}
                                                            <span className="font-semibold text-slate-700">
                                                                {item.quantity}
                                                            </span>
                                                        </p>

                                                    </div>

                                                </div>

                                            );

                                        })}

                                    </div>

                                </div>


                                {/* Payment + Summary */}

                                <div className="grid gap-6 border-t border-slate-200 pt-6 md:grid-cols-2">

                                    <div className="space-y-5">

                                        <div>

                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                PAYMENT METHOD
                                            </span>

                                            <strong className="mt-2 block text-sm font-semibold text-slate-800">
                                                💳{" "}
                                                {selectedOrder.paymentMethod === "cod"
                                                    ? "Cash on Delivery (COD)"
                                                    : "Razorpay"}
                                            </strong>

                                        </div>


                                        <div>

                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                PAYMENT STATUS
                                            </span>

                                            <strong className="mt-2 block text-sm font-semibold capitalize text-slate-800">
                                                {selectedOrder.paymentStatus || "Pending"}
                                            </strong>

                                        </div>


                                        <div>

                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                SHIPPING CARRIER
                                            </span>

                                            <strong className="mt-2 block text-sm font-semibold text-slate-800">
                                                🚚 Standard Dispatch
                                            </strong>

                                        </div>

                                    </div>


                                    <div className="rounded-lg bg-slate-50 p-4">

                                        <div className="flex items-center justify-between">

                                            <span className="text-sm text-slate-500">
                                                Subtotal
                                            </span>

                                            <strong className="text-sm font-semibold text-slate-800">
                                                ₹{selectedOrder.totalAmount}
                                            </strong>

                                        </div>


                                        <div className="mt-3 flex items-center justify-between">

                                            <span className="text-sm text-slate-500">
                                                Shipping Fee
                                            </span>

                                            <strong className="text-sm font-semibold text-green-600">
                                                FREE
                                            </strong>

                                        </div>


                                        <div className="mt-3 flex items-center justify-between">

                                            <span className="text-sm text-slate-500">
                                                Estimated Tax
                                            </span>

                                            <strong className="text-sm font-semibold text-slate-800">
                                                Included
                                            </strong>

                                        </div>


                                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">

                                            <span className="text-sm font-bold text-slate-700">
                                                Total Amount
                                            </span>

                                            <strong className="text-xl font-bold text-slate-900">
                                                ₹{selectedOrder.totalAmount}
                                            </strong>

                                        </div>

                                    </div>

                                </div>


                                {/* Status Update */}

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

                                            <span className="text-sm font-semibold text-slate-700">
                                                Update Status:
                                            </span>

                                            <select
                                                value={orderStatus}
                                                onChange={handleStatusChange}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                            >

                                                <option value="pending">
                                                    Pending
                                                </option>

                                                <option value="confirmed">
                                                    Confirmed
                                                </option>

                                                <option value="processing">
                                                    Processing
                                                </option>

                                                <option value="shipped">
                                                    Shipped
                                                </option>

                                                <option value="delivered">
                                                    Delivered
                                                </option>

                                                <option value="cancelled">
                                                    Cancelled
                                                </option>

                                                <option value="returned">
                                                    Returned
                                                </option>

                                            </select>

                                        </div>


                                        <span className="text-xs text-slate-500">
                                            Current status:{" "}
                                            <span className="font-semibold text-slate-700">
                                                {getStatusLabel(orderStatus)}
                                            </span>
                                        </span>

                                    </div>

                                </div>


                                {/* Update Message */}

                                {message && (

                                    <div
                                        className={`rounded-lg border px-4 py-3 text-sm ${
                                            messageType === "error"
                                                ? "border-red-200 bg-red-50 text-red-700"
                                                : "border-green-200 bg-green-50 text-green-700"
                                        }`}
                                    >
                                        {message}
                                    </div>

                                )}

                            </div>

                        </div>


                        {/* Modal Footer */}

                        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                            <button
                                type="button"
                                onClick={closeOrderModal}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Close
                            </button>


                            <div className="flex flex-col gap-3 sm:flex-row">

                                <button
                                    type="button"
                                    onClick={function () {
                                        window.print();
                                    }}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    🖨 Print Invoice
                                </button>


                                <button
                                    type="button"
                                    onClick={handleUpdateStatus}
                                    className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600"
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

export default Orders;