import { RequestHandler } from "express";
import CategoryModel from "../models/category";
import BookCategory from "../models/book_category";
import LogModel from "../models/log";
import { Sequelize } from "sequelize";
import db from "../../db";
import createHttpError from "http-errors";
import { EventTypeEnum } from "../util/enums";
import { formatBookTitle } from "../custom-functions";

export const insertCategory: RequestHandler = async (req, res, next) => {
  const incomingCategory = req.params.category;
  const t = await db.transaction();

  try {
    if (!incomingCategory) throw createHttpError(400, "Missing parameters");

    const formattedCategory = formatBookTitle(incomingCategory);

    // Büyük harf yapma işlemi
    // const formattedCategory = incomingCategory
    //   .toLowerCase()
    //   .replace(/\b\w/g, (char) => char.toUpperCase());

    //check same category is exists
    const category = await CategoryModel.findOne({
      where: { category_name: formattedCategory },
    });

    if (category) throw createHttpError(401, "This category already exists.");

    const createdCategory = await CategoryModel.create(
      {
        category_name: formattedCategory,
      },
      { transaction: t }
    );

    await LogModel.create(
      {
        user_id: req.session.user_id,
        event_date: new Date(),
        category_id: createdCategory.category_id,
        event_type_id: EventTypeEnum.category_create,
      },
      { transaction: t }
    );

    await t.commit();

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};

export const getCategoriesAndBooksCount: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    console.log("buraya düştü");
    const result = await CategoryModel.findAll({
      attributes: [
        "category_name",
        [Sequelize.fn("COUNT", Sequelize.col("book_id")), "bookCount"],
      ],
      include: [
        {
          model: BookCategory,
          attributes: [],
          required: false,
        },
      ],
      group: ["CATEGORY.category_id"],
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllCategories:  RequestHandler = async (req, res, next) => {
  try {
    const result = await CategoryModel.findAll();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
