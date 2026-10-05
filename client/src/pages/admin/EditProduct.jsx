import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";

function EditProduct() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [saving, setSaving] = useState(false);

    const [productName, setProductName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");

    const [selectedImage, setSelectedImage] = useState(null);


    useEffect(function () {

        async function getProductData() {

            try {

                const productResponse = await fetch(
                    `http://localhost:5000/api/admin/products/${id}`
                );

                const productData = await productResponse.json();

                if (!productResponse.ok) {
                    throw new Error(
                        productData.message || "Failed to fetch product"
                    );
                }

                setProduct(productData.data);

                setProductName(productData.data.name);
                setDescription(productData.data.description);
                setCategory(productData.data.category?._id || "");


                const variantResponse = await fetch(
                    `http://localhost:5000/api/admin/products/${id}/variants`
                );

                const variantData = await variantResponse.json();

                if (!variantResponse.ok) {
                    throw new Error(
                        variantData.message || "Failed to fetch variants"
                    );
                }

                setVariants(variantData.data);


                const categoryResponse = await fetch(
                    "http://localhost:5000/api/admin/categories"
                );

                const categoryData = await categoryResponse.json();

                if (!categoryResponse.ok) {
                    throw new Error(
                        categoryData.message || "Failed to fetch categories"
                    );
                }

                setCategories(categoryData.data);

            } catch (error) {

                console.error(error);
                setError(error.message);

            } finally {

                setLoading(false);

            }
        }

        getProductData();

    }, [id]);


    function handleVariantChange(variantId, field, value) {

        setVariants(function (currentVariants) {

            return currentVariants.map(function (variant) {

                if (variant._id === variantId) {

                    return {
                        ...variant,
                        [field]: value
                    };

                }

                return variant;

            });

        });

    }


    function handleImageChange(event) {

        const file = event.target.files[0];

        if (file) {
            setSelectedImage(file);
        }

    }


    async function handleSaveProduct() {

        setSaving(true);
        setError("");

        try {

            const productFormData = new FormData();

            productFormData.append("name", productName);
            productFormData.append("description", description);
            productFormData.append("category", category);

            if (selectedImage) {
                productFormData.append("image", selectedImage);
            }


            // Update Product

            const productResponse = await fetch(
                `http://localhost:5000/api/admin/products/${id}`,
                {
                    method: "PUT",
                    body: productFormData
                }
            );

            const productData = await productResponse.json();

            if (!productResponse.ok) {
                throw new Error(
                    productData.message || "Failed to update product"
                );
            }


            // Update Variants

            for (const variant of variants) {

                const variantResponse = await fetch(
                    `http://localhost:5000/api/admin/products/variants/${variant._id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            size: variant.size,
                            sku: variant.sku,
                            price: Number(variant.price),
                            stock: Number(variant.stock)
                        })
                    }
                );

                const variantData = await variantResponse.json();

                if (!variantResponse.ok) {
                    throw new Error(
                        variantData.message ||
                        `Failed to update variant ${variant.sku}`
                    );
                }

            }


            // Redirect to Products after successful update

            navigate("/admin/products", {
                state: {
                    message: "Product and variants updated successfully.",
                    messageType: "success"
                }
            });

        } catch (error) {

            console.error(error);
            setError(error.message);

        } finally {

            setSaving(false);

        }
    }


    function handleCancel() {
        navigate("/admin/products");
    }


    if (loading) {

        return (
            <AdminLayout pageTitle="Edit Product">

                <div className="rounded-xl border border-slate-200 bg-white p-6">

                    <p className="text-sm text-slate-500">
                        Loading product...
                    </p>

                </div>

            </AdminLayout>
        );

    }


    if (error) {

        return (
            <AdminLayout pageTitle="Edit Product">

                <div className="rounded-xl border border-red-200 bg-red-50 p-6">

                    <p className="text-sm text-red-600">
                        {error}
                    </p>

                </div>

            </AdminLayout>
        );

    }


    return (
        <AdminLayout pageTitle="Edit Product">

            <div className="space-y-6">

                {/* Breadcrumb */}

                <div className="text-sm text-slate-500">

                    <button
                        type="button"
                        onClick={handleCancel}
                        className="font-medium text-sky-600 hover:text-sky-700"
                    >
                        ← Products
                    </button>

                    <span className="mx-2 text-slate-400">
                        /
                    </span>

                    <span>
                        Edit Product
                    </span>

                </div>


                {/* Basic Product Details */}

                <div className="rounded-xl border border-slate-200 bg-white p-6">

                    <h2 className="text-xl font-bold text-slate-900">
                        Edit Product
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Update the product information below.
                    </p>


                    <div className="mt-6 space-y-5">

                        {/* Product Name */}

                        <div>

                            <label className="text-sm font-medium text-slate-700">
                                Product Name
                            </label>

                            <input
                                type="text"
                                value={productName}
                                onChange={function (event) {
                                    setProductName(event.target.value);
                                }}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
                            />

                        </div>


                        {/* Category */}

                        <div>

                            <label className="text-sm font-medium text-slate-700">
                                Category
                            </label>

                            <select
                                value={category}
                                onChange={function (event) {
                                    setCategory(event.target.value);
                                }}
                                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500"
                            >

                                <option value="">
                                    Select Category
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

                            <label className="text-sm font-medium text-slate-700">
                                Description
                            </label>

                            <textarea
                                value={description}
                                onChange={function (event) {
                                    setDescription(event.target.value);
                                }}
                                rows="5"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-sky-500"
                            />

                        </div>

                    </div>

                </div>


                {/* Product Image */}

                <div className="rounded-xl border border-slate-200 bg-white p-6">

                    <h2 className="text-xl font-bold text-slate-900">
                        Product Media
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Select a new product image if you want to replace the current one.
                    </p>


                    <div className="mt-5 flex flex-wrap gap-6">

                        {product.images &&
                            product.images.length > 0 && (

                                <div>

                                    <p className="mb-2 text-xs font-medium uppercase text-slate-400">
                                        Current Image
                                    </p>

                                    <img
                                        src={`http://localhost:5000${product.images[0]}`}
                                        alt={product.name}
                                        className="h-48 w-48 rounded-xl border border-slate-200 object-cover"
                                    />

                                </div>

                            )}


                        <div>

                            <p className="mb-2 text-xs font-medium uppercase text-slate-400">
                                New Image
                            </p>

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleImageChange}
                                className="block w-full text-sm text-slate-600"
                            />

                            {selectedImage && (

                                <p className="mt-2 text-sm text-sky-600">
                                    Selected: {selectedImage.name}
                                </p>

                            )}

                        </div>

                    </div>

                </div>


                {/* Variants */}

                <div className="rounded-xl border border-slate-200 bg-white p-6">

                    <h2 className="text-xl font-bold text-slate-900">
                        Variants, Pricing & Stock
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Update the size, SKU, price and available stock.
                    </p>


                    <div className="mt-6 overflow-x-auto">

                        <table className="w-full text-left">

                            <thead>

                                <tr className="border-b border-slate-200">

                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                                        Size
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                                        SKU
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                                        Price
                                    </th>

                                    <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                                        Stock
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {variants.map(function (variant) {

                                    return (
                                        <tr
                                            key={variant._id}
                                            className="border-b border-slate-100"
                                        >

                                            <td className="px-4 py-4">

                                                <input
                                                    type="text"
                                                    value={variant.size}
                                                    onChange={function (event) {
                                                        handleVariantChange(
                                                            variant._id,
                                                            "size",
                                                            event.target.value
                                                        );
                                                    }}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                                                />

                                            </td>


                                            <td className="px-4 py-4">

                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={function (event) {
                                                        handleVariantChange(
                                                            variant._id,
                                                            "sku",
                                                            event.target.value
                                                        );
                                                    }}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                                                />

                                            </td>


                                            <td className="px-4 py-4">

                                                <input
                                                    type="number"
                                                    value={variant.price}
                                                    onChange={function (event) {
                                                        handleVariantChange(
                                                            variant._id,
                                                            "price",
                                                            event.target.value
                                                        );
                                                    }}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                                                />

                                            </td>


                                            <td className="px-4 py-4">

                                                <input
                                                    type="number"
                                                    value={variant.stock}
                                                    onChange={function (event) {
                                                        handleVariantChange(
                                                            variant._id,
                                                            "stock",
                                                            event.target.value
                                                        );
                                                    }}
                                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                                                />

                                            </td>

                                        </tr>
                                    );

                                })}

                            </tbody>

                        </table>

                    </div>

                </div>


                {/* Action Area */}

                <div className="flex items-center justify-end gap-4">

                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSaveProduct}
                        disabled={saving}
                        className="rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Saving..." : "Save Product"}
                    </button>

                </div>

            </div>

        </AdminLayout>
    );
}

export default EditProduct;