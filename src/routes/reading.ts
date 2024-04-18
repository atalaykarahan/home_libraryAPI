import express from "express";
import multer from "multer";
import * as ReadingController from "../controller/reading";
import { requiresAuth, requiresNotGuest } from "../middleware/auth";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/", requiresAuth, ReadingController.getMyReadings);

router.get(
  "/addMyReading/:book_id/:status_id",
  requiresNotGuest,
  ReadingController.addMyReading
);

router.delete(
  "/:reading_id",
  requiresNotGuest,
  ReadingController.removeMyReading
);

router.patch(
  "/",
  requiresNotGuest,
  upload.single("book_image"),
  ReadingController.updateMyReading
);

router.get("/:reading_id", requiresNotGuest, ReadingController.getMyReading);

export default router;
