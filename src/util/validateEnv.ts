import { cleanEnv, port, str, url } from "envalid";

export default cleanEnv(process.env,{
    POSTGRE_CONNECTION_STRING: str(),
    PORT: port(),
    SESSION_SECRET: str(),
    RESEND_API_KEY:str(),
    JWT_SECRET_RSA: str(),
    JWT_PASSWORD_RESET:str(),
    WEBSITE_URL: url(),
    BUCKET_NAME:str(),
    BUCKET_REGION:str(),
    BUCKET_ACCESS_KEY:str(),
    BUCKET_SECRET_ACCESS_KEY:str(),
    COOKIE_DOMAIN:str()
});