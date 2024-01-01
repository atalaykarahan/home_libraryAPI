import { DataTypes } from "sequelize";
import db from "../../db";

const Book = db.define("book", {
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
  }
},{
    tableName:"BOOK",
    timestamps:false,
  });


export default Book;
