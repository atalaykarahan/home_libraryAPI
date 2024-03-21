import express from "express";
import * as ReadingController from "../controller/reading";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", requiresAuth, ReadingController.getMyReadings);

router.get(
  "/addMyReading/:book_id/:status_id",
  requiresAuth,
  ReadingController.addMyReading
);

router.delete("/:reading_id", requiresAuth, ReadingController.removeMyReading);

router.patch("/", requiresAuth, ReadingController.updateMyReading);

router.get("/:reading_id", requiresAuth, ReadingController.getMyReading);

export default router;
