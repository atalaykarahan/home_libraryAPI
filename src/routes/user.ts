import express from "express";
import * as UserController from "../controller/user";
import {
  requiresAuth,
  requiresNotGuest,
  requiresOnlyAdmin,
} from "../middleware/auth";

const router = express.Router();

//chech if user has a valid session
router.get("/", requiresAuth, UserController.getAuthenticatedUser);

//sign up user
router.post("/signup", UserController.signUp);

//login
router.post("/login", UserController.login);

//logout and clear session
router.post("/logout", requiresAuth, UserController.logout);

//email verified
router.post("/email-verified", UserController.emailVerified);

//change password request token get email
router.get("/reset/:userInputValue", UserController.resetPassword);

//update password with token
router.post("/new-password", UserController.newPassword);

//data-grid values for users page
router.get("/userBookGridList", UserController.userBookGridList);

//update user visibility
router.patch(
  "/update-visibility",
  requiresNotGuest,
  UserController.updateVisibility
);

//get all users for admin
router.get("/get-all-users", requiresOnlyAdmin, UserController.getAllUsers);

//update user authority
router.patch(
  "/update-user-authority",
  requiresOnlyAdmin,
  UserController.updateUserAuthority
);

//get user visiblity settings for statement
router.get("/get-my-visibility",requiresAuth, UserController.getMyVisibility )

export default router;
