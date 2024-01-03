import express from "express";
import * as AuthorController from "../controller/author";

const router = express.Router();

router.get("/", AuthorController.getAuthors);

router.post("/",AuthorController.createAuthor);

router.get("/:author_id", AuthorController.getAuthor);

router.patch("/:author_id", AuthorController.updateAuthor);

router.delete("/:author_id", AuthorController.deleteAuthor);

export default router;