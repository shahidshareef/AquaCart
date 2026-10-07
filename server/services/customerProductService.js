const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const ProductVariant = require("../models/ProductVariant");

async function getFeaturedProducts() {
    // Find the top-selling products
    const products = await Order.aggregate([
        {
            $match: {
                orderStatus: {
                    $nin: ["cancelled", "returned"]
                }
            }
        },
        {
            $unwind: "$orderItems"
        },
        {
            $group: {
                _id: "$orderItems.product",
                totalSold: {
                    $sum: "$orderItems.quantity"
                }
            }
        },
        {
            $sort: {
                totalSold: -1
            }
        },
        {
            $limit: 4
        }
    ]);

    const productIds = products.map(
        (product) => product._id
    );

    let featuredProducts = [];

    // Get valid top-selling products
    if (productIds.length > 0) {
        const productDetails = await Product.find({
            _id: { $in: productIds },
            status: "active"
        }).populate("category", "name");

        const variants = await ProductVariant.find({
            product: { $in: productIds },
            status: "active"
        }).sort({ price: 1 });

        featuredProducts = products
            .map((product) => {
                const productDetail = productDetails.find(
                    (item) =>
                        item._id.toString() ===
                        product._id.toString()
                );

                if (!productDetail) {
                    return null;
                }

                const productVariants = variants.filter(
                    (variant) =>
                        variant.product.toString() ===
                        product._id.toString()
                );

                if (productVariants.length === 0) {
                    return null;
                }

                return {
                    ...productDetail.toObject(),
                    variants: productVariants,
                    totalSold: product.totalSold
                };
            })
            .filter((product) => product !== null);
    }

    // If we already have 4 top-selling products,
    // return them directly.
    if (featuredProducts.length === 4) {
        return featuredProducts;
    }

    // Find latest active products to fill the remaining slots.
    const latestProducts = await Product.aggregate([
        {
            $match: {
                status: "active"
            }
        },
        {
            $lookup: {
                from: "productvariants",
                localField: "_id",
                foreignField: "product",
                as: "variants"
            }
        },
        {
            $addFields: {
                activeVariants: {
                    $filter: {
                        input: "$variants",
                        as: "variant",
                        cond: {
                            $eq: [
                                "$$variant.status",
                                "active"
                            ]
                        }
                    }
                }
            }
        },
        {
            $match: {
                "activeVariants.0": {
                    $exists: true
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ]);

    const latestProductsWithCategory =
        await Product.populate(
            latestProducts,
            {
                path: "category",
                select: "name"
            }
        );

    // Products already shown as top sellers
    const featuredIds = featuredProducts.map(
        (product) => product._id.toString()
    );

    // Remove products that are already in the featured list
    const remainingProducts =
        latestProductsWithCategory.filter(
            (product) =>
                !featuredIds.includes(
                    product._id.toString()
                )
        );

    // Number of additional products needed
    const remainingCount =
        4 - featuredProducts.length;

    // Add latest products until we have 4
    const fallbackProducts = remainingProducts
        .slice(0, remainingCount)
        .map((product) => {
            return {
                ...product,
                variants: product.activeVariants
            };
        });

    return [
        ...featuredProducts,
        ...fallbackProducts
    ];
}

async function getCustomerProducts({
    search,
    category,
    sort,
    page = 1,
    limit = 8
}) {
    const skip = (page - 1) * limit;

    const filter = {
        status: "active"
    };

    if (search) {
        filter.name = {
            $regex: search,
            $options: "i"
        };
    }

    if (category) {
        filter.category = new mongoose.Types.ObjectId(category);
    }

    let sortOption = {
        createdAt: -1
    };

    if (sort === "price-low") {
        sortOption = {
            lowestPrice: 1
        };
    }

    if (sort === "price-high") {
        sortOption = {
            lowestPrice: -1
        };
    }

    const products = await Product.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "productvariants",
                localField: "_id",
                foreignField: "product",
                as: "variants"
            }
        },
        {
            $addFields: {
                activeVariants: {
                    $filter: {
                        input: "$variants",
                        as: "variant",
                        cond: {
                            $eq: ["$$variant.status", "active"]
                        }
                    }
                }
            }
        },
        {
            $match: {
                "activeVariants.0": {
                    $exists: true
                }
            }
        },
        {
            $addFields: {
                lowestPrice: {
                    $min: "$activeVariants.price"
                }
            }
        },
        {
            $sort: sortOption
        },
        {
            $skip: skip
        },
        {
            $limit: Number(limit)
        }
    ]);

    const totalProducts = await Product.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "productvariants",
                localField: "_id",
                foreignField: "product",
                as: "variants"
            }
        },
        {
            $addFields: {
                activeVariants: {
                    $filter: {
                        input: "$variants",
                        as: "variant",
                        cond: {
                            $eq: ["$$variant.status", "active"]
                        }
                    }
                }
            }
        },
        {
            $match: {
                "activeVariants.0": {
                    $exists: true
                }
            }
        },
        {
            $count: "total"
        }
    ]);

    const totalProductCount =
        totalProducts.length > 0
            ? totalProducts[0].total
            : 0;

    const productData = products.map((product) => {
        return {
            _id: product._id,
            name: product.name,
            description: product.description,
            category: product.category,
            brand: product.brand,
            images: product.images,
            status: product.status,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            __v: product.__v,
            variants: product.activeVariants
        };
    });

    return {
        products: productData,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(
                totalProductCount / limit
            ),
            totalProducts: totalProductCount,
            limit: Number(limit)
        }
    };
}

module.exports = {
    getFeaturedProducts,
    getCustomerProducts
};