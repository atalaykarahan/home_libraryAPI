import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "../../db";

interface EventTypeInstance
  extends Model<
    InferAttributes<EventTypeInstance>,
    InferCreationAttributes<EventTypeInstance>
  > {
  event_id: CreationOptional<string>;
  event_name: string;
}

const EventType = db.define<EventTypeInstance>(
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

export default EventType;
