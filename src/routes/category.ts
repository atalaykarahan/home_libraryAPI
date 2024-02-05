import express from "express";
import * as CategoryController from "../controller/category";

const router = express.Router();

//all categories and book count
router.get(
    "/getCategoriesAndBooksCount",
    CategoryController.getCategoriesAndBooksCount
  );
export default router;
