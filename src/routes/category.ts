import express from "express";
import * as CategoryController from "../controller/category";
import { requiresNotGuest } from "../middleware/auth";

const router = express.Router();

//all categories and book count
router.get(
  "/getCategoriesAndBooksCount",
  CategoryController.getCategoriesAndBooksCount
);

// add category
router.get(
  "/insert/:category",
  requiresNotGuest,
  CategoryController.insertCategory
);

//get all categories
router.get("/", CategoryController.getAllCategories);

//update & patch category
router.patch("/", requiresNotGuest, CategoryController.patchCategory);

//delete category
router.delete(
  "/:category_id",
  requiresNotGuest,
  CategoryController.deleteCategory
);

export default router;
