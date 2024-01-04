import express from "express";
import * as UserController from "../controller/user";

const router = express.Router();

router.get("/", UserController.getAuthenticatedUser);

router.post("/signup", UserController.signUp);

router.post("/login",UserController.login);

// router.get("/", UserController.getUsers);

// router.post("/",UserController.createUser);

router.get("/:user_id", UserController.getUser);

router.patch("/:user_id", UserController.updateUser);

router.delete("/:user_id", UserController.deleteUser);

export default router;
