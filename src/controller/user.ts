import { RequestHandler } from "express";
import UserModel from "../models/user";
import createHttpError from "http-errors";

export const getUsers: RequestHandler = async (req, res, next) => {
  try {
    UserModel.findAll().then((u) => {
      res.status(200).json(u);
    });
  } catch (error) {
    next(error);
  }
};

interface CreateUserBody {
  user_name?: string;
  password?: string;
  email?: string;
  authority_id?: number;
}

export const createUser: RequestHandler<
  unknown,
  unknown,
  CreateUserBody,
  unknown
> = async (req, res, next) => {
  const user_name = req.body.user_name;
  const password = req.body.password;
  const email = req.body.email;
  const authority_id = req.body.authority_id;

  try {
    if (!user_name) {
      throw createHttpError(400, "User must have a 'user name'");
    } else if (!password) {
      throw createHttpError(400, "User must have a 'password'");
    } else if (!authority_id) {
      throw createHttpError(400, "User must have a 'authority'");
    }

    const newUser = await UserModel.create({
      user_name: user_name,
      password: password,
      email: email,
      authority_id: authority_id,
    });

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

export const getUser: RequestHandler = async (req, res, next) => {
  const user_id = req.params.user_id;

  try {
    //error invalid user id format
    if (!user_id || isNaN(Number(user_id))) {
      throw createHttpError(400, "Invalid 'user id' format");
    }

    const user = await UserModel.findByPk(user_id);

    //error user not found
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
