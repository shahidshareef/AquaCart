import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";

function Products() {

    const location = useLocation();

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All Products");
    const [sort, setSort] = useState("Newest");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [deleteProductId, setDeleteProductId] = useState(null);


    useEffect(function () {

        if (location.state?.message) {

            setMessage(location.state.message);
            setMessageType(location.state.messageType || "success");

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );
        }

    }, [location.state]);


    async function handleDeleteProduct(productId) {

        try {

            const response = await fetch(
                `http://localhost:5000/api/admin/products/${productId}`,
                {
                    method: "DELETE"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Failed to delete product");
                setMessageType("error");
                return;
            }

            setProducts(function (currentProducts) {
                return currentProducts.filter(function (product) {
                    return product._id !== productId;
                });
            });

            setMessage("Product deleted successfully.");
            setMessageType("success");

        } catch (error) {

            console.log(error);

            setMessage(
                "Something went wrong while deleting the product."
            );
            setMessageType("error");

        }
    }


    function handleDeleteClick(productId) {
        setDeleteProductId(productId);
    }


    function handleCancelDelete() {
        setDeleteProductId(null);
    }


    async function handleConfirmDelete() {

        if (!deleteProductId) {
            return;
        }

        const productId = deleteProductId;

        setDeleteProductId(null);

        await handleDeleteProduct(productId);
    }


    useEffect(function () {

        async function getProducts() {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/admin/products"
                );

                const data = await response.json();

                if (!response.ok) {
                    return;
                }

                const productsWithVariants = await Promise.all(
                    data.data.map(async function (product) {

                        const variantResponse = await fetch(
                            `http://localhost:5000/api/admin/products/${product._id}/variants`
                        );

                        const variantData = await variantResponse.json();

                        if (variantResponse.ok) {
                            return {
                                ...product,
                                variants: variantData.data
                            };
                        }

                        return {
                            ...product,
                            variants: []
                        };
                    })
                );

                setProducts(productsWithVariants);

            } catch (error) {
                console.log(error);
            }
        }

        getProducts();

    }, []);


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


    useEffect(function () {
        setCurrentPage(1);
    }, [search, category, sort]);


    const filteredProducts = products
        .filter(function (product) {

            const searchText = search.toLowerCase();

            return (
                product.name.toLowerCase().includes(searchText) ||
                (product.brand || "").toLowerCase().includes(searchText)
            );
        })
        .filter(function (product) {

            if (category === "All Products") {
                return true;
            }

            return product.category?.name === category;
        })
        .sort(function (productA, productB) {

            if (sort === "Newest") {
                return new Date(productB.createdAt) - new Date(productA.createdAt);
            }

            if (sort === "Oldest") {
                return new Date(productA.createdAt) - new Date(productB.createdAt);
            }

            const pricesA = productA.variants.map(function (variant) {
                return variant.price;
            });

            const pricesB = productB.variants.map(function (variant) {
                return variant.price;
            });

            const lowestPriceA = Math.min.apply(null, pricesA);
            const lowestPriceB = Math.min.apply(null, pricesB);

            if (sort === "Price: Low to High") {
                return lowestPriceA - lowestPriceB;
            }

            if (sort === "Price: High to Low") {
                return lowestPriceB - lowestPriceA;
            }

            return 0;
        });


    const productsPerPage = 7;

    const totalPages = Math.ceil(
        filteredProducts.length / productsPerPage
    );

    const startIndex = (currentPage - 1) * productsPerPage;

    const paginatedProducts = filteredProducts.slice(
        startIndex,
        startIndex + productsPerPage
    );


    return (
        <AdminLayout pageTitle="Products">

            <div className="space-y-6">

                {/* Page heading */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            Products
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage your steel bottle catalog, pricing, and stock levels.
                        </p>
                    </div>

                    <Link
                        to="/admin/products/add"
                        className="rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600"
                    >
                        + Add Product
                    </Link>

                </div>


                {/* Screen message */}
                {message && (
                    <div
                        className={`rounded-lg border px-4 py-3 text-sm ${messageType === "success"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            }`}
                    >
                        {message}
                    </div>
                )}


                {/* Delete confirmation */}
                {deleteProductId && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5">

                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <h3 className="font-semibold text-red-800">
                                    Delete Product?
                                </h3>

                                <p className="mt-1 text-sm text-red-700">
                                    Are you sure you want to delete this product?
                                    This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex gap-3">

                                <button
                                    type="button"
                                    onClick={handleCancelDelete}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                                >
                                    Delete Product
                                </button>

                            </div>

                        </div>

                    </div>
                )}


                {/* Search and filters */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">

                    <div className="flex flex-col gap-3 lg:flex-row">

                        <div className="relative flex-1">

                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔍
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={function (event) {
                                    setSearch(event.target.value);
                                }}
                                placeholder="Search products by title or SKU..."
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
                            />

                        </div>


                        <select
                            value={category}
                            onChange={function (event) {
                                setCategory(event.target.value);
                            }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
                        >
                            <option value="All Products">
                                All Products
                            </option>

                            {categories.map(function (categoryItem) {

                                return (
                                    <option
                                        key={categoryItem._id}
                                        value={categoryItem.name}
                                    >
                                        {categoryItem.name}
                                    </option>
                                );

                            })}
                        </select>


                        <select
                            value={sort}
                            onChange={function (event) {
                                setSort(event.target.value);
                            }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-sky-500"
                        >
                            <option>Newest</option>
                            <option>Oldest</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>

                    </div>

                </div>


                {/* Products table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[850px]">

                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Product
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Price
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Variants
                                    </th>

                                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Stock
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Actions
                                    </th>

                                </tr>
                            </thead>


                            <tbody>

                                {paginatedProducts.map(function (product) {

                                    return (
                                        <tr
                                            key={product._id}
                                            className="border-b border-slate-100 last:border-b-0"
                                        >

                                            <td className="px-6 py-5">

                                                <div className="flex items-center gap-4">

                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">

                                                        {product.images && product.images.length > 0 ? (
                                                            <img
                                                                src={`http://localhost:5000${product.images[0]}`}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span>
                                                                🖼️
                                                            </span>
                                                        )}

                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {product.name}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {product.brand || "AquaCart"}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Category: {product.category?.name || "Uncategorized"}
                                                        </p>
                                                    </div>

                                                </div>

                                            </td>


                                            <td className="px-6 py-5">

                                                <span className="font-semibold text-slate-900">

                                                    ₹
                                                    {Math.min.apply(
                                                        null,
                                                        product.variants.map(function (variant) {
                                                            return variant.price;
                                                        })
                                                    ).toLocaleString("en-IN")}

                                                    {" - ₹"}

                                                    {Math.max.apply(
                                                        null,
                                                        product.variants.map(function (variant) {
                                                            return variant.price;
                                                        })
                                                    ).toLocaleString("en-IN")}

                                                </span>

                                            </td>


                                            <td className="px-6 py-5">

                                                <div className="space-y-1">

                                                    {product.variants.map(function (variant) {

                                                        return (
                                                            <p
                                                                key={variant._id}
                                                                className="text-sm text-slate-600"
                                                            >
                                                                {variant.size}
                                                            </p>
                                                        );

                                                    })}

                                                </div>

                                            </td>


                                            <td className="px-6 py-5">

                                                <div className="flex items-center gap-2">

                                                    <span className="h-2.5 w-2.5 rounded-full bg-green-500"></span>

                                                    <span className="text-sm font-medium text-slate-700">

                                                        {product.variants.reduce(
                                                            function (totalStock, variant) {
                                                                return totalStock + variant.stock;
                                                            },
                                                            0
                                                        )}

                                                        {" units"}

                                                    </span>

                                                </div>

                                            </td>


                                            <td className="px-6 py-5">

                                                <div className="flex justify-end gap-4">

                                                    <Link
                                                        to={`/admin/products/edit/${product._id}`}
                                                        className="text-sm font-medium text-sky-600 hover:text-sky-700"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={function () {
                                                            handleDeleteClick(product._id);
                                                        }}
                                                        className="text-sm font-medium text-red-500 hover:text-red-600"
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>
                                    );

                                })}

                            </tbody>

                        </table>

                    </div>


                    {/* Table footer */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-sm text-slate-500">
                            Showing {filteredProducts.length} products in catalog
                        </p>

                        <div className="flex items-center gap-2">

                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={function () {
                                    setCurrentPage(function (page) {
                                        return page - 1;
                                    });
                                }}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                                Previous
                            </button>

                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-sm font-semibold text-white"
                            >
                                {currentPage}
                            </button>

                            <button
                                type="button"
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={function () {
                                    setCurrentPage(function (page) {
                                        return page + 1;
                                    });
                                }}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                            >
                                Next
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        </AdminLayout>
    );
}

export default Products;