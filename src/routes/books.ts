import express from "express";
import * as BooksController from "../controller/books";

const router = express.Router();

router.get("/", BooksController.getBooks);

export default router;