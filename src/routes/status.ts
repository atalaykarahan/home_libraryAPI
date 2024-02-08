import express from "express";
import * as StatusController from "../controller/status";

const router = express.Router();

router.get("/", StatusController.getAllStatuses);

export default router;
