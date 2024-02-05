import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";

interface CategoryInstance
  extends Model<
    InferAttributes<CategoryInstance>,
    InferCreationAttributes<CategoryInstance>
  > {
  category_id: CreationOptional<number>;
  category_name: string;
}

const Category = db.define<CategoryInstance>(
  "CATEGORY",
  {
    category_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    category_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "CATEGORY",
    timestamps: false,
  }
);

export default Category;
