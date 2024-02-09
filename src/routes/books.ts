import express from "express";
import * as BooksController from "../controller/books";

const router = express.Router();

router.get("/", BooksController.getBooks);

router.post("/insert", BooksController.insertBook);

export default router;