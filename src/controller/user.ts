import { RequestHandler } from "express";
import UserModel from "../models/user";
import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import env from "../util/validateEnv";
import jwt from "jsonwebtoken";

export const getAuthenticatedUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserModel.findByPk(req.session.user_id, {
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
        where: { user_email: email, user_email_verified: true },
      });
      if (existingEmail) {
        throw createHttpError(
          409,
          "A user with this email adress already exists. Please log in instead."
        );
      } else {
        const passwordHashed = await bcrypt.hash(passwordRaw, 10);

        const newUser = await UserModel.create({
          user_name: user_name,
          user_password: passwordHashed,
          user_email: email,
        });

        req.session.user_id = newUser.user_id;
        const obj = {
          id: newUser.user_id,
          email: email,
        };

        const token = jwt.sign(obj, env.JWT_SECRET_RSA, { expiresIn: "5m" });
        const confirmLink = `http://localhost:3000/new-verification?token=${token}`;
        const resend = new Resend(env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
          from: "Acme <onboarding@resend.dev>",
          to: email,
          subject: "E postanı onayla",
          html: `<p><a href="${confirmLink}">Buraya</a> tıkla</p>`,
        });

        if (error) {
          console.log("verified mail error: ", error);
          throw createHttpError(503, "Verified mail could not be sent");
        }

        const response = {
          user_id: newUser.user_id,
          user_name: newUser.user_name,
          user_email: newUser.user_email,
          user_authority_id: newUser.user_authority_id,
          mailSend: data ? true:false,
        };
        res.status(201).json(response);
      }
    } else {
      const passwordHashed = await bcrypt.hash(passwordRaw, 10);

      const newUser = await UserModel.create({
        user_name: user_name,
        user_password: passwordHashed,
      });

      req.session.user_id = newUser.user_id;
      const response = {
        user_id: newUser.user_id,
        user_authority_id: newUser.user_authority_id,
        mailSend: false,
      };
      res.status(201).json(response);
    }
  } catch (error) {
    next(error);
  }
};

// SIGNIN WITH GOOGLE
interface SignInGoogleBody {
  user_name?: string;
  email?: string;
  password?: string;
}
export const signInGoogle: RequestHandler<
  unknown,
  unknown,
  SignInGoogleBody,
  unknown
> = async (req, res, next) => {
  const user_name = req.body.user_name;
  const email = req.body.email;
  const passwordRaw = req.body.password;

  try {
    if (!user_name || !passwordRaw || !email) {
      throw createHttpError(400, "Missing parameters");
    }

    // böyle bir user var mı diye kontrol
    const user = await UserModel.findOne({
      where: { user_email: email },
    });

    //eğer böyle bir posta yok ise kullanıcı adını kontrol et ve oluştur
    if (!user) {
      const checkUserName = await UserModel.findOne({
        where: { user_name: user_name },
      });

      const passwordHashed = await bcrypt.hash(passwordRaw, 10);
      //böyle bir username yok ise
      if (!checkUserName) {
        const newUser = await UserModel.create({
          user_name: user_name,
          user_password: passwordHashed,
          user_email: email,
          user_authority_id: 1,
        });
        req.session.user_id = newUser.user_id;
        res.status(201).json(newUser);
      } else {
        //böyle bir user_name var ancak e posta yok yani user yaratıcaksın
        //ancak adı farklı olmalı
        const new_user_name = await generateUniqueUsername(user_name);
        const newUser = await UserModel.create({
          user_name: new_user_name,
          user_password: passwordHashed,
          user_email: email,
          user_authority_id: 1,
        });
        req.session.user_id = newUser.user_id;
        res.status(201).json(newUser);
      }

      // throw createHttpError(401, "Invalid credentials");
    } else {
      //eğer böyle bir user var ise şifre eşleşme
      console.log("şifresi şu-->", passwordRaw);
      const passwordMatch = await bcrypt.compare(
        passwordRaw,
        user.user_password
      );

      if (!passwordMatch) {
        throw createHttpError(
          401,
          "This email address is already registered. Please try logging in or use a different email."
        );
      }

      req.session.user_id = user.user_id;
      res.status(201).json(user);
    }
  } catch (error) {
    next(error);
  }
};

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

    const passwordMatch = await bcrypt.compare(password, user.user_password);

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

// RESET USER PASSWORD
// interface ResetBody {
//   userInputValue?: string;
// }
// export const resetUser: RequestHandler<
//   unknown,
//   unknown,
//   ResetBody,
//   unknown
// > = async (req, res, next) => {
//   const userInputValue = req.body.userInputValue;

//   try {
//     if (!userInputValue) {
//       throw createHttpError(400, "Missing parameters");
//     }

//     //if user send email ve should check so we search '@' and '.' characters
//     const isEmail =
//       userInputValue.includes("@") && userInputValue.includes(".");

//     if (isEmail) {
//       const user = await UserModel.findOne({
//         where: { email: userInputValue },
//       });

//       if (!user) {
//         throw createHttpError(404, "User does not exist");
//       }

//       res.sendStatus(200);
//     } else {
//       console.log("buraya geliyorsa sorun var");
//       const user = await UserModel.findOne({
//         where: { user_name: userInputValue },
//       });
//       if (!user) {
//         throw createHttpError(404, "User does not exist");
//       }
//       res.sendStatus(200);
//     }
//   } catch (error) {
//     next(error);
//   }
// };

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
      console.log("token doğrulandı");
      console.log(decoded);

      const user = await UserModel.findByPk(decoded.id);

      if (!user) {
        throw createHttpError(401, "Invalid credentials");
      }

      user.user_email = decoded.email;
      user.user_email_verified = true;
      await user.save();

      res.status(201).json({ message: "Email successfully verified." });
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

export const resetPassword: RequestHandler = async (req, res, next) => {
  const email = req.params.user_email;

  try {
    if (!email) {
      throw createHttpError(400, "Missing parameters");
      // throw createHttpError(404, "Mail does not exist");
    }

    const user = await UserModel.findOne({
      where: { user_email: email },
    });

    if (!user) throw createHttpError(404, "Mail does not exist");

    if (!user.user_email) throw createHttpError(404, "Mail does not exist");

    const tokenObj = {
      id: user.user_id,
      email: user.user_email,
    };

    const token = jwt.sign(tokenObj, env.JWT_PASSWORD_RESET, {
      expiresIn: "5m",
    });
    const confirmLink = `${env.WEBSITE_URL}/burayabirşeydüşünadamneyapmışbak?token=${token}`;
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
  } catch (error) {
    next(error);
  }
};
