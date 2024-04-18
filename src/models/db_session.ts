import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";

interface DbSessionInstance
  extends Model<
    InferAttributes<DbSessionInstance>,
    InferCreationAttributes<DbSessionInstance>
  > {
  sid: CreationOptional<string>;
  sess: object | any;
  expire: Date;
}

const DbSession = db.define<DbSessionInstance>(
  "DB_SESSION",
  {
    sid: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
    sess: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    expire: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  },
  {
    tableName: "DB_SESSION",
    timestamps: false,
  }
);

export default DbSession;
