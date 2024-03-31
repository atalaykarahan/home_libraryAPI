import express from "express";
import * as ReadingController from "../controller/reading";
import { requiresAuth } from "../middleware/auth";
import multer from "multer";

const router = express.Router();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })


router.get("/", requiresAuth, ReadingController.getMyReadings);

router.get(
  "/addMyReading/:book_id/:status_id",
  requiresAuth,
  ReadingController.addMyReading
);

router.delete("/:reading_id", requiresAuth, ReadingController.removeMyReading);

router.patch("/", requiresAuth, upload.single("book_image"), ReadingController.updateMyReading);

router.get("/:reading_id", requiresAuth, ReadingController.getMyReading);

export default router;
