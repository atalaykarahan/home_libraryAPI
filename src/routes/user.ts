import express from "express";
import * as UserController from "../controller/user";

const router = express.Router();

router.get("/",UserController.getUsers);

router.post("/",UserController.createUser);

router.get("/:user_id", UserController.getUser);

router.patch("/:user_id", UserController.updateUser);

export default router;