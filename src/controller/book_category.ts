import createHttpError from "http-errors";
import BookCategoryModel from "../models/book_category";

//#region FUNCTIONS

import { Transaction } from "sequelize";

//#region INSERT BOOK CATEGORY FUNCTION
export const insertBookCategoryFunction = async (
  userId: string,
  book_id: string,
  category_id: string,
  transac: Transaction
) => {
  const existingRelationList = await BookCategoryModel.findAll({
    where: {
      book_id: book_id,
      category_id: category_id,
    },
  });

  if (existingRelationList.length > 0)
    throw createHttpError(
      409,
      "this book already relation with this cateogry."
    );

  await BookCategoryModel.create(
    {
      book_id: book_id,
      category_id: category_id,
    },
    { transaction: transac }
  );
};

//#endregion
