import { adminFetch } from "../../services/adminApi";
import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { API_BASE_URL } from "../../config/apiConfig.js";

const ORDERS_PER_PAGE = 9;

function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Orders");
    const [currentPage, setCurrentPage] = useState(1);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderStatus, setOrderStatus] = useState("");

    const [returnDecision, setReturnDecision] = useState("");
    const [returnNote, setReturnNote] = useState("");
    const [returnActionLoading, setReturnActionLoading] = useState(false);
    const [returnCompleteLoading, setReturnCompleteLoading] = useState(false);
    const [showReturnConfirmModal, setShowReturnConfirmModal] = useState(false);
    const [showCompleteReturnModal, setShowCompleteReturnModal] = useState(false);

    function getAuthHeaders() {
        const token = localStorage.getItem("token");

        return {
            Authorization: `Bearer ${token || ""}`,
        };
    }

    async function readResponse(response) {
        const data = await response.json().catch(() => ({}));
        return data;
    }

    async function loadOrders() {
        setLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/orders`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const data = await readResponse(response);

            if (!response.ok) {
                setMessage(data.message || "Failed to fetch orders.");
                setMessageType("error");
                return;
            }

            setOrders(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error(error);
            setMessage("Something went wrong while loading orders.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOrders();
    }, []);

    async function handleViewDetails(orderId) {
        try {
            setMessage("");
            setMessageType("");

            const response = await fetch(
                `${API_BASE_URL}/api/admin/orders/${orderId}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            const result = await readResponse(response);

            if (!response.ok) {
                setMessage(result.message || "Failed to fetch order.");
                setMessageType("error");
                return;
            }

            setSelectedOrder(result.data);
            setOrderStatus(result.data.orderStatus || "");
            setReturnNote(result.data.returnRequest?.adminNote || "");
            setShowOrderModal(true);
        } catch (error) {
            console.error(error);
            setMessage("Something went wrong while fetching the order.");
            setMessageType("error");
        }
    }

    function closeOrderModal() {
        if (returnActionLoading || returnCompleteLoading) {
            return;
        }

        setShowOrderModal(false);
        setSelectedOrder(null);
        setOrderStatus("");
        setReturnNote("");
        setReturnDecision("");
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
                `${API_BASE_URL}/api/admin/orders/${selectedOrder._id}/status`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({ orderStatus }),
                }
            );

            const result = await readResponse(response);

            if (!response.ok) {
                setMessage(
                    result.message || "Failed to update order status."
                );
                setMessageType("error");
                return;
            }

            setSelectedOrder(result.data);
            setOrderStatus(result.data.orderStatus || "");

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order._id === result.data._id ? result.data : order
                )
            );

            setMessage("Order status updated successfully.");
            setMessageType("success");
        } catch (error) {
            console.error(error);
            setMessage(
                "Something went wrong while updating the order status."
            );
            setMessageType("error");
        }
    }

    function openReturnReview(decision) {
        if (!selectedOrder?.returnRequest) {
            return;
        }

        setReturnDecision(decision);
        setReturnNote(selectedOrder.returnRequest.adminNote || "");
        setShowReturnConfirmModal(true);
    }

    function closeReturnConfirmModal() {
        if (returnActionLoading) {
            return;
        }

        setShowReturnConfirmModal(false);
        setReturnDecision("");
    }

    async function handleReviewReturn() {
        if (!selectedOrder || !returnDecision) {
            return;
        }

        setReturnActionLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/orders/${selectedOrder._id}/return-request`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({
                        decision: returnDecision,
                        adminNote: returnNote,
                    }),
                }
            );

            const result = await readResponse(response);

            if (!response.ok) {
                setMessage(
                    result.message || "Failed to review return request."
                );
                setMessageType("error");
                return;
            }

            setSelectedOrder(result.data);
            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order._id === result.data._id ? result.data : order
                )
            );

            setShowReturnConfirmModal(false);
            setReturnDecision("");
            setReturnNote(result.data.returnRequest?.adminNote || "");

            setMessage(
                returnDecision === "approved"
                    ? "Return request approved successfully."
                    : "Return request rejected successfully."
            );
            setMessageType("success");
        } catch (error) {
            console.error(error);
            setMessage("Something went wrong while reviewing the return request.");
            setMessageType("error");
        } finally {
            setReturnActionLoading(false);
        }
    }

    function handleCompleteReturn() {
        if (
            !selectedOrder ||
            !["approved", "completed"].includes(selectedOrder.returnRequest?.status)
        ) {
            return;
        }

        setShowCompleteReturnModal(true);
    }

    async function confirmCompleteReturn() {
        if (
            !selectedOrder ||
            !["approved", "completed"].includes(selectedOrder.returnRequest?.status)
        ) {
            return;
        }

        setReturnCompleteLoading(true);
        setMessage("");
        setMessageType("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/admin/orders/${selectedOrder._id}/return-complete`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({ adminNote: returnNote }),
                }
            );

            const result = await readResponse(response);

            if (!response.ok) {
                setShowCompleteReturnModal(false);
                setMessage(result.message || "Failed to complete the return.");
                setMessageType("error");
                return;
            }

            setSelectedOrder(result.data);
            setShowCompleteReturnModal(false);
            setOrderStatus(result.data.orderStatus || "returned");
            setReturnNote(result.data.returnRequest?.adminNote || "");
            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order._id === result.data._id ? result.data : order
                )
            );

            setMessage(
                result.data.paymentMethod === "razorpay" && result.data.refundStatus === "completed"
                    ? "Return completed. The eligible refund has been credited to the customer's AquaCart wallet."
                    : "Return completed successfully."
            );
            setMessageType("success");
        } catch (error) {
            console.error(error);
            setShowCompleteReturnModal(false);
            setMessage(error.message || "Something went wrong while completing the return.");
            setMessageType("error");
        } finally {
            setReturnCompleteLoading(false);
        }
    }

    function getStatusClass(orderStatus) {
        const classes = {
            pending: "bg-yellow-50 text-yellow-700",
            confirmed: "bg-blue-50 text-blue-700",
            processing: "bg-sky-50 text-sky-700",
            shipped: "bg-indigo-50 text-indigo-700",
            delivered: "bg-green-50 text-green-700",
            cancelled: "bg-red-50 text-red-700",
            returned: "bg-slate-100 text-slate-600",
        };

        return classes[orderStatus] || "bg-slate-100 text-slate-600";
    }

    function getReturnStatusClass(status) {
        const classes = {
            pending: "bg-amber-50 text-amber-700",
            approved: "bg-green-50 text-green-700",
            rejected: "bg-red-50 text-red-700",
            completed: "bg-slate-100 text-slate-600",
            not_requested: "bg-slate-100 text-slate-500",
        };

        return classes[status] || classes.not_requested;
    }

    function getStatusLabel(status) {
        if (!status) {
            return "Unknown";
        }

        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    function getReturnStatusLabel(status) {
        if (!status || status === "not_requested") {
            return "No request";
        }

        if (status === "pending") {
            return "Pending review";
        }

        if (status === "approved") {
            return "Approved";
        }

        if (status === "rejected") {
            return "Rejected";
        }

        if (status === "completed") {
            return "Completed";
        }

        return getStatusLabel(status);
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
            words[0].charAt(0) + words[words.length - 1].charAt(0)
        ).toUpperCase();
    }

    function getPlacedDate(date) {
        if (!date) {
            return "Unknown date";
        }

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    function getRefundNotice(order) {
        if (!order?.refundStatus || order.refundStatus === "not_applicable") {
            return "";
        }

        const amount = `₹${Number(order.refundAmount || 0).toFixed(2)}`;

        if (order.refundStatus === "pending") {
            return `Refund of ${amount} is pending processing.`;
        }

        if (order.refundStatus === "processing") {
            return `Refund of ${amount} is currently being processed.`;
        }

        if (order.refundStatus === "completed") {
            return `Refund of ${amount} has been completed.`;
        }

        if (order.refundStatus === "failed") {
            return `Refund of ${amount} could not be completed. Please review the payment separately.`;
        }

        return "";
    }

    const filteredOrders = orders.filter((order) => {
        const searchText = search.toLowerCase().trim();
        const orderId = order._id?.toLowerCase() || "";
        const customerName = order.user?.name?.toLowerCase() || "";
        const customerPhone = order.user?.phone
            ? String(order.user.phone).toLowerCase()
            : "";

        const matchesSearch =
            orderId.includes(searchText) ||
            customerName.includes(searchText) ||
            customerPhone.includes(searchText);

        let matchesStatus = true;

        if (statusFilter === "Return Requests") {
            matchesStatus = order.returnRequest?.status === "pending";
        } else if (statusFilter !== "All Orders") {
            matchesStatus = order.orderStatus === statusFilter.toLowerCase();
        }

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);

    useEffect(() => {
        const validTotalPages = Math.max(1, totalPages);

        if (currentPage > validTotalPages) {
            setCurrentPage(validTotalPages);
        }
    }, [currentPage, totalPages]);

    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const paginatedOrders = filteredOrders.slice(
        startIndex,
        startIndex + ORDERS_PER_PAGE
    );

    const firstDisplayedOrder =
        filteredOrders.length === 0 ? 0 : startIndex + 1;

    const lastDisplayedOrder = Math.min(
        startIndex + ORDERS_PER_PAGE,
        filteredOrders.length
    );

    function handlePageChange(page) {
        if (page < 1 || page > Math.max(1, totalPages)) {
            return;
        }

        setCurrentPage(page);
    }

    const returnStatus = selectedOrder?.returnRequest?.status;
    const hasPendingReturn = returnStatus === "pending";
    const refundNotice = getRefundNotice(selectedOrder);

    return (
        <AdminLayout pageTitle="Orders">
            <div className="space-y-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Orders
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Track customer orders, fulfillment status, cancellations,
                            and return requests.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                        <div className="relative w-full sm:w-80">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔍
                            </span>
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search by Order ID, customer name, phone..."
                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-48"
                        >
                            <option value="All Orders">All Orders</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="returned">Returned</option>
                            <option value="Return Requests">Return Requests</option>
                        </select>
                    </div>
                </div>

                {message && (
                    <div
                        role="alert"
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            messageType === "error"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-700"
                        }`}
                    >
                        {message}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    {[
                                        "Order ID",
                                        "Customer",
                                        "Date",
                                        "Total",
                                        "Payment",
                                        "Status",
                                        "Return",
                                        "Action",
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                                                heading === "Action" ? "text-right" : ""
                                            }`}
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-sm text-slate-500">
                                            Loading orders...
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-sm text-slate-500">
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-sm text-slate-500">
                                            No orders match your search or filter.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map((order) => {
                                        const currentReturnStatus =
                                            order.returnRequest?.status || "not_requested";

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
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-600">
                                                            {getCustomerInitials(order.user?.name)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">
                                                                {order.user?.name || "Unknown Customer"}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-400">
                                                                {order.user?.phone || "No phone"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    {getPlacedDate(order.createdAt)}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        ₹{Number(order.totalAmount || 0).toFixed(2)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {order.paymentMethod === "cod" ? "COD" : "Razorpay"}
                                                    </p>
                                                    <p className="mt-1 text-xs capitalize text-slate-400">
                                                        {order.paymentStatus || "pending"}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                            order.orderStatus
                                                        )}`}
                                                    >
                                                        {getStatusLabel(order.orderStatus)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getReturnStatusClass(
                                                            currentReturnStatus
                                                        )}`}
                                                    >
                                                        {getReturnStatusLabel(currentReturnStatus)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDetails(order._id)}
                                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
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

                    {!loading && filteredOrders.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Showing {firstDisplayedOrder}–{lastDisplayedOrder} of {filteredOrders.length} orders
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                                    {currentPage} / {Math.max(1, totalPages)}
                                </span>

                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showOrderModal && selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
                    onClick={closeOrderModal}
                >
                    <div
                        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
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
                                        {getStatusLabel(selectedOrder.orderStatus)}
                                    </span>

                                    {hasPendingReturn && (
                                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                            Return review required
                                        </span>
                                    )}
                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Placed on {getPlacedDate(selectedOrder.createdAt)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeOrderModal}
                                aria-label="Close order details"
                                className="ml-4 rounded-lg px-3 py-2 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto">
                            <div className="space-y-6 px-6 py-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Customer
                                        </p>

                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600">
                                                {getCustomerInitials(selectedOrder.user?.name)}
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
                                                {selectedOrder.shippingAddress?.city || "N/A"}, {selectedOrder.shippingAddress?.state || "N/A"} - {selectedOrder.shippingAddress?.pincode || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 pt-6">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        ITEMS ORDERED
                                    </h3>

                                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                                        {selectedOrder.orderItems?.map((item, index) => (
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
                                                        ₹{Number(item.price || 0).toFixed(2)}
                                                    </strong>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Qty: <span className="font-semibold text-slate-700">{item.quantity}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-6 border-t border-slate-200 pt-6 md:grid-cols-2">
                                    <div className="space-y-5">
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                PAYMENT METHOD
                                            </span>
                                            <strong className="mt-2 block text-sm font-semibold text-slate-800">
                                                💳 {selectedOrder.paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Razorpay"}
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
                                            <span className="text-sm text-slate-500">Subtotal</span>
                                            <strong className="text-sm font-semibold text-slate-800">
                                                ₹{Number(selectedOrder.totalAmount || 0).toFixed(2)}
                                            </strong>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm text-slate-500">Shipping Fee</span>
                                            <strong className="text-sm font-semibold text-green-600">FREE</strong>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-sm text-slate-500">Estimated Tax</span>
                                            <strong className="text-sm font-semibold text-slate-800">Included</strong>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                                            <span className="text-sm font-bold text-slate-700">Total Amount</span>
                                            <strong className="text-xl font-bold text-slate-900">
                                                ₹{Number(selectedOrder.totalAmount || 0).toFixed(2)}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                {refundNotice && (
                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                        <p className="text-sm font-semibold text-amber-800">Refund Notice</p>
                                        <p className="mt-1 text-sm text-amber-700">{refundNotice}</p>
                                    </div>
                                )}

                                {selectedOrder.cancellationReason && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                        <p className="text-sm font-semibold text-red-800">Cancellation Information</p>
                                        <p className="mt-1 text-sm text-red-700">
                                            Reason: {selectedOrder.cancellationReason}
                                        </p>
                                        {selectedOrder.cancelledAt && (
                                            <p className="mt-1 text-xs text-red-600">
                                                Cancelled: {getPlacedDate(selectedOrder.cancelledAt)}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="rounded-xl border border-slate-200 bg-white">
                                    <div className="border-b border-slate-200 px-5 py-4">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Return Request
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Review the customer's return request and record an admin decision.
                                                </p>
                                            </div>

                                            <span
                                                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getReturnStatusClass(
                                                    returnStatus || "not_requested"
                                                )}`}
                                            >
                                                {getReturnStatusLabel(returnStatus || "not_requested")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 px-5 py-5">
                                        {selectedOrder.returnRequest?.reason ? (
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Customer Reason
                                                </p>
                                                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                                    {selectedOrder.returnRequest.reason}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500">
                                                No return request has been submitted for this order.
                                            </p>
                                        )}

                                        {selectedOrder.returnRequest?.details && (
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Customer Details
                                                </p>
                                                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                                                    {selectedOrder.returnRequest.details}
                                                </p>
                                            </div>
                                        )}

                                        {selectedOrder.returnRequest?.requestedAt && (
                                            <p className="text-xs text-slate-400">
                                                Requested: {getPlacedDate(selectedOrder.returnRequest.requestedAt)}
                                            </p>
                                        )}

                                        {selectedOrder.returnRequest?.reviewedAt && (
                                            <p className="text-xs text-slate-400">
                                                Reviewed: {getPlacedDate(selectedOrder.returnRequest.reviewedAt)}
                                            </p>
                                        )}

                                        {selectedOrder.returnRequest?.adminNote && (
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                    Previous Admin Note
                                                </p>
                                                <p className="mt-2 text-sm text-slate-700">
                                                    {selectedOrder.returnRequest.adminNote}
                                                </p>
                                            </div>
                                        )}

                                        {hasPendingReturn && (
                                            <div className="space-y-3 border-t border-slate-200 pt-4">
                                                <div>
                                                    <label
                                                        htmlFor="return-admin-note"
                                                        className="text-sm font-semibold text-slate-700"
                                                    >
                                                        Admin Note
                                                    </label>
                                                    <textarea
                                                        id="return-admin-note"
                                                        value={returnNote}
                                                        onChange={(event) => setReturnNote(event.target.value)}
                                                        maxLength={1000}
                                                        rows={4}
                                                        placeholder="Add an internal note for this return decision..."
                                                        className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                                    />
                                                    <p className="mt-1 text-right text-xs text-slate-400">
                                                        {returnNote.length}/1000
                                                    </p>
                                                </div>

                                                <div className="flex flex-col gap-3 sm:flex-row">
                                                    <button
                                                        type="button"
                                                        onClick={() => openReturnReview("rejected")}
                                                        disabled={returnActionLoading}
                                                        className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Reject Return
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReturnReview("approved")}
                                                        disabled={returnActionLoading}
                                                        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Approve Return
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {returnStatus === "approved" && (
                                            <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
                                                <p className="text-sm leading-6 text-green-800">
                                                    Return approved. After the returned goods have been received and checked, complete the return below. For an eligible Razorpay-paid order, completion credits the refund to the customer's AquaCart wallet.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleCompleteReturn}
                                                    disabled={returnCompleteLoading || returnActionLoading}
                                                    className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {returnCompleteLoading ? "Completing return…" : "Confirm Goods Received & Complete Return"}
                                                </button>
                                            </div>
                                        )}

                                        {returnStatus === "completed" && (
                                            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                                <p>
                                                    Return completed. Refund status: {selectedOrder.refundStatus || "not applicable"}.
                                                    {selectedOrder.refundStatus === "completed" && " Wallet credit is recorded as completed; use the recovery action below if the customer's wallet history still does not show it."}
                                                </p>
                                                {selectedOrder.paymentMethod === "razorpay" && (
                                                    <button
                                                        type="button"
                                                        onClick={handleCompleteReturn}
                                                        disabled={returnCompleteLoading || returnActionLoading}
                                                        className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Verify / Repair Wallet Credit
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {returnStatus === "rejected" && (
                                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                Return request rejected. The customer can see the review result and admin note.
                                            </div>
                                        )}
                                    </div>
                                </div>

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
                                                <option value="pending">Pending</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                                <option value="returned">Returned</option>
                                            </select>
                                        </div>

                                        <span className="text-xs text-slate-500">
                                            Current status: <span className="font-semibold text-slate-700">{getStatusLabel(orderStatus)}</span>
                                        </span>
                                    </div>
                                </div>

                                {message && (
                                    <div
                                        role="alert"
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
                                    onClick={() => window.print()}
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

            {showCompleteReturnModal && selectedOrder && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={() => !returnCompleteLoading && setShowCompleteReturnModal(false)}
                    role="presentation"
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="complete-return-title"
                        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700" aria-hidden="true">✓</div>
                            <div className="min-w-0 flex-1">
                                <h2 id="complete-return-title" className="text-lg font-bold text-slate-900">{selectedOrder.returnRequest?.status === "completed" ? "Verify wallet refund?" : "Confirm returned goods received?"}</h2>
                                <p className="mt-1 break-all text-sm text-slate-500">Order #{selectedOrder._id}</p>
                            </div>
                            <button type="button" onClick={() => setShowCompleteReturnModal(false)} disabled={returnCompleteLoading} aria-label="Close confirmation" className="rounded-lg px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">×</button>
                        </div>
                        <div className="space-y-4 px-6 py-5">
                            <p className="text-sm leading-6 text-slate-600">{selectedOrder.returnRequest?.status === "completed" ? "This recovery check will verify the wallet ledger for this already-completed return and credit the eligible refund only if its unique refund transaction is missing. It will not restore stock again." : "Confirm only after the returned goods have been received and checked. Completing this return will restore the returned items to stock and credit an eligible Razorpay-paid refund to the customer’s AquaCart wallet."}</p>
                            {selectedOrder.paymentMethod === "razorpay" && (
                                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                                    <p className="text-sm font-semibold text-sky-900">Wallet refund</p>
                                    <p className="mt-1 text-sm leading-5 text-sky-800">If this order was successfully paid and has not already been refunded to the wallet, the eligible refund will be credited once. The customer can see it in their profile wallet.</p>
                                </div>
                            )}
                            {selectedOrder.returnRequest?.status !== "completed" && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><strong>Important:</strong> This action updates the order and inventory. Do not continue until the returned goods are physically received.</div>
                            )}
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setShowCompleteReturnModal(false)} disabled={returnCompleteLoading} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">Not yet</button>
                            <button type="button" onClick={confirmCompleteReturn} disabled={returnCompleteLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                                {returnCompleteLoading ? "Processing…" : selectedOrder.returnRequest?.status === "completed" ? "Verify / Repair Wallet Credit" : "Confirm & Complete Return"}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {showReturnConfirmModal && selectedOrder && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
                    onClick={closeReturnConfirmModal}
                >
                    <div
                        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="border-b border-slate-200 px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        {returnDecision === "approved"
                                            ? "Approve Return Request?"
                                            : "Reject Return Request?"}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Order #{selectedOrder._id.slice(0, 8)}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeReturnConfirmModal}
                                    disabled={returnActionLoading}
                                    className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 px-6 py-6">
                            <div
                                className={`rounded-lg border p-4 ${
                                    returnDecision === "approved"
                                        ? "border-green-200 bg-green-50"
                                        : "border-red-200 bg-red-50"
                                }`}
                            >
                                <p
                                    className={`text-sm font-semibold ${
                                        returnDecision === "approved"
                                            ? "text-green-800"
                                            : "text-red-800"
                                    }`}
                                >
                                    {returnDecision === "approved"
                                        ? "The customer’s return request will be marked approved."
                                        : "The customer’s return request will be marked rejected."}
                                </p>
                                <p
                                    className={`mt-1 text-sm ${
                                        returnDecision === "approved"
                                            ? "text-green-700"
                                            : "text-red-700"
                                    }`}
                                >
                                    This action records the admin decision. It does not automatically issue a Razorpay refund or complete the return.
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Admin Note
                                </p>
                                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                    {returnNote.trim() || "No admin note will be saved."}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeReturnConfirmModal}
                                disabled={returnActionLoading}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Go Back
                            </button>

                            <button
                                type="button"
                                onClick={handleReviewReturn}
                                disabled={returnActionLoading}
                                className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                                    returnDecision === "approved"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                {returnActionLoading
                                    ? "Saving..."
                                    : returnDecision === "approved"
                                    ? "Confirm Approval"
                                    : "Confirm Rejection"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default Orders;
