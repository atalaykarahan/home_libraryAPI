import { Sequelize } from 'sequelize';
import "dotenv/config";
import env from "./src/util/validateEnv";

const db = new Sequelize(env.POSTGRE_CONNECTION_STRING);

export default db;

