import { RequestHandler } from "express";
import UserModel from "../models/user";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";

export const getUsers: RequestHandler = async (req, res, next) => {
  try {
    UserModel.findAll().then((u) => {
      res.status(200).json(u);
    });
  } catch (error) {
    next(error);
  }
};

// interface CreateUserBody {
//   user_name?: string;
//   password?: string;
//   email?: string;
//   authority_id?: number;
// }

// export const createUser: RequestHandler<
//   unknown,
//   unknown,
//   CreateUserBody,
//   unknown
// > = async (req, res, next) => {
//   const user_name = req.body.user_name;
//   const password = req.body.password;
//   const email = req.body.email;
//   const authority_id = req.body.authority_id;

//   try {
//     if (!user_name) {
//       throw createHttpError(400, "User must have a 'user name'");
//     } else if (!password) {
//       throw createHttpError(400, "User must have a 'password'");
//     } else if (!authority_id) {
//       throw createHttpError(400, "User must have a 'authority'");
//     }

//     const newUser = await UserModel.create({
//       user_name: user_name,
//       password: password,
//       email: email,
//       authority_id: authority_id,
//     });

//     res.status(201).json(newUser);
//   } catch (error) {
//     next(error);
//   }
// };

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

interface UpdateUserParams {
  user_id: number;
}

interface UpdateUserBody {
  user_name?: string;
  password?: string;
  email?: string;
  authority_id?: number;
}

export const updateUser: RequestHandler<
  UpdateUserParams,
  unknown,
  UpdateUserBody,
  unknown
> = async (req, res, next) => {
  const user_id = req.params.user_id;
  const newUserName = req.body.user_name;
  const newPassword = req.body.password;
  const newEmail = req.body.email;
  const newAuthorityId = req.body.authority_id;

  try {
    //error invalid user id format
    if (!user_id || isNaN(Number(user_id))) {
      throw createHttpError(400, "Invalid 'user id' format");
    }
    if (!newUserName) {
      throw createHttpError(400, "Missing parameter : 'user name'");
    }

    const user = await UserModel.findByPk(user_id);

    //error user not found
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    /* Normalde kullanici olusturulurken password ve authority zorunlu alan
      /* Bundan dolayi modeli null olabilir yapmak yerine burda if kontrolu yapmak 
      /* daha makul geldi */
    user.user_name = newUserName;
    if (newPassword) user.password = newPassword;
    user.email = newEmail;
    if (newAuthorityId) user.authority_id = newAuthorityId;

    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  const user_id = req.params.user_id;

  try {
    //error invalid user id format
    if (!user_id || isNaN(Number(user_id))) {
      throw createHttpError(400, "Invalid 'user id' format");
    }

    const user = await UserModel.findByPk(user_id);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    await user.destroy();

    res.sendStatus(204);
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
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};
