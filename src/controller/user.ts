import { RequestHandler } from "express";
import UserModel from "../models/user";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  const authenticatedUserId = req.session.user_id;

  try {
    if (!authenticatedUserId) {
      throw createHttpError(401, "User not authenticated");
    }

    const user = await UserModel.findByPk(authenticatedUserId, {
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// SignUp
interface SignUpBody {
  user_name?: string;
  password?: string;
  email?: string;
}
export const signUp: RequestHandler<
  unknown,
  unknown,
  SignUpBody,
  unknown
> = async (req, res, next) => {
  const user_name = req.body.user_name;
  const passwordRaw = req.body.password;
  const email = req.body.email;

  try {
    if (!user_name || !passwordRaw) {
      throw createHttpError(400, "Missing parameters");
    }

    // Check same username
    const existingUsername = await UserModel.findOne({
      where: { user_name: user_name },
    });
    if (existingUsername) {
      throw createHttpError(
        409,
        "Username already taken. Please choose a different one or log in instead."
      );
    }

    // if user send a email check exists same email
    if (email) {
      const existingEmail = await UserModel.findOne({
        where: { email: email },
      });
      if (existingEmail) {
        throw createHttpError(
          409,
          "A user with this email adress already exists. Please log in instead."
        );
      }
    }

    const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const newUser = await UserModel.create({
      user_name: user_name,
      password: passwordHashed,
      email: email,
      authority_id: 1,
    });

    req.session.user_id = newUser.user_id;

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

// LOGIN
interface LoginBody {
  user_name?: string;
  password?: string;
}
export const login: RequestHandler<
  unknown,
  unknown,
  LoginBody,
  unknown
> = async (req, res, next) => {
  const user_name = req.body.user_name;
  const password = req.body.password;

  try {
    if (!user_name || !password) {
      throw createHttpError(400, "Missing parameters");
    }

    const user = await UserModel.findOne({ where: { user_name: user_name } });
    if (!user) {
      throw createHttpError(401, "Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw createHttpError(401, "Invalid credentials");
    }

    req.session.user_id = user.user_id;
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

// LOGOUT
export const logout: RequestHandler = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(200);
    }
  });
};
