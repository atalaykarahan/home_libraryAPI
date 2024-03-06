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
  book_id: string;
  category_id: string;
}

const BookCategory = db.define<BookCategoryInstance>(
  "BOOK_CATEGORY",
  {
    book_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "BOOK_CATEGORY",
    timestamps: false,
  }
);

CategoryModel.hasMany(BookCategory, { foreignKey: "category_id" });

export default BookCategory;
