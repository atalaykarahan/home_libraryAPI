import { RequestHandler } from "express";
import ReadingModel from "../models/reading";
import BookModel from "../models/book";
import PubliserModel from "../models/publisher";
import AuthorModel from "../models/author";
import StatusModel from "../models/status";
import createHttpError from "http-errors";

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

    //   const books = await BookModel.findAll({
    //     attributes: ["book_id", "book_title", "book_summary"],
    //     include: [
    //       { model: AuthorModel },
    //       { model: PublisherModel },
    //       { model: StatusModel },
    //     ],
    //   });

    //   res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};
