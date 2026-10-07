import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Products.css";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

function Products() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [sort, setSort] = useState("featured");

    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 9
    });

    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/admin/categories"
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch categories"
                    );
                }

                setCategories(
                    result.data.filter(
                        (category) => category.status === "active"
                    )
                );
            } catch (error) {
                console.log(error);
            }
        }

        fetchCategories();
    }, []);

    // Reset pagination when search, category, or sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCategory, sort]);

    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);

            try {
                const params = new URLSearchParams();

                if (search) {
                    params.append("search", search);
                }

                if (selectedCategory) {
                    params.append("category", selectedCategory);
                }

                if (sort !== "featured") {
                    params.append("sort", sort);
                }

                params.append("page", currentPage);
                params.append("limit", 8);

                const response = await fetch(
                    `http://localhost:5000/api/products?${params.toString()}`
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to fetch products"
                    );
                }

                setProducts(result.data);
                setPagination(result.pagination);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [search, selectedCategory, sort, currentPage]);

    return (
        <>
            <Header />

            <main className="products-page">

                {/* Page Header */}
                <section className="products-header">
                    <div className="products-breadcrumb">
                        COLLECTION / WATER BOTTLES
                    </div>

                    <h1>Steel Water Bottles</h1>

                    <p>
                        Find the right bottle for you. Engineered with
                        double-walled surgical stainless steel to keep drinks
                        icy cold for 24h or steaming hot for 12h.
                    </p>
                </section>

                {/* Products Content */}
                <section className="products-section">

                    {/* Toolbar */}
                    <div className="products-toolbar">

                        {/* Search */}
                        <div className="products-search">
                            <span className="search-icon">⌕</span>

                            <input
                                type="text"
                                placeholder="Search products (e.g. Navy, 750ml, Ceramic..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </div>

                        {/* Sort + Count */}
                        <div className="products-sort-area">
                            <label htmlFor="product-sort">
                                Sort by:
                            </label>

                            <select
                                id="product-sort"
                                value={sort}
                                onChange={(event) =>
                                    setSort(event.target.value)
                                }
                            >
                                <option value="featured">
                                    Featured
                                </option>

                                <option value="newest">
                                    Newest
                                </option>

                                <option value="price-low">
                                    Price: Low to High
                                </option>

                                <option value="price-high">
                                    Price: High to Low
                                </option>
                            </select>

                            <span className="products-count">
                                • {pagination.totalProducts} Products Available
                            </span>
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="products-filters">

                        <button
                            type="button"
                            className={
                                selectedCategory === ""
                                    ? "filter-chip active"
                                    : "filter-chip"
                            }
                            onClick={() => setSelectedCategory("")}
                        >
                            All Bottles
                        </button>

                        {categories.map((category) => (
                            <button
                                type="button"
                                key={category._id}
                                className={
                                    selectedCategory === category._id
                                        ? "filter-chip active"
                                        : "filter-chip"
                                }
                                onClick={() =>
                                    setSelectedCategory(category._id)
                                }
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    {loading ? (
                        <p className="products-message">
                            Loading products...
                        </p>
                    ) : products.length === 0 ? (
                        <p className="products-message">
                            No products available.
                        </p>
                    ) : (
                        <div className="products-grid">
                            {products.map((product) => {
                                const firstVariant =
                                    product.variants?.[0];

                                return (
                                    <article
                                        className="product-card"
                                        key={product._id}
                                    >
                                        {/* Product Image */}
                                        <div className="product-image">
                                            <img
                                                src={
                                                    product.images?.length > 0
                                                        ? `http://localhost:5000${product.images[0]}`
                                                        : "/images/1.png"
                                                }
                                                alt={product.name}
                                            />
                                        </div>

                                        {/* Product Information */}
                                        <div className="product-info">

                                            {firstVariant && (
                                                <p className="product-specification">
                                                    {firstVariant.size} ·
                                                    SURGICAL-GRADE 18/8
                                                </p>
                                            )}

                                            <h2>{product.name}</h2>

                                            {firstVariant && (
                                                <p className="product-price">
                                                    ₹{firstVariant.price}
                                                </p>
                                            )}

                                            {firstVariant && (
                                                <p
                                                    className={
                                                        firstVariant.stock > 0
                                                            ? "product-availability"
                                                            : "product-availability out-of-stock"
                                                    }
                                                >
                                                    •{" "}
                                                    {firstVariant.stock > 0
                                                        ? `In Stock · ${firstVariant.stock} units available`
                                                        : "Out of Stock"}
                                                </p>
                                            )}

                                            <button
                                                type="button"
                                                className="view-details-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/products/${product._id}`
                                                    )
                                                }
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Pagination */}
                <section className="products-pagination">
                    <p>
                        Showing{" "}
                        {pagination.totalProducts === 0
                            ? 0
                            : (pagination.currentPage - 1) *
                                  pagination.limit +
                              1}{" "}
                        –{" "}
                        {Math.min(
                            pagination.currentPage * pagination.limit,
                            pagination.totalProducts
                        )}{" "}
                        of {pagination.totalProducts} products
                    </p>

                    <div className="pagination-controls">

                        <button
                            type="button"
                            disabled={pagination.currentPage === 1}
                            onClick={() =>
                                setCurrentPage(
                                    pagination.currentPage - 1
                                )
                            }
                        >
                            &lt; Previous
                        </button>

                        {Array.from(
                            { length: pagination.totalPages },
                            (_, index) => index + 1
                        ).map((page) => (
                            <button
                                type="button"
                                key={page}
                                className={
                                    pagination.currentPage === page
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setCurrentPage(page)
                                }
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={
                                pagination.currentPage ===
                                pagination.totalPages
                            }
                            onClick={() =>
                                setCurrentPage(
                                    pagination.currentPage + 1
                                )
                            }
                        >
                            Next &gt;
                        </button>

                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}

export default Products;