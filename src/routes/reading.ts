import express from "express";
import * as ReadingController from "../controller/reading";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", requiresAuth, ReadingController.getMyReading);

router.get("/addMyReading/:book_id/:status_id", requiresAuth, ReadingController.addMyReading);

router.delete("/:reading_id", requiresAuth, ReadingController.removeMyReading);



export default router;
