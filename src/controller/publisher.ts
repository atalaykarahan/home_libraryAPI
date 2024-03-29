import { RequestHandler } from "express";
import PublisherModel from "../models/publisher";
import LogModel from "../models/log";
import BookModel from "../models/book";
import createHttpError from "http-errors";
import { Op, Sequelize, Transaction } from "sequelize";
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
      where: { publisher_name: incomingPublisher.toUpperCase() },
    });

    if (publisher) throw createHttpError(409, "This publisher already exists.");

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

//#region PATCH & UPDATE PUBLISHER
interface PatchPublisherBody {
  publisher_name?: string;
  publisher_id?: string;
}
export const patchPublisher: RequestHandler<
  unknown,
  unknown,
  PatchPublisherBody,
  unknown
> = async (req, res, next) => {
  const publisher_name = req.body.publisher_name;
  const publisher_id = req.body.publisher_id;
  const user_id = req.session.user_id;

  const t = await db.transaction();

  try {
    if (!publisher_name || !publisher_id || !user_id)
      throw createHttpError(400, "Missing parameters");

    const publisherCreateLog = await LogModel.findOne({
      where: {
        publisher_id: publisher_id,
        event_type_id: EventTypeEnum.publisher_create,
        user_id: user_id,
      },
    });

    if (!publisherCreateLog)
      throw createHttpError(403, "You are not authorized to update this data.");

    const publisher = await PublisherModel.findByPk(publisher_id);

    if (!publisher) throw createHttpError(404, "Publisher not found");

    publisher.publisher_name = publisher_name;

    await publisher.save({ transaction: t });

    await LogModel.create(
      {
        user_id: user_id,
        event_type_id: EventTypeEnum.publisher_update,
        publisher_id: publisher.publisher_id,
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

//#region DELETE CATEGORY
export const deletePublisher: RequestHandler = async (req, res, next) => {
  const publisher_id = req.params.publisher_id;
  const user_id = req.session.user_id;
  const t = await db.transaction();

  try {
    if (!publisher_id) throw createHttpError(400, "Missing parameters");

    const createPublisherLog = await LogModel.findOne({
      where: {
        publisher_id: publisher_id,
        event_type_id: EventTypeEnum.publisher_create,
        user_id: user_id,
      },
    });

    if (!createPublisherLog)
      throw createHttpError(403, "You are not authorized to delete this data.");

    const book_ids = await BookModel.findAll({
      where: { publisher_id: publisher_id },
    });

    if (book_ids.length > 0)
      throw createHttpError(
        409,
        "There are books associated with this publisher. You cannot delete it."
      );

    await PublisherModel.destroy({
      where: { publisher_id: publisher_id },
      transaction: t,
    });

    await LogModel.create(
      {
        user_id: user_id,
        publisher_id: publisher_id,
        event_type_id: EventTypeEnum.publisher_delete,
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

//#region INSERT PUBLISHER FUNCTION

export const insertPublisherFunction = async (
  userId: string,
  name: string,
  transac: Transaction
) => {
  const existingPublisherList = await PublisherModel.findAll({
    where: {
      [Op.or]: [{ publisher_name: { [Op.iLike]: `%${name}%` } }],
    },
  });

  if (existingPublisherList.length > 0)
    throw createHttpError(409, "this author already exists.");

  const createdPublisher = await PublisherModel.create(
    {
      publisher_name: turkceBuyukHarfeDonustur(name),
    },
    { transaction: transac }
  );

  await LogModel.create(
    {
      user_id: userId,
      event_date: new Date(),
      publisher_id: createdPublisher.publisher_id,
      event_type_id: EventTypeEnum.publisher_create,
    },
    { transaction: transac }
  );

  return createdPublisher.publisher_id;
};
//#endregion

//#endregion
