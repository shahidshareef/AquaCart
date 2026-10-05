import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

function Inventory() {

    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [editingVariantId, setEditingVariantId] = useState(null);
    const [editingStock, setEditingStock] = useState("");
    const [savingStock, setSavingStock] = useState(false);

    const [stockFilter, setStockFilter] = useState("All");

    useEffect(function () {
        async function getInventory() {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/admin/inventory"
                );

                const data = await response.json();

                if (!response.ok) {
                    setMessage(
                        data.message || "Failed to fetch inventory."
                    );
                    setMessageType("error");
                    return;
                }

                setInventory(data.data);
            } catch (error) {
                console.log(error);

                setMessage(
                    "Something went wrong while loading inventory."
                );
                setMessageType("error");
            } finally {
                setLoading(false);
            }
        }

        getInventory();
    }, []);

    function getStockStatus(stock) {
        if (stock === 0) {
            return {
                text: "Out of Stock",
                className: "bg-red-50 text-red-700"
            };
        }

        if (stock <= 5) {
            return {
                text: "Low Stock",
                className: "bg-yellow-50 text-yellow-700"
            };
        }

        return {
            text: "In Stock",
            className: "bg-green-50 text-green-700"
        };
    }

    function handleStartEdit(variant) {
        setEditingVariantId(variant._id);
        setEditingStock(String(variant.stock));
        setMessage("");
    }

    function handleCancelEdit() {
        setEditingVariantId(null);
        setEditingStock("");
    }

    async function handleUpdateStock(variantId) {

        if (savingStock) {
            return;
        }

        if (editingStock === "" || Number(editingStock) < 0) {
            setMessage("Stock must be 0 or greater.");
            setMessageType("error");
            return;
        }

        setSavingStock(true);
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:5000/api/admin/inventory/${variantId}/stock`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        stock: Number(editingStock)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message || "Failed to update stock."
                );
                setMessageType("error");
                return;
            }

            setInventory(function (currentInventory) {
                return currentInventory.map(function (variant) {
                    if (variant._id === variantId) {
                        return data.data;
                    }

                    return variant;
                });
            });

            setEditingVariantId(null);
            setEditingStock("");

            setMessage("Inventory stock updated successfully.");
            setMessageType("success");

        } catch (error) {
            console.log(error);

            setMessage(
                "Something went wrong while updating stock."
            );
            setMessageType("error");
        } finally {
            setSavingStock(false);
        }
    }

    const filteredInventory = inventory.filter(function (variant) {

        if (stockFilter === "All") {
            return true;
        }

        if (stockFilter === "Out of Stock") {
            return variant.stock === 0;
        }

        if (stockFilter === "Low Stock") {
            return variant.stock > 0 && variant.stock <= 5;
        }

        if (stockFilter === "In Stock") {
            return variant.stock > 5;
        }

        return true;
    });

    return (
        <AdminLayout pageTitle="Inventory">
            <div className="space-y-6">

                {/* Page Header */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                        Inventory
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor stock levels, SKUs, and product variants.
                    </p>
                </div>

                {/* Stock Filter */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <label
                            htmlFor="stockFilter"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Stock Status
                        </label>

                        <select
                            id="stockFilter"
                            value={stockFilter}
                            onChange={function (event) {
                                setStockFilter(event.target.value);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-56"
                        >
                            <option value="All">
                                All Stock Statuses
                            </option>

                            <option value="In Stock">
                                In Stock
                            </option>

                            <option value="Low Stock">
                                Low Stock
                            </option>

                            <option value="Out of Stock">
                                Out of Stock
                            </option>
                        </select>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`rounded-lg border px-4 py-3 text-sm ${messageType === "error"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-700"
                            }`}
                    >
                        {message}
                    </div>
                )}

                {/* Inventory Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">

                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Product
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Variant
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        SKU
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Price
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Stock
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
                                            Loading inventory...
                                        </td>
                                    </tr>
                                ) : inventory.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-10 text-center text-sm text-slate-500"
                                        >
                                            No inventory items found.
                                        </td>
                                    </tr>
                                ) : filteredInventory.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-10 text-center text-sm text-slate-500"
                                        >
                                            No inventory items match this stock status.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInventory.map(function (variant) {

                                        const stockStatus =
                                            getStockStatus(variant.stock);

                                        return (
                                            <tr
                                                key={variant._id}
                                                className="border-b border-slate-100 last:border-b-0"
                                            >

                                                {/* Product */}
                                                <td className="px-6 py-5 text-sm font-semibold text-slate-800">
                                                    {variant.product?.name || "Unknown Product"}
                                                </td>

                                                {/* Variant */}
                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    {variant.size}
                                                </td>

                                                {/* SKU */}
                                                <td className="px-6 py-5 text-sm font-medium text-slate-700">
                                                    {variant.sku}
                                                </td>

                                                {/* Price */}
                                                <td className="px-6 py-5 text-sm text-slate-700">
                                                    ₹{variant.price}
                                                </td>

                                                {/* Stock */}
                                                <td className="px-6 py-5">

                                                    {editingVariantId === variant._id ? (
                                                        <div className="flex items-center gap-2">

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={editingStock}
                                                                onChange={function (event) {
                                                                    setEditingStock(
                                                                        event.target.value
                                                                    );
                                                                }}
                                                                className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                                            />

                                                            <span className="text-xs text-slate-500">
                                                                units
                                                            </span>

                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-slate-800">
                                                            {variant.stock}
                                                        </span>
                                                    )}

                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${stockStatus.className}`}
                                                    >
                                                        {stockStatus.text}
                                                    </span>
                                                </td>

                                                {/* Action */}
                                                <td className="px-6 py-5 text-right">

                                                    {editingVariantId === variant._id ? (
                                                        <div className="flex items-center justify-end gap-2">

                                                            <button
                                                                type="button"
                                                                onClick={function () {
                                                                    handleUpdateStock(
                                                                        variant._id
                                                                    );
                                                                }}
                                                                disabled={savingStock}
                                                                className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {savingStock
                                                                    ? "Saving..."
                                                                    : "Save"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={handleCancelEdit}
                                                                disabled={savingStock}
                                                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                Cancel
                                                            </button>

                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={function () {
                                                                handleStartEdit(
                                                                    variant
                                                                );
                                                            }}
                                                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50"
                                                        >
                                                            Update Stock
                                                        </button>
                                                    )}

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

export default Inventory;