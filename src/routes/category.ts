import express from "express";
import * as CategoryController from "../controller/category";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

//all categories and book count
router.get(
  "/getCategoriesAndBooksCount",
  CategoryController.getCategoriesAndBooksCount
);

// add category
router.get("/insert/:category", CategoryController.insertCategory);

//get all categories
router.get("/", CategoryController.getAllCategories);

//update & patch category
router.patch("/", requiresAuth, CategoryController.patchCategory);

export default router;
