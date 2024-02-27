import { RequestHandler } from "express";
import ReadingModel from "../models/reading";
import createHttpError from "http-errors";

export const getMyReading: RequestHandler = async (req, res, next) => {
    try {

        const user_id = req.session.user_id

        const myReadings = await ReadingModel.findAll({ where: { user_id: user_id } });
        if(!myReadings){
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
