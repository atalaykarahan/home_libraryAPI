import { DataTypes } from "sequelize";

declare module "express-session"{
    interface SessionData{
        user_id: DataTypes.BIGINT;
        user_authority_id:DataTypes.BIGINT;

    }
}