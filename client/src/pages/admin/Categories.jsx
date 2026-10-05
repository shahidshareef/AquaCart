import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";

function Categories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);

    const [categoryName, setCategoryName] = useState("");
    const [description, setDescription] = useState("");

    const [status, setStatus] = useState("active");
    const [selectedIcon, setSelectedIcon] = useState("💧");

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const [showEditModal, setShowEditModal] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);

    const [editCategoryName, setEditCategoryName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editStatus, setEditStatus] = useState("active");

    const [editing, setEditing] = useState(false);
    const [editError, setEditError] = useState("");

    async function fetchCategories() {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                "http://localhost:5000/api/admin/categories"
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to fetch categories"
                );
            }

            setCategories(result.data);
        } catch (error) {
            console.error(error);
            setError("Failed to load categories");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCategories();
    }, []);

    function handleOpenAddModal() {
        setCategoryName("");
        setDescription("");
        setStatus("active");
        setSelectedIcon("💧");
        setSaveError("");
        setShowAddModal(true);
    }

    function handleCloseModal() {
        setShowAddModal(false);
        setCategoryName("");
        setDescription("");
        setStatus("active");
        setSelectedIcon("💧");
        setSaveError("");
    }

    function handleAddStatusChange(selectedStatus) {
        console.log("Add category status:", selectedStatus);
        setStatus(selectedStatus);
    }

    async function handleSaveCategory() {
        try {
            setSaving(true);
            setSaveError("");

            if (!categoryName.trim()) {
                setSaveError("Category name is required");
                return;
            }

            console.log("CATEGORY DATA BEING SENT:", {
                name: categoryName,
                description: description,
                status: status
            });

            const response = await fetch(
                "http://localhost:5000/api/admin/categories",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: categoryName.trim(),
                        description: description.trim(),
                        status: status
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to create category"
                );
            }

            await fetchCategories();

            handleCloseModal();

        } catch (error) {
            console.error(error);
            setSaveError(error.message);
        } finally {
            setSaving(false);
        }
    }

    function handleEditCategory(category) {
        setCategoryToEdit(category);

        setEditCategoryName(category.name);
        setEditDescription(category.description || "");
        setEditStatus(category.status);

        setEditError("");
        setShowEditModal(true);
    }

    function handleEditStatusChange(selectedStatus) {
        console.log("Edit category status:", selectedStatus);
        setEditStatus(selectedStatus);
    }

    async function handleUpdateCategory() {
        try {
            setEditing(true);
            setEditError("");

            const response = await fetch(
                `http://localhost:5000/api/admin/categories/${categoryToEdit._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: editCategoryName,
                        description: editDescription,
                        status: editStatus
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to update category"
                );
            }

            await fetchCategories();

            setShowEditModal(false);
            setCategoryToEdit(null);

        } catch (error) {
            console.error(error);
            setEditError(error.message);
        } finally {
            setEditing(false);
        }
    }

    function handleCloseEditModal() {
        if (editing) {
            return;
        }

        setShowEditModal(false);
        setCategoryToEdit(null);
        setEditCategoryName("");
        setEditDescription("");
        setEditStatus("active");
        setEditError("");
    }

    function handleDeleteCategory(category) {
        setCategoryToDelete(category);
        setDeleteError("");
        setShowDeleteModal(true);
    }

    async function confirmDeleteCategory() {
        try {
            setDeleting(true);
            setDeleteError("");

            const response = await fetch(
                `http://localhost:5000/api/admin/categories/${categoryToDelete._id}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to delete category"
                );
            }

            await fetchCategories();

            setShowDeleteModal(false);
            setCategoryToDelete(null);

        } catch (error) {
            console.error(error);
            setDeleteError(error.message);
        } finally {
            setDeleting(false);
        }
    }

    function handleCloseDeleteModal() {
        if (deleting) {
            return;
        }

        setShowDeleteModal(false);
        setCategoryToDelete(null);
        setDeleteError("");
    }

    return (
        <AdminLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">
                            Categories
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage your store's bottle categories and view assigned products.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600"
                    >
                        <span className="text-lg leading-none">+</span>
                        Add Category
                    </button>

                </div>

                {/* Main Card */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                    {/* Card Header */}
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-3">

                            <h3 className="text-base font-bold text-slate-900">
                                All Categories
                            </h3>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {categories.length}{" "}
                                {categories.length === 1
                                    ? "category"
                                    : "categories"}
                            </span>

                        </div>

                        <span className="text-sm text-slate-500">
                            Simple catalog view
                        </span>

                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="px-6 py-12 text-center text-sm text-slate-500">
                            Loading categories...
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <div className="px-6 py-12 text-center text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    {/* Table */}
                    {!loading && !error && (
                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[700px]">

                                <thead>
                                    <tr className="border-b border-slate-200">

                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-slate-500">
                                            CATEGORY
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-slate-500">
                                            PRODUCTS
                                        </th>

                                        <th className="px-6 py-4 text-left text-xs font-semibold tracking-wide text-slate-500">
                                            STATUS
                                        </th>

                                        <th className="px-6 py-4 text-right text-xs font-semibold tracking-wide text-slate-500">
                                            ACTIONS
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {categories.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-12 text-center text-sm text-slate-500"
                                            >
                                                No categories found
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((category) => (
                                            <tr
                                                key={category._id}
                                                className="border-b border-slate-100 last:border-b-0"
                                            >

                                                {/* Category */}
                                                <td className="px-6 py-5">

                                                    <div className="flex items-center gap-4">

                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xl">
                                                            💧
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {category.name}
                                                            </p>

                                                            <p className="mt-1 text-sm text-slate-500">
                                                                {category.description || "No description"}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* Products */}
                                                <td className="px-6 py-5">

                                                    <span className="text-sm font-semibold text-slate-800">
                                                        0 Products
                                                    </span>

                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-5">

                                                    <span
                                                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${category.status === "active"
                                                            ? "bg-green-50 text-green-700"
                                                            : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >

                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${category.status === "active"
                                                                ? "bg-green-500"
                                                                : "bg-slate-400"
                                                                }`}
                                                        ></span>

                                                        {category.status === "active"
                                                            ? "Active"
                                                            : "Inactive"}

                                                    </span>

                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-5">

                                                    <div className="flex justify-end gap-4">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEditCategory(category)
                                                            }
                                                            className="text-sm font-medium text-sky-600 transition hover:text-sky-700"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteCategory(category)
                                                            }
                                                            className="text-sm font-medium text-red-500 transition hover:text-red-600"
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>
                                        ))
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-col gap-2 border-t border-slate-200 px-6 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

                        <span>
                            Showing {categories.length}{" "}
                            {categories.length === 1
                                ? "category"
                                : "categories"}
                        </span>

                        <span>
                            Click Edit to change name or status
                        </span>

                    </div>

                </div>

            </div>

            {/* Add Category Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    Add New Category
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Create a new bottle product collection
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="text-xl text-slate-400 transition hover:text-slate-700"
                            >
                                ✕
                            </button>

                        </div>

                        {/* Modal Body */}
                        <div className="space-y-6 px-6 py-6">

                            {/* Category Name */}
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Category Name
                                </label>

                                <input
                                    type="text"
                                    value={categoryName}
                                    onChange={(event) =>
                                        setCategoryName(event.target.value)
                                    }
                                    placeholder="e.g., Insulated Bottles"
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />

                            </div>

                            {/* Description */}
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                    rows="3"
                                    placeholder="Brief description of the bottle collection..."
                                    className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />

                            </div>

                            {/* Save Error */}
                            {saveError && (
                                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {saveError}
                                </div>
                            )}

                            {/* Status */}
                            <div>

                                <label className="mb-3 block text-sm font-semibold text-slate-700">
                                    Status
                                </label>

                                <div className="grid grid-cols-2 gap-3">

                                    {/* Active */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleAddStatusChange("active")
                                        }
                                        className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition ${status === "active"
                                            ? "border-sky-500 bg-sky-500 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                            }`}
                                    >
                                        Active
                                    </button>

                                    {/* Draft */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleAddStatusChange("inactive")
                                        }
                                        className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition ${status === "inactive"
                                            ? "border-sky-500 bg-sky-500 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                            }`}
                                    >
                                        Draft
                                    </button>

                                </div>

                                <p className="mt-2 text-xs text-slate-400">
                                    Draft categories are saved as inactive.
                                </p>

                            </div>

                            {/* Display Icon */}
                            <div>

                                <label className="mb-3 block text-sm font-semibold text-slate-700">
                                    Display Icon / Badge
                                </label>

                                <div className="grid grid-cols-5 gap-3">

                                    {["💧", "🍃", "🏋️", "🧢", "♻️"].map(
                                        (icon) => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedIcon(icon)
                                                }
                                                className={`flex h-14 items-center justify-center rounded-lg border text-2xl transition ${selectedIcon === icon
                                                    ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                                                    : "border-slate-200 bg-white hover:border-slate-300"
                                                    }`}
                                            >
                                                {icon}
                                            </button>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={handleCloseModal}
                                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveCategory}
                                disabled={saving}
                                className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Category"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* Edit Category Modal */}
            {showEditModal && categoryToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

                        {/* Modal Header */}
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    Edit Category
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Update the category information
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseEditModal}
                                disabled={editing}
                                className="text-xl text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                ✕
                            </button>

                        </div>

                        {/* Modal Body */}
                        <div className="space-y-6 px-6 py-6">

                            {/* Category Name */}
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Category Name
                                </label>

                                <input
                                    type="text"
                                    value={editCategoryName}
                                    onChange={(event) =>
                                        setEditCategoryName(event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />

                            </div>

                            {/* Description */}
                            <div>

                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Description
                                </label>

                                <textarea
                                    value={editDescription}
                                    onChange={(event) =>
                                        setEditDescription(event.target.value)
                                    }
                                    rows="3"
                                    className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />

                            </div>

                            {/* Edit Error */}
                            {editError && (
                                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {editError}
                                </div>
                            )}

                            {/* Status */}
                            <div>

                                <label className="mb-3 block text-sm font-semibold text-slate-700">
                                    Status
                                </label>

                                <div className="grid grid-cols-2 gap-3">

                                    {/* Active */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEditStatusChange("active")
                                        }
                                        className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition ${editStatus === "active"
                                            ? "border-sky-500 bg-sky-500 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                            }`}
                                    >
                                        Active
                                    </button>

                                    {/* Draft */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEditStatusChange("inactive")
                                        }
                                        className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition ${editStatus === "inactive"
                                            ? "border-sky-500 bg-sky-500 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                            }`}
                                    >
                                        Draft
                                    </button>

                                </div>

                                <p className="mt-2 text-xs text-slate-400">
                                    Draft categories are saved as inactive.
                                </p>

                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={handleCloseEditModal}
                                disabled={editing}
                                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleUpdateCategory}
                                disabled={editing}
                                className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {editing ? "Saving..." : "Save Changes"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && categoryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">

                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

                        {/* Modal Content */}
                        <div className="px-6 py-6">

                            <div className="flex items-start gap-4">

                                {/* Warning Icon */}
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-xl">
                                    ⚠️
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Delete Category
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                        Are you sure you want to delete{" "}
                                        <span className="font-semibold text-slate-700">
                                            {categoryToDelete.name}
                                        </span>
                                        ? This action cannot be undone.
                                    </p>
                                </div>

                            </div>

                            {/* Delete Error */}
                            {deleteError && (
                                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {deleteError}
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">

                            <button
                                type="button"
                                onClick={handleCloseDeleteModal}
                                disabled={deleting}
                                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmDeleteCategory}
                                disabled={deleting}
                                className="rounded-lg bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete Category"}
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </AdminLayout>
    );
}

export default Categories;