import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";

interface PublisherInstance
  extends Model<
    InferAttributes<PublisherInstance>,
    InferCreationAttributes<PublisherInstance>
  > {
  publisher_id: CreationOptional<string>;
  publisher_name: string;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const Publisher = db.define<PublisherInstance>(
  "PUBLISHER",
  {
    publisher_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    publisher_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    deletedAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  },
  {
    tableName: "PUBLISHER",
    paranoid: true,
  }
);


export default Publisher;
