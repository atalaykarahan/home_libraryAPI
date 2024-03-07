import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";
import Category from "./category";

interface BookCategoryInstance
  extends Model<
    InferAttributes<BookCategoryInstance>,
    InferCreationAttributes<BookCategoryInstance>
  > {
  book_id: string;
  category_id: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
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
    deletedAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  },
  {
    tableName: "BOOK_CATEGORY",
    paranoid: true,
  }
);

Category.hasMany(BookCategory, { foreignKey: "category_id" });

export default BookCategory;
