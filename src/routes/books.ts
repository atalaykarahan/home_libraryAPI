import express from "express";
import multer from "multer";
import * as BooksController from "../controller/books";
import { requiresNotGuest } from "../middleware/auth";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//get all books
router.get("/", BooksController.getBooks);

//Add new book
router.post(
  "/insert",
  requiresNotGuest,
  upload.single("book_image"),
  BooksController.insertBook
);

//Delete book
router.delete("/:book_id", requiresNotGuest, BooksController.deleteBook);

//data-grid collapse values for users page
router.get(
  "/userBookGridCollapseList/:user_id",
  BooksController.userBookGridCollapseList
);

//get last inserted and reachable book
router.get(
  "/lastInsertedReachableBook",
  BooksController.getLastInsertedReachableBook
);

//get random book recommendation
router.get(
  "/randomBookRecommendation",
  BooksController.getRandomBookRecommendation
);

export default router;
