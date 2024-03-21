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
    reading_id: CreationOptional<string>;
    user_id: string;
    book_id: string;
    status_id:string;
    comment?:string;
    deletedAt?:Date;
    createdAt?:Date;
    updatedAt?:Date;
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
      tableName: "READING",
      paranoid:true,
    }
  );

  Reading.belongsTo(UserModel, {foreignKey: "user_id"});
  UserModel.hasMany(Reading,{ foreignKey:"user_id" });
  Reading.belongsTo(BookModel, {foreignKey: "book_id"});
  BookModel.hasMany(Reading, { foreignKey: "book_id" });
  Reading.belongsTo(StatusModel, {foreignKey: "status_id"});


  
  export default Reading;
  