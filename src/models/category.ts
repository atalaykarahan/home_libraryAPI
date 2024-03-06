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
  category_id: CreationOptional<string>;
  category_name: string;
  deletedAt?:Date;
    createdAt?:Date;
    updatedAt?:Date;
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
    deletedAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    createdAt:{
      type:DataTypes.TIME,
      allowNull:true,
    },
    updatedAt:{
      type:DataTypes.TIME,
      allowNull:true,
    }
  },
  {
    tableName: "CATEGORY",
    paranoid:true,
  }
);

export default Category;
