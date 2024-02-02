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
  publisher_id: CreationOptional<number>;
  publisher_name: string;
}

const Publisher = db.define<PublisherInstance>(
  "publisher",
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
  },
  {
    tableName: "PUBLISHER",
    timestamps: false,
  }
);

export default Publisher;
