const express = require("express");

const {
    getCategories,
    createCategoryController,
    updateCategoryController,
    updateCategoryStatusController,
    deleteCategoryController
} = require("../controllers/categoryController");

const router = express.Router();

router.get("/", getCategories);

router.post("/", createCategoryController);

router.put("/:id", updateCategoryController);

router.patch("/:id/status", updateCategoryStatusController);

router.delete("/:id", deleteCategoryController);

module.exports = router;