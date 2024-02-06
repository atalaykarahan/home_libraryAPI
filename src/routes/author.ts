import express from "express";
import * as AuthorController from "../controller/author";

const router = express.Router();

router.post("/insert/", AuthorController.insertAuthor);

router.get(
  "/getAuthorsAndBooksCount",
  AuthorController.getAuthorsAndBooksCount
);

export default router;
