import { RequestHandler } from "express";
import CategoryModel from "../models/category";
import BookCategory from "../models/book_category";
import LogModel from "../models/log";
import { Sequelize } from "sequelize";
import db from "../../db";
import createHttpError from "http-errors";
import { EventTypeEnum } from "../util/enums";
import { formatBookTitle } from "../custom-functions";

//#region INSERT CATEGORY
export const insertCategory: RequestHandler = async (req, res, next) => {
  const incomingCategory = req.params.category;
  const t = await db.transaction();

  try {
    if (!incomingCategory) throw createHttpError(400, "Missing parameters");

    const formattedCategory = formatBookTitle(incomingCategory);

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
//#endregion

//#region GET ALL CATEGORIES AND BOOKS COUNT
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
        "category_id",
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
//#endregion

//#region GET ALL CATEGORIES
export const getAllCategories: RequestHandler = async (req, res, next) => {
  try {
    const result = await CategoryModel.findAll();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
//#endregion

//#region PATCH & UPDATE CATEGORY
interface PatchCategoryBody {
  category_name?: string;
  category_id?: string;
}
export const patchCategory: RequestHandler<
  unknown,
  unknown,
  PatchCategoryBody,
  unknown
> = async (req, res, next) => {
  const category_name = req.body.category_name;
  const category_id = req.body.category_id;
  const user_id = req.session.user_id;

  const t = await db.transaction();

  try {
    if (!category_name || !category_id || !user_id)
      throw createHttpError(400, "Missing parameters");

    const categoryCreateLog = await LogModel.findOne({
      where: {
        category_id: category_id,
        event_type_id: EventTypeEnum.category_create,
        user_id: user_id,
      },
    });

    if (!categoryCreateLog)
      throw createHttpError(403, "You are not authorized to update this data.");

    const category = await CategoryModel.findByPk(category_id);

    if (!category) throw createHttpError(404, "Category not found");

    category.category_name = category_name;

    await category.save({ transaction: t });

    await LogModel.create(
      {
        user_id: user_id,
        event_type_id: EventTypeEnum.category_update,
        category_id: category.category_id,
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
export const deleteCategory: RequestHandler = async (req, res, next) => {
  const category_id = req.params.category_id;
  const user_id = req.session.user_id;
  const t = await db.transaction();

  try {
    if (!category_id) throw createHttpError(400, "Missing parameters");

    const createCategoryLog = await LogModel.findOne({
      where: {
        category_id: category_id,
        event_type_id: EventTypeEnum.category_create,
        user_id: user_id,
      },
    });

    if (!createCategoryLog)
      throw createHttpError(403, "You are not authorized to delete this data.");

    const book_ids = await BookCategory.findAll({
      where: { category_id: category_id },
    });

    if (book_ids.length > 0)
      throw createHttpError(
        409,
        "There are books associated with this category. You cannot delete it."
      );

    await CategoryModel.destroy({
      where: { category_id: category_id },
      transaction: t,
    });

    await LogModel.create(
      {
        user_id: user_id,
        category_id: category_id,
        event_type_id: EventTypeEnum.category_delete,
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
