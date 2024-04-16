import { RequestHandler } from "express";
import UserModel from "../models/user";
import ReadingModel from "../models/reading";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import env from "../util/validateEnv";
import jwt from "jsonwebtoken";
import BookModel from "../models/book";
import BookCategoryModel from "../models/book_category";
import CategoryModel from "../models/category";
import { DecimalDataType } from "sequelize";
import { Sequelize } from "sequelize";
import { EventTypeEnum, StatusEnum } from "../util/enums";
import db from "../../db";
import LogModel from "../models/log";

//#region AUTHENTICATED USER
export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserModel.findByPk(req.session.user_id, {
      attributes: { exclude: ["user_password"] },
    });
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
//#endregion AUTHENTICATED USER

//#region SIGNUP
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
    if (!user_name || !passwordRaw || !email) {
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

    const existingEmail = await UserModel.findOne({
      where: { user_email: email, user_email_verified: true },
    });

    if (existingEmail) {
      throw createHttpError(
        409,
        "A user with this email adress already exists. Please log in instead."
      );
    }

    const obj = {
      user_name: user_name,
      email: email,
      password: passwordRaw,
    };

    const token = jwt.sign(obj, env.JWT_SECRET_RSA, { expiresIn: "5m" });
    const confirmLink = `http://localhost:3000/new-verification?token=${token}`;
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: email,
      subject: "Hesabını onayla",
      html: `<p><a href="${confirmLink}">Buraya</a> tıkla</p>`,
    });

    if (error) {
      console.log("verified mail error: ", error);
      throw createHttpError(503, "Verified mail could not be sent");
    }

    res.status(201).json({ message: "mail sent" });
  } catch (error) {
    next(error);
  }
};
//#endregion SIGNUP

//#region LOGIN
interface LoginBody {
  user_name?: string;
  password?: string;
  email: string;
  google_id?: string;
}
export const login: RequestHandler<
  unknown,
  unknown,
  LoginBody,
  unknown
> = async (req, res, next) => {
  const user_name = req.body.user_name;
  const password = req.body.password;
  const email = req.body.email;
  const google_id = req.body.google_id;

  try {
    if (!user_name || !password) {
      throw createHttpError(400, "Missing parameters");
    }

    //if user try to login with google account
    if (google_id) {
      const user = await UserModel.findOne({
        where: { user_google_id: google_id },
      });

      // if google id user exist
      if (user) {
        console.log(
          "normalde sadece buraya düşmeli yani bu google id değerine sahip bir user var ve o user'ı dönmeli"
        );
        req.session.user_id = user.user_id;
        req.session.user_authority_id = user.user_authority_id;
        res.status(201).json(createResponseFromUser(user));
      } else {
        const user = await UserModel.findOne({
          where: { user_email: email, user_email_verified: true },
        });

        //if email exist
        if (user) {
          console.log("buraya düştü");
          user.user_google_id = google_id;
          await user.save();
          req.session.user_id = user.user_id;
          req.session.user_authority_id = user.user_authority_id;
          res.status(201).json(createResponseFromUser(user));
        } else {
          //create user
          const checkUserName = await UserModel.findOne({
            where: { user_name: user_name },
          });

          const passwordHashed = await bcrypt.hash(google_id.toString(), 10);
          //böyle bir username yok ise
          if (!checkUserName) {
            const newUser = await UserModel.create({
              user_name: user_name,
              user_password: passwordHashed,
              user_email: email,
              user_email_verified: true,
              user_google_id: google_id,
            });

            req.session.user_id = newUser.user_id;
            res.status(201).json(createResponseFromUser(newUser));
          } else {
            //create new user name after create new user

            const newUser = await UserModel.create({
              user_name: await generateUniqueUsername(user_name),
              user_password: passwordHashed,
              user_email: email,
              user_email_verified: true,
              user_google_id: google_id,
            });

            req.session.user_id = newUser.user_id;
            res.status(201).json(createResponseFromUser(newUser));
          }
        }
      }
    } else {
      // if user try login with email

      const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if (emailRegex.test(user_name)) {
        const user = await UserModel.findOne({
          where: { user_email: user_name, user_email_verified: true },
        });
        if (!user) {
          throw createHttpError(401, "Invalid credentials");
        }

        const passwordMatch = await bcrypt.compare(
          password,
          user.user_password
        );

        if (!passwordMatch) {
          throw createHttpError(401, "Invalid credentials");
        }

        req.session.user_id = user.user_id;
        req.session.user_authority_id = user.user_authority_id;
        res.status(201).json(createResponseFromUser(user));
      } else {
        //if user try login with user name
        const user = await UserModel.findOne({
          where: { user_name: user_name },
        });
        if (!user) {
          throw createHttpError(401, "Invalid credentials");
        }

        const passwordMatch = await bcrypt.compare(
          password,
          user.user_password
        );

        if (!passwordMatch) {
          throw createHttpError(401, "Invalid credentials");
        }

        req.session.user_id = user.user_id;
        req.session.user_authority_id = user.user_authority_id;
        res.status(201).json(createResponseFromUser(user));
      }
    }
  } catch (error) {
    next(error);
  }
};
//#endregion LOGIN

//#region LOGOUT
export const logout: RequestHandler = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(200);
    }
  });
};
//#endregion LOGOUT

//#region EMAIL VERIFIED
interface EmailVerifiedBody {
  token?: string;
}
export const emailVerified: RequestHandler<
  unknown,
  unknown,
  EmailVerifiedBody,
  unknown
> = async (req, res, next) => {
  const incomingToken = req.body.token;

  try {
    if (!incomingToken) {
      throw createHttpError(400, "Missing parameters");
    }
    const decoded = jwt.verify(incomingToken, env.JWT_SECRET_RSA);

    if (decoded && typeof decoded !== "string") {
      console.log("gelen token burda", decoded);
      //  const user = await UserModel.findByPk(decoded.id);

      // Check same username
      const existingUsername = await UserModel.findOne({
        where: { user_name: decoded.user_name },
      });

      if (existingUsername) {
        throw createHttpError(
          409,
          "Username already taken. Please choose a different one or log in instead."
        );
      }

      // Check same email
      const existingEmail = await UserModel.findOne({
        where: { user_email: decoded.email },
      });

      if (existingEmail) {
        throw createHttpError(
          409,
          "Username already taken. Please choose a different one or log in instead."
        );
      }

      const passwordHashed = await bcrypt.hash(decoded.password, 10);

      await UserModel.create({
        user_name: decoded.user_name,
        user_email: decoded.email,
        user_email_verified: true,
        user_password: passwordHashed,
      });

      res.status(201).json({ message: "User successfully created!" });
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // When token has been expired we have a custom error message for that
      return res.status(401).json({
        error:
          "Your token has been expired. Please try again verification process.",
      });
    }
    next(error);
  }
};
//#endregion EMAIL VERIFIED

//#region RESET PASSWORD
export const resetPassword: RequestHandler = async (req, res, next) => {
  const userInputValue = req.params.userInputValue;

  try {
    if (!userInputValue) {
      throw createHttpError(400, "Missing parameters");
      // throw createHttpError(404, "Mail does not exist");
    }

    let user = await UserModel.findOne({
      where: { user_email: userInputValue, user_email_verified: true },
    });

    if (!user) {
      user = await UserModel.findOne({
        where: { user_name: userInputValue, user_email_verified: true },
      });
    }

    if (!user || !user.user_email)
      throw createHttpError(404, "Mail does not exist");

    const tokenObj = {
      id: user.user_id,
      email: user.user_email,
    };

    const token = jwt.sign(tokenObj, env.JWT_PASSWORD_RESET, {
      expiresIn: "5m",
    });
    const confirmLink = `${env.WEBSITE_URL}/new-password?token=${token}`;
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: user.user_email,
      subject: "Şifreni sıfırla",
      html: `<p><a href="${confirmLink}">Buraya</a> tıkla</p>`,
    });

    if (error) {
      console.log("verified mail error: ", error);
      throw createHttpError(503, "Reset mail could not be sent");
    }

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
//#endregion RESET PASSWORD

//#region NEW PASSWORD
interface NewPasswordBody {
  password?: string;
  token?: string;
}
export const newPassword: RequestHandler<
  unknown,
  unknown,
  NewPasswordBody,
  unknown
> = async (req, res, next) => {
  const password = req.body.password;
  const token = req.body.token;

  try {
    if (!token || !password) throw createHttpError(400, "Missing parameters");

    const decoded = jwt.verify(token, env.JWT_PASSWORD_RESET);

    if (decoded && typeof decoded !== "string") {
      console.log("Token doğrulandı ->", decoded);
      console.log("kullanıcının verdiği şifre ->", password);

      const user = await UserModel.findOne({
        where: {
          user_id: decoded.id,
          user_email: decoded.email,
          user_email_verified: true,
        },
      });

      if (!user) throw createHttpError(401, "User not found!");
      const passwordHashed = await bcrypt.hash(password, 10);
      user.user_password = passwordHashed;
      await user.save();

      res.status(201).json({ message: "Password successfully changed." });
    } else {
      //invalid token error
      throw createHttpError(503, "Server error");
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      // When token has been expired we have a custom error message for that
      return res.status(401).json({
        error:
          "Your token has been expired. Please try again verification process.",
      });
    }
    next(error);
  }
};

//#endregion

//#region USER BOOK GRID LIST
export const userBookGridList: RequestHandler = async (req, res, next) => {
  try {
    const users = await UserModel.findAll({
      attributes: [
        "user_id",
        "user_name",
        "user_library_visibility",
        [
          Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "READING" AS "reading"
          WHERE
              "reading"."user_id" = "user"."user_id" 
              AND "reading"."deletedAt" IS NULL
      )`),
          "interacted_book_count",
        ],
        [
          Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "READING" AS "reading"
          WHERE
              "reading"."user_id" = "user"."user_id" 
              AND "reading"."status_id" = ${StatusEnum.okundu}
              AND "reading"."deletedAt" IS NULL

      )`),
          "completed_book_count",
        ],
        [
          Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "READING" AS "reading"
          WHERE
              "reading"."user_id" = "user"."user_id" 
              AND "reading"."status_id" = ${StatusEnum.yarim_birakildi}
              AND "reading"."deletedAt" IS NULL
      )`),
          "abandoned_book_count",
        ],
        [
          Sequelize.literal(`(
            SELECT CONCAT(author.author_name, ' ', author.author_surname) AS author_full_name
            FROM "READING" as "reading"
            LEFT JOIN "BOOK" as "book" on "book"."book_id" = "reading"."book_id"
            LEFT JOIN "AUTHOR" as "author" on "author"."author_id" = "book"."author_id"
            where "reading"."user_id" = "user"."user_id"
            and "reading"."deletedAt" IS null
            GROUP BY CONCAT(author.author_name, ' ', author.author_surname)
            ORDER BY COUNT(*) DESC
            LIMIT 1
      )`),
          "favorite_author",
        ],
      ],
      where: { user_visibility: false },
    });

    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region UPDATE VISIBILITY
interface UpdateVisibilityBody {
  user_library_visibility?: boolean;
  user_visibility?: boolean;
}
export const updateVisibility: RequestHandler<
  unknown,
  unknown,
  UpdateVisibilityBody,
  unknown
> = async (req, res, next) => {
  const user_library_visibility = req.body.user_library_visibility;
  const user_visibility = req.body.user_visibility;
  const user_id = req.session.user_id;
  const t = await db.transaction();
  const description = "user change his visibility";
  const invisible = true;
  const visible = false;

  try {
    const user = await UserModel.findByPk(user_id);
    if (!user) throw createHttpError(404, "User not found");

    //if user make himself invisible
    if (user_visibility) {
      user.user_visibility = invisible;
      user.user_library_visibility = invisible;
      await user.save({ transaction: t });
    } else if (!user_library_visibility) {
      //if user make only library visible
      user.user_visibility = visible;
      user.user_library_visibility = visible;
      await user.save({ transaction: t });
    } else if (user_library_visibility) {
      //if user make only library visible
      user.user_visibility = visible;
      user.user_library_visibility = invisible;
      await user.save({ transaction: t });
    }

    await LogModel.create(
      {
        user_id: user_id,
        event_type_id: EventTypeEnum.user_update,
        description: description,
      },
      { transaction: t }
    );

    await t.commit();
    res.sendStatus(200);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};
//#endregion

//#region FUNCTIONS
interface userResponseParam {
  user_id: string;
  user_name: string;
  user_password: string;
  user_email?: string;
  user_authority_id?: string;
  user_email_verified?: boolean;
  user_google_id?: string;
}
function createResponseFromUser(user: userResponseParam) {
  return {
    user_id: user.user_id,
    user_name: user.user_name,
    user_email: user.user_email,
    user_authority_id: user.user_authority_id,
    user_email_verified: user.user_email_verified,
    user_google_id: user.user_google_id,
  };
}

async function generateUniqueUsername(baseUsername: string) {
  let uniqueUsername = baseUsername;
  let userExists = true;
  while (userExists) {
    const user = await UserModel.findOne({
      where: { user_name: uniqueUsername },
    });
    if (!user) {
      userExists = false;
    } else {
      const randomNum = Math.floor(Math.random() * 1000); // 0 ile 999 arasında rastgele bir sayı
      uniqueUsername = `${baseUsername}${randomNum}`;
    }
  }
  return uniqueUsername;
}

// function isEmail(inputValue: string) {
//   const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
//   return regex.test(inputValue);
// }

//#endregion FUNCTIONS
