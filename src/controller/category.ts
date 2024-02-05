import { RequestHandler } from "express";
import CategoryModel from "../models/category";
import BookCategory from "../models/book_category";
import { Sequelize } from "sequelize";

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
