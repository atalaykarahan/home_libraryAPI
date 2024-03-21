import express from "express";
import * as BooksController from "../controller/books";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

//get all books
router.get("/", BooksController.getBooks);

//Add new book
router.post("/insert", BooksController.insertBook);

//Delete book
router.delete("/:book_id", requiresAuth, BooksController.deleteBook);

//data-grid collapse values for users page
router.get("/userBookGridCollapseList/:user_id", BooksController.userBookGridCollapseList);


export default router;