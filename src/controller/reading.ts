import { RequestHandler } from "express";
import ReadingModel from "../models/reading";
import BookModel from "../models/book";
import PubliserModel from "../models/publisher";
import AuthorModel from "../models/author";
import StatusModel from "../models/status";
import LogModel from "../models/log";
import createHttpError from "http-errors";
import db from "../../db";

export const getMyReading: RequestHandler = async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    const myReadings = await ReadingModel.findAll({
      attributes: ["reading_id"],
      where: { user_id: user_id },
      include: [
        {
          model: BookModel,
          attributes: ["book_id", "book_title", "image_path"],
          include: [{ model: PubliserModel }, { model: AuthorModel }],
        },
        { model: StatusModel },
      ],
    });
    if (!myReadings) {
      throw createHttpError(404, "You have no reading record");
    }

    res.status(200).json(myReadings);
  } catch (error) {
    next(error);
  }
};

export const removeMyReading: RequestHandler = async (req, res, next) => {
  const user_id = req.session.user_id;
  const reading_id = req.params.reading_id;
  try {
    if (!reading_id) {
      throw createHttpError(400, "Missing parameters");
    }

    await ReadingModel.destroy({
      where: { reading_id: reading_id, user_id: user_id },
    });

    await LogModel.create({
      user_id: user_id,
      event_type_id: 29,
      reading_id: parseInt(reading_id),
    });

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export const addMyReading: RequestHandler = async (req, res, next) => {
  const t = await db.transaction();
  const book_id = req.params.book_id;
  const status_id = req.params.status_id;
  const user_id = req.session.user_id;
  try {
    if (!book_id || !status_id || !user_id)
      throw createHttpError(400, "Missing parameters");

    //check if user already add the book
    const isExist = await ReadingModel.findOne({
      where: {
        user_id: user_id,
        book_id: book_id,
      },
    });

    if (isExist) throw createHttpError(400, "You already add this book");

    //check if status is correct
    if (!["1", "3", "4"].includes(status_id))
      throw createHttpError(500, "Server error invalid status");

    //control if book is exists
    const book = await BookModel.findByPk(book_id);
    if (!book) throw createHttpError(500, "book is exists");

    /* if someone already reading this book or 
     * user is want to reading this book we changed this book status */
    if (status_id == "1" && [11, 6, 2].includes(book.status_id)) {
      book.status_id = 12;
      await book.save();
    } else if (status_id == "1" && book.status_id == 12) {
      throw createHttpError(500, "Someone already reading this book");
    }

    const createdReading = await ReadingModel.create(
      {
        user_id: user_id,
        book_id: parseInt(book_id),
        status_id: parseInt(status_id),
      },
      { transaction: t }
    );

    await LogModel.create(
      {
        user_id: user_id,
        book_id: parseInt(book_id),
        event_type_id: 28,
        reading_id: createdReading.reading_id,
      },
      { transaction: t }
    );

    await t.commit();

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};
