import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";

interface AuthorInstance
  extends Model<
    InferAttributes<AuthorInstance>,
    InferCreationAttributes<AuthorInstance>
  > {
  author_id: CreationOptional<number>;
  author_name: string;
  author_surname?: string;
}

const Author = db.define<AuthorInstance>(
  "user",
  {
    author_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    author_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author_surname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "AUTHOR",
    timestamps: false,
  }
);

export default Author;
