import { RequestHandler } from "express";
import PublisherModel from "../models/publisher";
import LogModel from "../models/log";
import BookModel from "../models/book";
import createHttpError from "http-errors";
import { Sequelize } from "sequelize";
import db from "../../db";
import { EventTypeEnum } from "../util/enums";
import { turkceBuyukHarfeDonustur } from "../custom-functions";

//#region GET ALL PUBLISHERS
export const getAllPublisher: RequestHandler = async (req, res, next) => {
  try {
    PublisherModel.findAll().then((b) => {
      res.status(200).json(b);
    });
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region INSERT PUBLISHER
export const insertPublisher: RequestHandler = async (req, res, next) => {
  const incomingPublisher = req.params.publisher;
  const t = await db.transaction();

  try {
    if (!incomingPublisher) throw createHttpError(400, "Missing parameters");

    //check same publisher is exists
    const publisher = await PublisherModel.findOne({
      where: { publisher_name: incomingPublisher },
    });

    if (publisher) {
      throw createHttpError(401, "This publisher already exists.");
    }

    const createdPublisher = await PublisherModel.create(
      {
        publisher_name: turkceBuyukHarfeDonustur(incomingPublisher),
      },
      { transaction: t }
    );

    await LogModel.create(
      {
        user_id: req.session.user_id,
        event_date: new Date(),
        publisher_id: createdPublisher.publisher_id,
        event_type_id: EventTypeEnum.publisher_create,
      },
      { transaction: t }
    );

    await t.commit();

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region GET ALL PUBLISHERS AND BOOKS COUNT
export const getPublishersAndBooksCount: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const result = await PublisherModel.findAll({
      attributes: [
        "publisher_name",
        "publisher_id",
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
//#endregion
