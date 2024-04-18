import express from "express";
import * as AuthorController from "../controller/author";
import { requiresNotGuest } from "../middleware/auth";

const router = express.Router();

//add author
router.post("/insert", requiresNotGuest, AuthorController.insertAuthor);

//all authors and book count
router.get(
  "/getAuthorsAndBooksCount",
  AuthorController.getAuthorsAndBooksCount
);

//get all authors
router.get("/", AuthorController.getAllAuthors);

//get all authors for select box
router.get("/select", AuthorController.getAllAuthorsSelect);

//update & patch author
router.patch("/", requiresNotGuest, AuthorController.patchAuthor);

//delete author
router.delete("/:author_id", requiresNotGuest, AuthorController.deleteAuthor);

export default router;
