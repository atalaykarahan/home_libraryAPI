import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";

interface LogInstance
  extends Model<
    InferAttributes<LogInstance>,
    InferCreationAttributes<LogInstance>
  > {
  log_id: CreationOptional<string>;
  user_id?: string;
  event_type_id: string;
  event_date?: CreationOptional<Date>;
  book_id?: string;
  description?: string;
  category_id?: string;
  translator_id?: string;
  publisher_id?: string;
  author_id?: string;
  reading_id?: string;
}

const Book = db.define<LogInstance>(
  "LOG",

  {
    log_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    event_type_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    event_date: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    book_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    translator_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    publisher_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    reading_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "LOG",
    timestamps: false,
  },
);

export default Book;
