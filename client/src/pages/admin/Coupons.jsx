import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

function Coupons() {

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingCouponId, setEditingCouponId] = useState(null);
    const [savingCoupon, setSavingCoupon] = useState(false);

    const [deleteCouponId, setDeleteCouponId] = useState(null);
    const [deletingCoupon, setDeletingCoupon] = useState(false);

    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [discountType, setDiscountType] = useState("percentage");
    const [discountValue, setDiscountValue] = useState("");
    const [minimumOrderAmount, setMinimumOrderAmount] = useState("");
    const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [usageLimit, setUsageLimit] = useState("");
    const [status, setStatus] = useState("active");

    useEffect(function () {
        async function getCoupons() {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/admin/coupons"
                );

                const data = await response.json();

                if (!response.ok) {
                    setMessage(
                        data.message || "Failed to fetch coupons."
                    );
                    setMessageType("error");
                    return;
                }

                setCoupons(data.data);
            } catch (error) {
                console.log(error);

                setMessage(
                    "Something went wrong while loading coupons."
                );
                setMessageType("error");
            } finally {
                setLoading(false);
            }
        }

        getCoupons();
    }, []);

    function resetForm() {
        setCode("");
        setDescription("");
        setDiscountType("percentage");
        setDiscountValue("");
        setMinimumOrderAmount("");
        setMaxDiscountAmount("");
        setStartDate("");
        setEndDate("");
        setUsageLimit("");
        setStatus("active");
    }

    function handleOpenAddForm() {
        setMessage("");
        setEditingCouponId(null);
        resetForm();
        setShowForm(true);
    }

    function handleEditCoupon(coupon) {
        setMessage("");

        setEditingCouponId(coupon._id);

        setCode(coupon.code || "");
        setDescription(coupon.description || "");
        setDiscountType(coupon.discountType || "percentage");

        setDiscountValue(
            coupon.discountValue !== undefined
                ? String(coupon.discountValue)
                : ""
        );

        setMinimumOrderAmount(
            coupon.minimumOrderAmount !== undefined
                ? String(coupon.minimumOrderAmount)
                : ""
        );

        setMaxDiscountAmount(
            coupon.maxDiscountAmount !== undefined
                ? String(coupon.maxDiscountAmount)
                : ""
        );

        setStartDate(
            coupon.startDate
                ? coupon.startDate.substring(0, 10)
                : ""
        );

        setEndDate(
            coupon.endDate
                ? coupon.endDate.substring(0, 10)
                : ""
        );

        setUsageLimit(
            coupon.usageLimit !== undefined
                ? String(coupon.usageLimit)
                : ""
        );

        setStatus(coupon.status || "active");

        setShowForm(true);
    }

    function handleCancelForm() {
        if (savingCoupon) {
            return;
        }

        setShowForm(false);
        setEditingCouponId(null);
        resetForm();
    }

    async function handleSaveCoupon(event) {

        event.preventDefault();

        if (savingCoupon) {
            return;
        }

        if (!code.trim()) {
            setMessage("Coupon code is required.");
            setMessageType("error");
            return;
        }

        if (!discountValue || Number(discountValue) < 0) {
            setMessage("Discount value must be 0 or greater.");
            setMessageType("error");
            return;
        }

        if (!startDate || !endDate) {
            setMessage("Start date and end date are required.");
            setMessageType("error");
            return;
        }

        if (new Date(endDate) < new Date(startDate)) {
            setMessage("End date cannot be before start date.");
            setMessageType("error");
            return;
        }

        setSavingCoupon(true);
        setMessage("");

        const couponData = {
            code: code.trim(),
            description: description.trim(),
            discountType,
            discountValue: Number(discountValue),

            minimumOrderAmount:
                minimumOrderAmount === ""
                    ? 0
                    : Number(minimumOrderAmount),

            maxDiscountAmount:
                maxDiscountAmount === ""
                    ? 0
                    : Number(maxDiscountAmount),

            startDate,
            endDate,

            usageLimit:
                usageLimit === ""
                    ? undefined
                    : Number(usageLimit),

            status
        };

        try {

            let response;

            if (editingCouponId) {

                response = await fetch(
                    `http://localhost:5000/api/admin/coupons/${editingCouponId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(couponData)
                    }
                );

            } else {

                response = await fetch(
                    "http://localhost:5000/api/admin/coupons",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(couponData)
                    }
                );
            }

            const data = await response.json();

            if (!response.ok) {

                setMessage(
                    data.message ||
                    (
                        editingCouponId
                            ? "Failed to update coupon."
                            : "Failed to create coupon."
                    )
                );

                setMessageType("error");
                return;
            }

            if (editingCouponId) {

                setCoupons(function (currentCoupons) {
                    return currentCoupons.map(function (coupon) {

                        if (coupon._id === editingCouponId) {
                            return data.data;
                        }

                        return coupon;
                    });
                });

                setMessage("Coupon updated successfully.");

            } else {

                setCoupons(function (currentCoupons) {
                    return [data.data, ...currentCoupons];
                });

                setMessage("Coupon created successfully.");
            }

            setMessageType("success");

            setShowForm(false);
            setEditingCouponId(null);
            resetForm();

        } catch (error) {

            console.log(error);

            setMessage(
                editingCouponId
                    ? "Something went wrong while updating the coupon."
                    : "Something went wrong while creating the coupon."
            );

            setMessageType("error");

        } finally {
            setSavingCoupon(false);
        }
    }

    function handleDeleteClick(couponId) {
        setMessage("");
        setDeleteCouponId(couponId);
    }

    function handleCancelDelete() {
        if (deletingCoupon) {
            return;
        }

        setDeleteCouponId(null);
    }

    async function handleConfirmDelete() {

        if (!deleteCouponId || deletingCoupon) {
            return;
        }

        setDeletingCoupon(true);
        setMessage("");

        try {

            const response = await fetch(
                `http://localhost:5000/api/admin/coupons/${deleteCouponId}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message || "Failed to delete coupon."
                );
                setMessageType("error");
                return;
            }

            setCoupons(function (currentCoupons) {
                return currentCoupons.filter(function (coupon) {
                    return coupon._id !== deleteCouponId;
                });
            });

            setDeleteCouponId(null);

            setMessage("Coupon deleted successfully.");
            setMessageType("success");

        } catch (error) {

            console.log(error);

            setMessage(
                "Something went wrong while deleting the coupon."
            );

            setMessageType("error");

        } finally {
            setDeletingCoupon(false);
        }
    }

    return (
        <AdminLayout pageTitle="Coupons & Offers">

            <div className="space-y-6">

                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Coupons & Offers
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage discount coupons and promotional offers.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenAddForm}
                        className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600"
                    >
                        + Add Coupon
                    </button>

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

                {/* Delete Confirmation */}
                {deleteCouponId && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <h3 className="text-sm font-semibold text-red-800">
                                    Delete Coupon?
                                </h3>

                                <p className="mt-1 text-sm text-red-700">
                                    Are you sure you want to delete this coupon?
                                    This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-3">

                                <button
                                    type="button"
                                    onClick={handleCancelDelete}
                                    disabled={deletingCoupon}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={deletingCoupon}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deletingCoupon
                                        ? "Deleting..."
                                        : "Delete Coupon"}
                                </button>

                            </div>

                        </div>

                    </div>
                )}

                {/* Add / Edit Form */}
                {showForm && (
                    <div className="rounded-xl border border-slate-200 bg-white p-6">

                        <div className="mb-6">

                            <h3 className="text-lg font-semibold text-slate-900">
                                {editingCouponId
                                    ? "Edit Coupon"
                                    : "Add New Coupon"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                {editingCouponId
                                    ? "Update the coupon details and save your changes."
                                    : "Create a discount coupon for AquaCart customers."}
                            </p>

                        </div>

                        <form
                            onSubmit={handleSaveCoupon}
                            className="space-y-5"
                        >

                            {/* Code + Description */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                <div>
                                    <label
                                        htmlFor="couponCode"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Coupon Code *
                                    </label>

                                    <input
                                        id="couponCode"
                                        type="text"
                                        value={code}
                                        onChange={function (event) {
                                            setCode(event.target.value);
                                        }}
                                        placeholder="WELCOME10"
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="couponDescription"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Description
                                    </label>

                                    <input
                                        id="couponDescription"
                                        type="text"
                                        value={description}
                                        onChange={function (event) {
                                            setDescription(event.target.value);
                                        }}
                                        placeholder="10% discount for new customers"
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                            </div>

                            {/* Discount */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                                <div>
                                    <label
                                        htmlFor="discountType"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Discount Type *
                                    </label>

                                    <select
                                        id="discountType"
                                        value={discountType}
                                        onChange={function (event) {
                                            setDiscountType(event.target.value);
                                        }}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="percentage">
                                            Percentage
                                        </option>

                                        <option value="fixed">
                                            Fixed Amount
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="discountValue"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Discount Value *
                                    </label>

                                    <input
                                        id="discountValue"
                                        type="number"
                                        min="0"
                                        value={discountValue}
                                        onChange={function (event) {
                                            setDiscountValue(event.target.value);
                                        }}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="minimumOrderAmount"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Minimum Order Amount
                                    </label>

                                    <input
                                        id="minimumOrderAmount"
                                        type="number"
                                        min="0"
                                        value={minimumOrderAmount}
                                        onChange={function (event) {
                                            setMinimumOrderAmount(event.target.value);
                                        }}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                            </div>

                            {/* Maximum Discount + Dates */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                                <div>
                                    <label
                                        htmlFor="maxDiscountAmount"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Maximum Discount Amount
                                    </label>

                                    <input
                                        id="maxDiscountAmount"
                                        type="number"
                                        min="0"
                                        value={maxDiscountAmount}
                                        onChange={function (event) {
                                            setMaxDiscountAmount(event.target.value);
                                        }}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="startDate"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Start Date *
                                    </label>

                                    <input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={function (event) {
                                            setStartDate(event.target.value);
                                        }}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="endDate"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        End Date *
                                    </label>

                                    <input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={function (event) {
                                            setEndDate(event.target.value);
                                        }}
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                </div>

                            </div>

                            {/* Usage + Status */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                <div>
                                    <label
                                        htmlFor="usageLimit"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Usage Limit
                                    </label>

                                    <input
                                        id="usageLimit"
                                        type="number"
                                        min="1"
                                        value={usageLimit}
                                        onChange={function (event) {
                                            setUsageLimit(event.target.value);
                                        }}
                                        placeholder="100"
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />

                                    <p className="mt-1 text-xs text-slate-500">
                                        Leave empty for unlimited usage.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="couponStatus"
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Status
                                    </label>

                                    <select
                                        id="couponStatus"
                                        value={status}
                                        onChange={function (event) {
                                            setStatus(event.target.value);
                                        }}
                                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="active">
                                            Active
                                        </option>

                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={handleCancelForm}
                                    disabled={savingCoupon}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingCoupon}
                                    className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingCoupon
                                        ? "Saving..."
                                        : editingCouponId
                                            ? "Save Changes"
                                            : "Save Coupon"}
                                </button>

                            </div>

                        </form>

                    </div>
                )}

                {/* Coupons Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px]">

                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Coupon
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Discount
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Minimum Order
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Validity
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Usage
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Actions
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
                                            Loading coupons...
                                        </td>
                                    </tr>
                                ) : coupons.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-10 text-center text-sm text-slate-500"
                                        >
                                            No coupons found.
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.map(function (coupon) {

                                        return (
                                            <tr
                                                key={coupon._id}
                                                className="border-b border-slate-100 last:border-b-0"
                                            >

                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {coupon.code}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {coupon.description || "No description"}
                                                    </p>
                                                </td>

                                                <td className="px-6 py-5 text-sm font-semibold text-slate-800">
                                                    {coupon.discountType === "percentage"
                                                        ? `${coupon.discountValue}%`
                                                        : `₹${coupon.discountValue}`}
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-700">
                                                    ₹{coupon.minimumOrderAmount || 0}
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    <div>
                                                        {new Date(coupon.startDate).toLocaleDateString()}
                                                    </div>

                                                    <div className="mt-1">
                                                        to {new Date(coupon.endDate).toLocaleDateString()}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-700">
                                                    {coupon.usedCount || 0}
                                                    {" / "}
                                                    {coupon.usageLimit || "Unlimited"}
                                                </td>

                                                <td className="px-6 py-5">

                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            coupon.status === "active"
                                                                ? "bg-green-50 text-green-700"
                                                                : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {coupon.status === "active"
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>

                                                </td>

                                                <td className="px-6 py-5 text-right">

                                                    <button
                                                        type="button"
                                                        onClick={function () {
                                                            handleEditCoupon(coupon);
                                                        }}
                                                        className="text-sm font-medium text-sky-600 hover:text-sky-700"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={function () {
                                                            handleDeleteClick(coupon._id);
                                                        }}
                                                        className="ml-4 text-sm font-medium text-red-600 hover:text-red-700"
                                                    >
                                                        Delete
                                                    </button>

                                                </td>

                                            </tr>
                                        );
                                    })
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </AdminLayout>
    );
}

export default Coupons;