import express from "express";
import * as UserController from "../controller/user";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", requiresAuth, UserController.getAuthenticatedUser);

router.post("/signup", UserController.signUp);

router.post("/login",UserController.login);

router.post("/login/google", UserController.signInGoogle);

router.post("/logout",UserController.logout);

router.post("/check",UserController.checkUser);

// router.get("/:user_id",UserController.getUserById);

// router.get("/:user_id", UserController.getUser);

// router.patch("/:user_id", UserController.updateUser);

// router.delete("/:user_id", UserController.deleteUser);

export default router;
