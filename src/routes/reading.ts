import express from "express";
import * as ReadingController from "../controller/reading";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", requiresAuth, ReadingController.getMyReading);

router.delete("/:reading_id", requiresAuth, ReadingController.removeMyReading);



export default router;
