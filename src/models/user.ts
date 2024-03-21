import {
  CreationOptional,
  DataTypes,
  DecimalDataType,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import ReadingModel from "./reading";
import db from "../../db";

interface UserInstance
  extends Model<
    InferAttributes<UserInstance>,
    InferCreationAttributes<UserInstance>
  > {
  user_id: CreationOptional<string>;
  user_name: string;
  user_password: string;
  user_email: string;
  user_authority_id?: string;
  user_email_verified?: boolean;
  user_google_id?: string;
}

const User = db.define<UserInstance>(
  "user",
  {
    user_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    user_authority_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    user_email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    user_google_id: {
      type: DataTypes.DECIMAL,
      allowNull: true,
    },
  },
  {
    tableName: "USER",
    timestamps: false,
  }
);

export default User;
