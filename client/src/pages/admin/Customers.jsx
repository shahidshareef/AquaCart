import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [currentPage, setCurrentPage] = useState(1);

    const customersPerPage = 6;

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    useEffect(function () {
        fetchCustomers();
    }, []);

    async function fetchCustomers() {
        try {
            setMessage("");
            setMessageType("");

            const response = await fetch(
                "http://localhost:5000/api/admin/customers"
            );

            const result = await response.json();

            if (!response.ok) {
                setMessage(
                    result.message || "Failed to fetch customers."
                );
                setMessageType("error");
                return;
            }

            setCustomers(result.data);
            setCurrentPage(1);

        } catch (error) {
            console.log(error);

            setMessage(
                "Something went wrong while fetching customers."
            );
            setMessageType("error");
        }
    }

    async function handleViewCustomer(customerId) {
        try {
            setMessage("");
            setMessageType("");

            const response = await fetch(
                `http://localhost:5000/api/admin/customers/${customerId}`
            );

            const result = await response.json();

            if (!response.ok) {
                setMessage(
                    result.message || "Failed to fetch customer."
                );
                setMessageType("error");
                return;
            }

            setSelectedCustomer(result.data);
            setShowCustomerModal(true);

        } catch (error) {
            console.log(error);

            setMessage(
                "Something went wrong while fetching the customer."
            );
            setMessageType("error");
        }
    }

    function closeCustomerModal() {
        setShowCustomerModal(false);
        setSelectedCustomer(null);
        setShowStatusConfirmation(false);
    }

    function handleStatusAction() {
        setShowStatusConfirmation(true);
    }

    async function handleUpdateCustomerStatus() {
        if (!selectedCustomer) {
            return;
        }

        const newStatus =
            selectedCustomer.status === "active"
                ? "blocked"
                : "active";

        try {
            setStatusUpdating(true);
            setMessage("");
            setMessageType("");

            const response = await fetch(
                `http://localhost:5000/api/admin/customers/${selectedCustomer._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                setMessage(
                    result.message ||
                    "Failed to update customer status."
                );
                setMessageType("error");
                setStatusUpdating(false);
                return;
            }

            setSelectedCustomer(result.data);

            setCustomers(function (currentCustomers) {
                return currentCustomers.map(function (customer) {

                    if (customer._id === result.data._id) {
                        return result.data;
                    }

                    return customer;
                });
            });

            setShowStatusConfirmation(false);

            setMessage(
                newStatus === "blocked"
                    ? "Customer blocked successfully."
                    : "Customer unblocked successfully."
            );
            setMessageType("success");

        } catch (error) {
            console.log(error);

            setMessage(
                "Something went wrong while updating customer status."
            );
            setMessageType("error");

        } finally {
            setStatusUpdating(false);
        }
    }

    const filteredCustomers = customers.filter(function (customer) {

        const searchText = search.toLowerCase();

        const matchesSearch =
            customer.name.toLowerCase().includes(searchText) ||
            customer.email.toLowerCase().includes(searchText) ||
            customer.phone.toLowerCase().includes(searchText);

        const matchesStatus =
            statusFilter === "all" ||
            customer.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    /*
     * Pagination
     */

    const totalPages = Math.ceil(
        filteredCustomers.length / customersPerPage
    );

    const startIndex =
        (currentPage - 1) * customersPerPage;

    const endIndex =
        startIndex + customersPerPage;

    const currentCustomers =
        filteredCustomers.slice(startIndex, endIndex);

    function handleSearchChange(event) {
        setSearch(event.target.value);
        setCurrentPage(1);
    }

    function handleStatusFilterChange(event) {
        setStatusFilter(event.target.value);
        setCurrentPage(1);
    }

    function handlePreviousPage() {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    }

    function handleNextPage() {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    }

    function handlePageChange(page) {
        setCurrentPage(page);
    }

    function getStatusClass(status) {
        if (status === "active") {
            return "bg-green-50 text-green-700";
        }

        if (status === "blocked") {
            return "bg-red-50 text-red-700";
        }

        return "bg-gray-50 text-gray-700";
    }

    function getStatusDotClass(status) {
        if (status === "active") {
            return "bg-green-500";
        }

        if (status === "blocked") {
            return "bg-red-500";
        }

        return "bg-gray-500";
    }

    function getCustomerInitials(name) {
        if (!name) {
            return "?";
        }

        const nameParts = name.trim().split(" ");

        if (nameParts.length === 1) {
            return nameParts[0].charAt(0).toUpperCase();
        }

        return (
            nameParts[0].charAt(0) +
            nameParts[nameParts.length - 1].charAt(0)
        ).toUpperCase();
    }

    function getCreatedDate(date) {
        if (!date) {
            return "N/A";
        }

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    return (
        <AdminLayout pageTitle="Customers">

            <div className="space-y-6">

                {/* Workspace Header */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Customers
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        View registered customers and manage account access.
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={
                            messageType === "success"
                                ? "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                                : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        }
                    >
                        {message}
                    </div>
                )}

                {/* Search & Filter */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div className="relative w-full sm:max-w-xl">

                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            🔍
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Search by name, email, or phone..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />

                    </div>

                    <select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                        <option value="all">
                            All Customers
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="blocked">
                            Blocked
                        </option>
                    </select>

                </div>

                {/* Customer Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                    <div className="overflow-x-auto">

                        <table className="min-w-full">

                            <thead className="border-b border-slate-200 bg-slate-50">

                                <tr>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Name
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Email
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Phone
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {currentCustomers.map(function (customer) {

                                    return (
                                        <tr
                                            key={customer._id}
                                            className="hover:bg-slate-50"
                                        >

                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    {customer.name}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {customer.email}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {customer.phone}
                                            </td>

                                            <td className="px-6 py-4">

                                                <span
                                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(customer.status)}`}
                                                >

                                                    <span
                                                        className={`h-2 w-2 rounded-full ${getStatusDotClass(customer.status)}`}
                                                    />

                                                    {customer.status === "active"
                                                        ? "Active"
                                                        : "Blocked"}

                                                </span>

                                            </td>

                                            <td className="px-6 py-4 text-right">

                                                <button
                                                    type="button"
                                                    onClick={function () {
                                                        handleViewCustomer(
                                                            customer._id
                                                        );
                                                    }}
                                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>
                                    );

                                })}

                                {currentCustomers.length === 0 && (
                                    <tr>

                                        <td
                                            colSpan="5"
                                            className="px-6 py-10 text-center text-sm text-slate-500"
                                        >
                                            No customers found.
                                        </td>

                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* Footer / Pagination */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-sm text-slate-500">

                            {filteredCustomers.length === 0
                                ? "Showing 0 of 0 customers"
                                : `Showing ${startIndex + 1}-${Math.min(
                                    endIndex,
                                    filteredCustomers.length
                                )} of ${filteredCustomers.length} customers`}

                        </p>

                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                                Previous
                            </button>

                            {Array.from(
                                { length: totalPages },
                                function (_, index) {
                                    const page = index + 1;

                                    return (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={function () {
                                                handlePageChange(page);
                                            }}
                                            className={
                                                currentPage === page
                                                    ? "rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                                                    : "rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
                                            }
                                        >
                                            {page}
                                        </button>
                                    );
                                }
                            )}

                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={
                                    currentPage === totalPages ||
                                    totalPages === 0
                                }
                                className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                            >
                                Next
                            </button>

                        </div>

                    </div>

                </div>

            </div>

            {/* Customer Details Modal */}
            {showCustomerModal && selectedCustomer && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
                    onClick={closeCustomerModal}
                >

                    <div
                        className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
                        onClick={function (event) {
                            event.stopPropagation();
                        }}
                    >

                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

                            <div className="flex items-center gap-4">

                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-600">
                                    {getCustomerInitials(
                                        selectedCustomer.name
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Customer Details
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {selectedCustomer.name}
                                    </p>
                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={closeCustomerModal}
                                className="rounded-lg px-2 py-1 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                ×
                            </button>

                        </div>

                        {/* Customer Information */}
                        <div className="space-y-6 px-6 py-6">

                            {/* Status */}
                            <div className="rounded-lg bg-slate-50 px-4 py-4">

                                <div className="flex items-center justify-between">

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Account Status
                                        </p>

                                        <p className="mt-1 text-sm text-slate-700">
                                            Current customer account status
                                        </p>
                                    </div>

                                    <span
                                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(selectedCustomer.status)}`}
                                    >
                                        <span
                                            className={`h-2 w-2 rounded-full ${getStatusDotClass(selectedCustomer.status)}`}
                                        />

                                        {selectedCustomer.status === "active"
                                            ? "Active"
                                            : "Blocked"}
                                    </span>

                                </div>

                                <div className="mt-4 border-t border-slate-200 pt-4">

                                    <button
                                        type="button"
                                        onClick={handleStatusAction}
                                        className={
                                            selectedCustomer.status === "active"
                                                ? "rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                                : "rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50"
                                        }
                                    >
                                        {selectedCustomer.status === "active"
                                            ? "Block Customer"
                                            : "Unblock Customer"}
                                    </button>

                                </div>

                            </div>

                            {/* Status Confirmation */}
                            {showStatusConfirmation && (
                                <div className="rounded-lg border border-slate-200 bg-white p-4">

                                    <p className="text-sm font-semibold text-slate-900">
                                        {selectedCustomer.status === "active"
                                            ? "Block this customer?"
                                            : "Unblock this customer?"}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {selectedCustomer.status === "active"
                                            ? "This will prevent the customer from accessing their account."
                                            : "This will restore the customer's account access."}
                                    </p>

                                    <div className="mt-4 flex justify-end gap-2">

                                        <button
                                            type="button"
                                            onClick={function () {
                                                setShowStatusConfirmation(false);
                                            }}
                                            disabled={statusUpdating}
                                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleUpdateCustomerStatus}
                                            disabled={statusUpdating}
                                            className={
                                                selectedCustomer.status === "active"
                                                    ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    : "rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            }
                                        >
                                            {statusUpdating
                                                ? "Updating..."
                                                : selectedCustomer.status === "active"
                                                    ? "Yes, Block"
                                                    : "Yes, Unblock"}
                                        </button>

                                    </div>

                                </div>
                            )}

                            {/* Customer Information */}
                            <div>

                                <h4 className="mb-4 text-sm font-semibold text-slate-900">
                                    Customer Information
                                </h4>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Full Name
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {selectedCustomer.name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Email
                                        </p>

                                        <p className="mt-1 break-all text-sm font-medium text-slate-800">
                                            {selectedCustomer.email}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Phone
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {selectedCustomer.phone}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                            Registered On
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {getCreatedDate(
                                                selectedCustomer.createdAt
                                            )}
                                        </p>
                                    </div>

                                </div>

                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={closeCustomerModal}
                                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </AdminLayout>
    );
}

export default Customers;