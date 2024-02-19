import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
  } from "sequelize";
  import db from "../../db";
  import StatusModel from "../models/status";
  import BookModel from "../models/book";
  import UserModel from "../models/user";
  
  interface ReadingInstance
    extends Model<
      InferAttributes<ReadingInstance>,
      InferCreationAttributes<ReadingInstance>
    > {
    reading_id: CreationOptional<number>;
    user_id: number;
    book_id: number;
    status_id:number;
    comment?:string;
  }
  
  const Reading = db.define<ReadingInstance>(
    "READING",
    {
        reading_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      book_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      status_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "READING",
      timestamps: false,
    }
  );

  Reading.belongsTo(UserModel, {foreignKey: "user_id"});
  Reading.belongsTo(BookModel, {foreignKey: "book_id"});
  Reading.belongsTo(StatusModel, {foreignKey: "status_id"});


  
  export default Reading;
  