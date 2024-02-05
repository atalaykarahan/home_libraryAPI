import { RequestHandler } from "express";
import AuthorModel from "../models/author";
import LogModel from "../models/log";
import createHttpError from "http-errors";
import db from "../../db";


// INSERT
interface CreateAuthorBody {
  author_name?: string;
  author_surname?: string;
}
export const insertAuthor: RequestHandler<
  unknown,
  unknown,
  CreateAuthorBody,
  unknown
> = async (req, res, next) => {
  const t = await db.transaction();
  const author_name = req.body.author_name;
  const author_surname = req.body.author_surname;

  try {
    if (!author_name) {
      throw createHttpError(400, "Author must have a 'author name'");
    }

    const formattedName = author_name
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());

    //check same author is exists
    const author = await AuthorModel.findOne({
      where: { author_name: formattedName },
    });

    if (author) throw createHttpError(401, "This author already exists.");

    if (author_surname) {
      const formattedSurname = author_surname
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

      const createdAuthor = await AuthorModel.create(
        {
          author_name: formattedName,
          author_surname: formattedSurname,
        },
        { transaction: t }
      );

      await LogModel.create(
        {
          user_id: req.session.user_id,
          event_date: new Date(),
          author_id: createdAuthor.author_id,
          event_type_id: 22,
        },
        { transaction: t }
      );

      await t.commit();
    } else {
      const createdAuthor = await AuthorModel.create(
        {
          author_name: formattedName,
        },
        { transaction: t }
      );

      await LogModel.create(
        {
          user_id: req.session.user_id,
          event_date: new Date(),
          author_id: createdAuthor.author_id,
          event_type_id: 22,
        },
        { transaction: t }
      );

      await t.commit();
    }

    res.status(201);
  } catch (error) {
    next(error);
  }
};

