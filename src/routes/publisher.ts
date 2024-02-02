import express from "express";
import * as PublisherController from "../controller/publisher";

const router = express.Router();

router.get("/", PublisherController.getAllPublisher);

router.get("/insert/:publisher", PublisherController.insertPublisher);

// router.post("/",AuthorController.createAuthor);

// router.get("/:author_id", AuthorController.getAuthor);

// router.patch("/:author_id", AuthorController.updateAuthor);

// router.delete("/:author_id", AuthorController.deleteAuthor);

export default router;