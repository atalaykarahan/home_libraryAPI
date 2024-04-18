import express from "express";
import * as PublisherController from "../controller/publisher";
import { requiresAuth, requiresNotGuest } from "../middleware/auth";

const router = express.Router();

//all publishers
router.get("/", requiresAuth, PublisherController.getAllPublisher);

//add publisher | only guest cant access this route
router.get(
  "/insert/:publisher",
  requiresNotGuest,
  PublisherController.insertPublisher
);

//all publishers and book count
router.get(
  "/getPublishersAndBooksCount",
  PublisherController.getPublishersAndBooksCount
);

//update & patch category
router.patch("/", requiresNotGuest, PublisherController.patchPublisher);

//delete category
router.delete(
  "/:publisher_id",
  requiresNotGuest,
  PublisherController.deletePublisher
);

export default router;
