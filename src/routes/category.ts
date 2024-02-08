import express from "express";
import * as CategoryController from "../controller/category";

const router = express.Router();

//all categories and book count
router.get(
  "/getCategoriesAndBooksCount",
  CategoryController.getCategoriesAndBooksCount
);

router.get("/insert/:category", CategoryController.insertCategory);

router.get("/", CategoryController.getAllCategories);
export default router;

