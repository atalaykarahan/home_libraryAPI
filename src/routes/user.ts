import express from "express";
import * as UserController from "../controller/user";
import { requiresAuth } from "../middleware/auth";

const router = express.Router();

router.get("/", requiresAuth, UserController.getAuthenticatedUser);
router.post("/signup", UserController.signUp);
router.post("/login", UserController.login);
router.post("/login/google", UserController.signInGoogle);
router.post("/logout", UserController.logout);
router.post("/email-verified", UserController.emailVerified);
router.get("/reset/:userInputValue", UserController.resetPassword);
router.post("/new-password", UserController.newPassword);


export default router;
