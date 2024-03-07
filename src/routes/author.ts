import express from "express";
import * as AuthorController from "../controller/author";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

//add author
router.post("/insert", AuthorController.insertAuthor);

//all authors and book count
router.get(
  "/getAuthorsAndBooksCount",
  AuthorController.getAuthorsAndBooksCount
);

//get all authors
router.get("/",AuthorController.getAllAuthors);

//get all authors for select box
router.get("/select",AuthorController.getAllAuthorsSelect)


//update & patch author
router.patch("/", requiresAuth, AuthorController.patchAuthor);

//delete author
router.delete("/:author_id", requiresAuth, AuthorController.deleteAuthor);


export default router;
