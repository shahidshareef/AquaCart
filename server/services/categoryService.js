const Category = require("../models/Category");

function getAllCategories() {
    return Category.find().sort({ createdAt: -1 });
}

async function createCategory(categoryData) {
    const category = new Category(categoryData);

    return category.save();
}

async function updateCategory(categoryId, categoryData) {
    return Category.findByIdAndUpdate(
        categoryId,
        categoryData,
        {
            new: true,
            runValidators: true
        }
    );
}

async function updateCategoryStatus(categoryId, status) {
    return Category.findByIdAndUpdate(
        categoryId,
        { status },
        {
            new: true,
            runValidators: true
        }
    );
}

async function deleteCategory(categoryId) {
    return Category.findByIdAndDelete(categoryId);
}

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    updateCategoryStatus,
    deleteCategory
};