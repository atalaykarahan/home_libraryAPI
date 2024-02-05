import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";

interface EventInstance
  extends Model<
    InferAttributes<EventInstance>,
    InferCreationAttributes<EventInstance>
  > {
  event_id: CreationOptional<number>;
  event_name: string;
}

const Publisher = db.define<EventInstance>(
  "EVENT_TYPE",
  {
    event_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    event_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "EVENT_TYPE",
    timestamps: false,
  }
);

export default Publisher;
