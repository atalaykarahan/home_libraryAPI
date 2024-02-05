import express from "express";
import * as PublisherController from "../controller/publisher";
import { requiresNotGuest } from "../middleware/auth";

const router = express.Router();

//all publishers
router.get("/", PublisherController.getAllPublisher);

//only guest cant access this route
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

export default router;
