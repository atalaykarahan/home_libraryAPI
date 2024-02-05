import express from "express";
import * as PublisherController from "../controller/publisher";
import { requiresNotGuest } from "../middleware/auth";

const router = express.Router();

router.get("/", PublisherController.getAllPublisher);

router.get("/insert/:publisher",requiresNotGuest, PublisherController.insertPublisher);

router.get(
  "/getPublishersAndBooksCount",
  PublisherController.getPublishersAndBooksCount
);

// router.post("/",AuthorController.createAuthor);

// router.get("/:author_id", AuthorController.getAuthor);

// router.patch("/:author_id", AuthorController.updateAuthor);

// router.delete("/:author_id", AuthorController.deleteAuthor);

export default router;
