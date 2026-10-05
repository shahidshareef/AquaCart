import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";

function AddProduct() {

    const navigate = useNavigate();

    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [description, setDescription] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [saving, setSaving] = useState(false);

    const [popupMessage, setPopupMessage] = useState("");
    const [popupTitle, setPopupTitle] = useState("");

    const [variants, setVariants] = useState([
        {
            id: 1,
            size: "500ml",
            description: "17 oz compact flask",
            price: "499",
            stock: "20",
            sku: "AQ-500-BL"
        },
        {
            id: 2,
            size: "750ml",
            description: "25 oz commuter size",
            price: "599",
            stock: "8",
            sku: "AQ-750-BLK"
        }
    ]);


    useEffect(function () {

        async function getCategories() {

            try {

                const response = await fetch(
                    "http://localhost:5000/api/admin/categories"
                );

                const data = await response.json();

                if (response.ok) {
                    setCategories(data.data);
                }

            } catch (error) {
                console.log(error);
            }

        }

        getCategories();

    }, []);


    function handleImageChange(event) {

        const file = event.target.files[0];

        if (!file) {
            return;
        }

        setSelectedImage(file);
    }


    function handleVariantChange(id, field, value) {

        setVariants(function (currentVariants) {

            return currentVariants.map(function (variant) {

                if (variant.id === id) {
                    return {
                        ...variant,
                        [field]: value
                    };
                }

                return variant;
            });

        });
    }


    function handleAddVariant() {

        const newVariant = {
            id: Date.now(),
            size: "1000ml",
            description: "34 oz large capacity",
            price: "",
            stock: "",
            sku: ""
        };

        setVariants(function (currentVariants) {
            return [...currentVariants, newVariant];
        });
    }


    function handleDeleteVariant(id) {

        setVariants(function (currentVariants) {

            return currentVariants.filter(function (variant) {
                return variant.id !== id;
            });

        });
    }


    function showPopup(title, message) {

        setPopupTitle(title);
        setPopupMessage(message);
    }


    function closePopup() {

        setPopupTitle("");
        setPopupMessage("");
    }


    async function handleSaveProduct() {
        console.log("SAVE PRODUCT CALLED");

        if (saving) {
            return;
        }

        if (!category) {

            showPopup(
                "Category Required",
                "Please select a category before creating the product."
            );

            return;
        }

        setSaving(true);

        try {

            const formData = new FormData();

            formData.append("name", productName);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("brand", "AquaCart");
            formData.append("status", "active");

            if (selectedImage) {
                formData.append("image", selectedImage);
            }

            const productResponse = await fetch(
                "http://localhost:5000/api/admin/products",
                {
                    method: "POST",
                    body: formData
                }
            );

            const productData = await productResponse.json();

            if (!productResponse.ok) {

                showPopup(
                    "Unable to Create Product",
                    productData.message ||
                    "Failed to create product."
                );

                return;
            }

            const productId = productData.data._id;

            for (const variant of variants) {

                const variantResponse = await fetch(
                    `http://localhost:5000/api/admin/products/${productId}/variants`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            size: variant.size,
                            sku: variant.sku,
                            price: Number(variant.price),
                            stock: Number(variant.stock),
                            status: "active"
                        })
                    }
                );

                const variantData = await variantResponse.json();

                if (!variantResponse.ok) {

                    showPopup(
                        "Unable to Create Variant",
                        variantData.message ||
                        `Failed to create ${variant.size} variant.`
                    );

                    return;
                }
            }

            console.log(
                "Created product:",
                productData.data
            );

            navigate("/admin/products", {
                state: {
                    message: "Product, variants and image created successfully",
                    messageType: "success"
                }
            });

        } catch (error) {

            console.log(error);

            showPopup(
                "Something Went Wrong",
                "Something went wrong while creating the product."
            );

        } finally {

            setSaving(false);
        }
    }


    return (
        <AdminLayout pageTitle="Add Product">

            <div className="space-y-6">

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">

                    <Link
                        to="/admin/products"
                        className="font-medium text-sky-600 hover:text-sky-700"
                    >
                        ← Products
                    </Link>

                    <span className="text-slate-400">
                        /
                    </span>

                    <span className="text-slate-500">
                        Add New Product
                    </span>

                </div>


                {/* Page Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Add Product
                        </h2>

                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Create a new steel bottle listing or update details,
                            pricing, and variant inventory stock.
                        </p>
                    </div>


                    <Link
                        to="/admin/products"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        ← Back to Products
                    </Link>

                </div>


                {/* Product Media */}
                <section className="rounded-xl border border-slate-200 bg-white">

                    <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                🖼️
                            </div>

                            <div>

                                <h3 className="font-semibold text-slate-900">
                                    Product Media
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Upload a clean studio photo of the bottle
                                    (PNG, JPG or WEBP, max 5MB).
                                </p>

                            </div>

                        </div>


                        <span className="w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                            Required Field
                        </span>

                    </div>


                    <div className="grid gap-6 p-6 lg:grid-cols-2">

                        {/* Preview */}
                        <div>

                            <p className="mb-3 text-sm font-semibold text-slate-700">
                                Product Preview
                            </p>

                            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">

                                {selectedImage ? (
                                    <div className="text-center">

                                        <div className="mb-3 text-5xl">
                                            🖼️
                                        </div>

                                        <p className="text-sm font-medium text-slate-700">
                                            {selectedImage.name}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Image selected successfully
                                        </p>

                                    </div>
                                ) : (
                                    <div className="text-center">

                                        <div className="mb-4 text-6xl">
                                            🧴
                                        </div>

                                        <p className="text-sm font-semibold text-slate-700">
                                            HydroPure Pro Series
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Studio White Light
                                        </p>

                                    </div>
                                )}

                            </div>

                        </div>


                        {/* Upload */}
                        <div>

                            <p className="mb-3 text-sm font-semibold text-slate-700">
                                Upload Product Photo
                            </p>

                            <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 text-center transition hover:border-sky-400 hover:bg-sky-50/30">

                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-2xl">
                                    ☁️
                                </div>

                                <p className="font-medium text-slate-700">
                                    Drag & drop high-res product photo here
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    or select a file from your workstation
                                </p>


                                <span className="mt-5 inline-flex items-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white">
                                    📷 Browse Image
                                </span>


                                <input
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.webp"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />

                            </label>


                            <div className="mt-4 space-y-2">

                                <p className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="text-green-500">
                                        ✓
                                    </span>
                                    Pure White / Transparent Scrim
                                </p>

                                <p className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="text-green-500">
                                        ✓
                                    </span>
                                    Square 1:1 or 3:4 Portrait
                                </p>

                            </div>

                        </div>

                    </div>

                </section>


                {/* Basic Product Details */}
                <section className="rounded-xl border border-slate-200 bg-white">

                    <div className="border-b border-slate-200 px-6 py-5">

                        <div className="flex gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                ⚙️
                            </div>

                            <div>

                                <h3 className="font-semibold text-slate-900">
                                    Basic Product Details
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Define customer-facing nomenclature, catalog
                                    assignment, and thermal engineering specs.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="space-y-6 p-6">

                        {/* Product Name */}
                        <div>

                            <label
                                htmlFor="productName"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Product Name <span className="text-red-500">*</span>
                            </label>

                            <input
                                id="productName"
                                type="text"
                                value={productName}
                                onChange={function (event) {
                                    setProductName(event.target.value);
                                }}
                                placeholder="HydroPure Matte Black Bottle"
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                            />

                        </div>


                        {/* Category */}
                        <div>

                            <label
                                htmlFor="category"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Category <span className="text-red-500">*</span>
                            </label>

                            <select
                                id="category"
                                value={category}
                                onChange={function (event) {
                                    setCategory(event.target.value);
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                            >

                                <option value="">
                                    Select a category
                                </option>

                                {categories.map(function (categoryItem) {

                                    return (
                                        <option
                                            key={categoryItem._id}
                                            value={categoryItem._id}
                                        >
                                            {categoryItem.name}
                                        </option>
                                    );

                                })}

                            </select>

                        </div>


                        {/* Description */}
                        <div>

                            <label
                                htmlFor="description"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Detailed Description & Technical Highlights
                            </label>

                            <textarea
                                id="description"
                                value={description}
                                onChange={function (event) {
                                    setDescription(event.target.value);
                                }}
                                rows="7"
                                placeholder="Precision double-wall 18/8 food-grade stainless steel vacuum insulation. Keeps beverages ice-cold for up to 24 hours or piping hot for 12 hours without condensation. Features a textured scratch-resistant powder coat and leakproof ergonomic carry-loop lid."
                                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                            />

                        </div>

                    </div>

                </section>


                {/* Variants, Pricing & Stock */}
                <section className="rounded-xl border border-slate-200 bg-white">

                    {/* Section Header */}
                    <div className="border-b border-slate-200 px-6 py-5">

                        <div className="flex gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                                📦
                            </div>

                            <div>

                                <h3 className="font-semibold text-slate-900">
                                    Variants, Pricing & Stock
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Set independent prices and available warehouse
                                    inventory for each bottle size variant.
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* Variant Table */}
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px]">

                            <thead>

                                <tr className="border-b border-slate-200 bg-slate-50">

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Size Variant
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Unit Price (INR)
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Stock Inventory
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        SKU Reference
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {variants.map(function (variant) {

                                    return (
                                        <tr
                                            key={variant.id}
                                            className="border-b border-slate-100 last:border-b-0"
                                        >

                                            {/* Size */}
                                            <td className="px-6 py-5">

                                                <div className="flex items-center gap-3">

                                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-xs font-bold text-sky-600">
                                                        {variant.size.replace("ml", "")}
                                                    </span>

                                                    <div>

                                                        <input
                                                            type="text"
                                                            value={variant.size}
                                                            onChange={function (event) {
                                                                handleVariantChange(
                                                                    variant.id,
                                                                    "size",
                                                                    event.target.value
                                                                );
                                                            }}
                                                            className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500"
                                                        />

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {variant.description}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* Price */}
                                            <td className="px-6 py-5">

                                                <div className="flex items-center">

                                                    <span className="rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                                        ₹
                                                    </span>

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={variant.price}
                                                        onChange={function (event) {
                                                            handleVariantChange(
                                                                variant.id,
                                                                "price",
                                                                event.target.value
                                                            );
                                                        }}
                                                        className="w-28 rounded-r-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
                                                    />

                                                </div>

                                            </td>


                                            {/* Stock */}
                                            <td className="px-6 py-5">

                                                <div className="flex items-center">

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={variant.stock}
                                                        onChange={function (event) {
                                                            handleVariantChange(
                                                                variant.id,
                                                                "stock",
                                                                event.target.value
                                                            );
                                                        }}
                                                        className="w-24 rounded-l-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
                                                    />

                                                    <span className="rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                                        units
                                                    </span>

                                                </div>

                                            </td>


                                            {/* SKU */}
                                            <td className="px-6 py-5">

                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={function (event) {
                                                        handleVariantChange(
                                                            variant.id,
                                                            "sku",
                                                            event.target.value
                                                        );
                                                    }}
                                                    className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
                                                />

                                            </td>


                                            {/* Delete */}
                                            <td className="px-6 py-5 text-right">

                                                <button
                                                    type="button"
                                                    onClick={function () {
                                                        handleDeleteVariant(variant.id);
                                                    }}
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50"
                                                    aria-label="Delete variant"
                                                >
                                                    🗑️
                                                </button>

                                            </td>

                                        </tr>
                                    );

                                })}

                            </tbody>

                        </table>

                    </div>


                    {/* Variant Footer */}
                    <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">

                        <button
                            type="button"
                            onClick={handleAddVariant}
                            className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
                        >
                            + Add Another Size Variant (e.g. 1000ml)
                        </button>


                        <p className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="text-sky-500">
                                ⓘ
                            </span>

                            Variants automatically populate the customer
                            size-picker pill tabs.
                        </p>

                    </div>

                </section>

            </div>


            {/* Bottom Action Toolbar */}
            <div className="sticky bottom-0 mt-8 border-t border-slate-200 bg-white py-4">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-2 text-sm text-slate-500">

                        <span className="text-green-600">
                            ✓
                        </span>

                        <span>
                            All changes will be verified & published immediately to the customer storefront.
                        </span>

                    </div>


                    <div className="flex gap-3">

                        <Link
                            to="/admin/products"
                            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Link>


                        <button
                            type="button"
                            onClick={handleSaveProduct}
                            disabled={saving}
                            className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "💾 Save Product"}
                        </button>

                    </div>

                </div>

            </div>


            {/* Popup */}
            {popupMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="flex items-start gap-4">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
                                !
                            </div>

                            <div className="flex-1">

                                <h3 className="text-lg font-semibold text-slate-900">
                                    {popupTitle}
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {popupMessage}
                                </p>

                            </div>

                        </div>


                        <div className="mt-6 flex justify-end">

                            <button
                                type="button"
                                onClick={closePopup}
                                className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600"
                            >
                                Okay
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </AdminLayout>
    );
}

export default AddProduct;