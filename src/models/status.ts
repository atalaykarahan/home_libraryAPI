import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
  } from "sequelize";
  import db from "../../db";
  
  interface StatusInstance
    extends Model<
      InferAttributes<StatusInstance>,
      InferCreationAttributes<StatusInstance>
    > {
    status_id: CreationOptional<number>;
    status_name: string;
  }
  
  const Category = db.define<StatusInstance>(
    "STATUS",
    {
      status_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      status_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "STATUS",
      timestamps: false,
    }
  );
  
  export default Category;
  