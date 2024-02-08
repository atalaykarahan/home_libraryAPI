import express from "express";
import * as AuthorController from "../controller/author";

const router = express.Router();

router.post("/insert/", AuthorController.insertAuthor);

router.get(
  "/getAuthorsAndBooksCount",
  AuthorController.getAuthorsAndBooksCount
);

router.get("/",AuthorController.getAllAuthors);

router.get("/select",AuthorController.getAllAuthorsSelect)

export default router;
