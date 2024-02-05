import { RequestHandler } from "express";
import PublisherModel from "../models/publisher";
import BookModel from "../models/book";
import createHttpError from "http-errors";
import { Sequelize } from "sequelize";

export const getAllPublisher: RequestHandler = async (req, res, next) => {
  try {
    PublisherModel.findAll().then((b) => {
      res.status(200).json(b);
    });
  } catch (error) {
    next(error);
  }
};

export const insertPublisher: RequestHandler = async (req, res, next) => {
  const incomingPublisher = req.params.publisher;
  try {
    if (!incomingPublisher) throw createHttpError(400, "Missing parameters");

    //check same publisher is exists
    const publisher = await PublisherModel.findOne({
      where: { publisher_name: incomingPublisher },
    });

    if (publisher) {
      throw createHttpError(401, "This publisher already exists.");
    }

    await PublisherModel.create({
      publisher_name: turkceBuyukHarfeDonustur(incomingPublisher),
    });

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};

export const getPublishersAndBooksCount: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const result = await PublisherModel.findAll({
      attributes: [
        "publisher_name",
        [Sequelize.fn("COUNT", Sequelize.col("book_id")), "bookCount"],
      ],
      include: [
        {
          model: BookModel,
          attributes: [],
          required: false,
        },
      ],
      group: ["PUBLISHER.publisher_id"],
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

function turkceBuyukHarfeDonustur(metin: string): string {
  const harfDuzeltici: { [key: string]: string } = {
    i: "İ",
    ı: "I",
  };

  return metin
    .replace(/([iı])/g, function (match) {
      return harfDuzeltici[match];
    })
    .toUpperCase();
}
