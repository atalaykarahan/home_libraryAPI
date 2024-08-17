import { DataTypes } from "sequelize";

declare module "express-session"{
      export interface SessionData{
	  user_id:any;	
        user_authority_id:DataTypes.BIGINT;
    }
}
