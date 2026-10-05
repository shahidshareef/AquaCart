const {
    getAllCategories,
    createCategory,
    updateCategory,
    updateCategoryStatus,
    deleteCategory
} = require("../services/categoryService");

async function getCategories(req, res) {
    try {
        const categories = await getAllCategories();

        res.status(200).json({
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch categories"
        });
    }
}

async function createCategoryController(req, res) {
    try {
        const { name, description, iconUrl, status } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Category name is required"
            });
        }

        const category = await createCategory({
            name,
            description,
            iconUrl,
            status
        });

        res.status(201).json({
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Category name already exists"
            });
        }

        res.status(500).json({
            message: "Failed to create category"
        });
    }
}

async function updateCategoryController(req, res) {
    try {
        const { id } = req.params;
        const { name, description, iconUrl, status } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Category name is required"
            });
        }

        const category = await updateCategory(
            id,
            {
                name,
                description,
                iconUrl,
                status
            }
        );

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: "Category updated successfully",
            data: category
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Category name already exists"
            });
        }

        console.log(error);

        res.status(500).json({
            message: "Failed to update category"
        });
    }
}

async function updateCategoryStatusController(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        if (status !== "active" && status !== "inactive") {
            return res.status(400).json({
                message: "Status must be active or inactive"
            });
        }

        const category = await updateCategoryStatus(id, status);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: "Category status updated successfully",
            data: category
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to update category status",
            error: error.message
        });
    }
}

async function deleteCategoryController(req, res) {
    try {
        const { id } = req.params;

        const category = await deleteCategory(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found"
            });
        }

        res.status(200).json({
            message: "Category deleted successfully",
            data: category
        });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to delete category",
            error: error.message
        });
    }
}

module.exports = {
    getCategories,
    createCategoryController,
    updateCategoryController,
    updateCategoryStatusController,
    deleteCategoryController
};