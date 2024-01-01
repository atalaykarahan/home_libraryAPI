import { RequestHandler } from "express";
import BookModel from "../models/book";

export const getBooks: RequestHandler = async (req, res, next) => {
  try {
    BookModel.findAll()
      .then((b) => {
        res.status(200).json(b);
      })
      .catch((err) => console.log(err));
  } catch (error) {
    next(error);
  }
};
