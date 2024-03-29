import { RequestHandler } from "express";
import AuthorModel from "../models/author";
import LogModel from "../models/log";
import BookModel from "../models/book";
import createHttpError from "http-errors";
import db from "../../db";
import { Op, Sequelize, Transaction } from "sequelize";
import { EventTypeEnum } from "../util/enums";

//#region INSERT AUTHOR
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

    if (author) throw createHttpError(409, "This author already exists.");

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
          event_type_id: EventTypeEnum.author_create,
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
          event_type_id: EventTypeEnum.author_create,
        },
        { transaction: t }
      );

      await t.commit();
    }

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region GET ALL AUTHORS AND BOOKS COUNT
export const getAuthorsAndBooksCount: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const result = await AuthorModel.findAll({
      attributes: [
        "author_id",
        "author_name",
        "author_surname",
        [Sequelize.fn("COUNT", Sequelize.col("book_id")), "bookCount"],
      ],
      include: [
        {
          model: BookModel,
          attributes: [],
          required: false,
        },
      ],
      group: ["AUTHOR.author_id"],
    });

    console.log(result);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region GET ALL AUTHORS
export const getAllAuthors: RequestHandler = async (req, res, next) => {
  try {
    const result = await AuthorModel.findAll();
    if (result) {
      res.status(200).json(result);
    } else {
      throw createHttpError(404, "No authors found");
    }
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region GET ALL AUTHORS FOR SELECT BOX
export const getAllAuthorsSelect: RequestHandler = async (req, res, next) => {
  try {
    const result = await AuthorModel.findAll();
    if (result) {
      const formattedAuthors = result.map((author) => ({
        label: author.author_surname
          ? `${author.author_name} ${author.author_surname}`
          : author.author_name,
        value: author.author_id,
      }));
      res.status(200).json(formattedAuthors);
    } else {
      throw createHttpError(404, "No authors found");
    }
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region PATCH & UPDATE AUTHOR
interface PatchAuthorBody {
  author_name?: string;
  author_surname?: string;
  author_id?: string;
}
export const patchAuthor: RequestHandler<
  unknown,
  unknown,
  PatchAuthorBody,
  unknown
> = async (req, res, next) => {
  const author_name = req.body.author_name;
  const author_surname = req.body.author_surname;
  const author_id = req.body.author_id;
  const user_id = req.session.user_id;

  const t = await db.transaction();

  try {
    if (!author_name || !author_surname || !author_id || !user_id)
      throw createHttpError(400, "Missing parameters");

    const authorCreateLog = await LogModel.findOne({
      where: {
        author_id: author_id,
        event_type_id: EventTypeEnum.author_create,
        user_id: user_id,
      },
    });

    if (!authorCreateLog)
      throw createHttpError(403, "You are not authorized to update this data.");

    const author = await AuthorModel.findByPk(author_id);

    if (!author) throw createHttpError(404, "Author not found");

    author.author_name = author_name;
    author.author_surname = author_surname;

    await author.save({ transaction: t });

    await LogModel.create(
      {
        user_id: user_id,
        event_type_id: EventTypeEnum.author_update,
        author_id: author.author_id,
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

//#region DELETE AUTHOR
export const deleteAuthor: RequestHandler = async (req, res, next) => {
  const author_id = req.params.author_id;
  const user_id = req.session.user_id;
  const t = await db.transaction();

  try {
    if (!author_id) throw createHttpError(400, "Missing parameters");

    const createAuthorLog = await LogModel.findOne({
      where: {
        author_id: author_id,
        event_type_id: EventTypeEnum.author_create,
        user_id: user_id,
      },
    });

    if (!createAuthorLog)
      throw createHttpError(403, "You are not authorized to delete this data.");

    const book_ids = await BookModel.findAll({
      where: { author_id: author_id },
    });

    if (book_ids.length > 0)
      throw createHttpError(
        409,
        "There are books associated with this author. You cannot delete it."
      );

    await AuthorModel.destroy({
      where: { author_id: author_id },
      transaction: t,
    });

    await LogModel.create(
      {
        user_id: user_id,
        author_id: author_id,
        event_type_id: EventTypeEnum.author_delete,
      },
      { transaction: t }
    );

    await t.commit();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region FUNCTIONS

//#region INSERT AUTHOR FUNCTION

export const insertAuthorFunction = async (
  userId: string,
  name: string,
  transac: Transaction
) => {
  const existingAuthorList = await AuthorModel.findAll({
    where: Sequelize.literal(
      `CONCAT("author_name", ' ', author_surname) ILIKE '%${name}%'`
    ),
  });

  if (existingAuthorList.length > 0)
    throw createHttpError(409, "this author already exists.");

  const words = name.split(" ");

  if (words.length > 1) {
    const lastName = words.pop();
    const firstName = words.join(" ");

    const createdAuthor = await AuthorModel.create(
      {
        author_name: firstName,
        author_surname: lastName,
      },
      { transaction: transac }
    );
    await LogModel.create(
      {
        user_id: userId,
        event_date: new Date(),
        author_id: createdAuthor.author_id,
        event_type_id: EventTypeEnum.author_create,
      },
      { transaction: transac }
    );
    return createdAuthor.author_id;
  } else {
    const createdAuthor = await AuthorModel.create(
      {
        author_name: name,
      },
      { transaction: transac }
    );
    await LogModel.create(
      {
        user_id: userId,
        event_date: new Date(),
        author_id: createdAuthor.author_id,
        event_type_id: EventTypeEnum.author_create,
      },
      { transaction: transac }
    );
    return createdAuthor.author_id;
  }
};

//#endregion

//#endregion
