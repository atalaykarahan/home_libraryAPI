import express from "express";
import * as ReadingController from "../controller/reading";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", requiresAuth, ReadingController.getMyReading);



export default router;
