import { cleanEnv, port, str } from "envalid";

export default cleanEnv(process.env,{
    POSTGRE_CONNECTION_STRING: str(),
    PORT: port(),
    SESSION_SECRET: str(),
    RESEND_API_KEY:str(),
});