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
  } catch (error) {
    next(error);
  }
};

export const removeMyReading: RequestHandler = async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const reading_id = req.params.reading_id;

    if (!reading_id) {
      throw createHttpError(400, "Missing parameters");
    }

    await ReadingModel.destroy({
      where: { reading_id: reading_id, user_id: user_id },
    });
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
