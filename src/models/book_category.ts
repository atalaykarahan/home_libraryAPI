import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";
import CategoryModel from "./category";

interface BookCategoryInstance
  extends Model<
    InferAttributes<BookCategoryInstance>,
    InferCreationAttributes<BookCategoryInstance>
  > {
  book_id: number;
  category_id: number;
}

const BookCategory = db.define<BookCategoryInstance>(
  "BOOK_CATEGORY",
  {
    book_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    tableName: "BOOK_CATEGORY",
    timestamps: false,
  }
);

CategoryModel.hasMany(BookCategory, {foreignKey: "category_id"})

export default BookCategory;
