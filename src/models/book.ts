import {
  CreationOptional,
  DataTypes,
  DecimalDataType,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";
import PublisherModel from "./publisher";
import AuthorModel from "./author";
import StatusModel from "./status";
import BookCategoryModel from "./book_category";

interface BookInstance
  extends Model<
    InferAttributes<BookInstance>,
    InferCreationAttributes<BookInstance>
  > {
  book_id: CreationOptional<string>;
  book_title: string;
  author_id: string;
  publisher_id: CreationOptional<string>;
  status_id: string;
  book_image: CreationOptional<string> | null;
  book_summary: string;
  book_isbn: CreationOptional<number>;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const Book = db.define<BookInstance>(
  "BOOK",

  {
    book_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    book_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    publisher_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    status_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    book_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    book_summary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    book_isbn: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    tableName: "BOOK",
    paranoid: true,
  }
);

AuthorModel.hasMany(Book, {foreignKey: 'author_id'});
PublisherModel.hasMany(Book, {foreignKey: "publisher_id"});
Book.belongsTo(AuthorModel, {foreignKey: "author_id"});
Book.belongsTo(PublisherModel, { foreignKey: "publisher_id" });
Book.belongsTo(StatusModel, { foreignKey: "status_id" });
Book.hasMany(BookCategoryModel, {foreignKey: "book_id"});
BookCategoryModel.hasMany(Book, {foreignKey: "book_id"});

export default Book;
