import express from "express";
import * as BooksController from "../controller/books";
import { requiresAuth } from "../middleware/auth";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

//get all books
router.get("/", BooksController.getBooks);

//Add new book
router.post("/insert", requiresAuth, upload.single("book_image"), BooksController.insertBook);

//Delete book
router.delete("/:book_id", requiresAuth, BooksController.deleteBook);

//data-grid collapse values for users page
router.get("/userBookGridCollapseList/:user_id", BooksController.userBookGridCollapseList);

//get last inserted and reachable book
router.get("/lastInsertedReachableBook", BooksController.getLastInsertedReachableBook)


export default router;