import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
} from "sequelize";
import db from "../../db";

interface AuthorityInstance
  extends Model<
    InferAttributes<AuthorityInstance>,
    InferCreationAttributes<AuthorityInstance>
  > {
  authority_id: CreationOptional<string>;
  role: string;
}

const Authority = db.define<AuthorityInstance>(
  "AUTHOR",
  {
    authority_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "AUTHORITY",
    timestamps: false,
  }
);

export default Authority;
