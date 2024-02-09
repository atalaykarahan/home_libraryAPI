import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";
import PublisherModel from "./publisher";
import AuthorModel from "./author";

interface BookInstance
  extends Model<
    InferAttributes<BookInstance>,
    InferCreationAttributes<BookInstance>
  > {
  book_id: CreationOptional<number>;
  book_title: string;
  author_id: number;
  publisher_id: CreationOptional<number>;
  status_id: number;
  image_path: CreationOptional<string>;
  book_summary: string;
  book_isbn: CreationOptional<number>;
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
    image_path: {
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
  },
  {
    tableName: "BOOK",
    timestamps: false,
  }
);

PublisherModel.hasMany(Book, { foreignKey: "publisher_id" });
AuthorModel.hasMany(Book, { foreignKey: "author_id" });

export default Book;
