import express, { NextFunction, Request, Response } from "express";
import "dotenv/config";
import env from "./util/validateEnv";
import booksRoutes from "./routes/books";
import userRoutes from "./routes/user";
import authorRoutes from "./routes/author";
import categoryRoutes from "./routes/category";
import publisherRoutes from "./routes/publisher";
import statusRoutes from "./routes/status";
import readingRoutes from "./routes/reading";
import morgan from "morgan";
import createHttpError, { isHttpError } from "http-errors";
// Database
import db from "../db";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import cors from "cors";

const pgSession = ConnectPgSimple(session);

//Test Db
db.authenticate()
  .then(() => console.log("Database connection successful"))
  .catch((err) => console.log("Error: " + err));

// Port and express defination
const app = express();
const port = env.PORT;

// app.use(
//   cors({
//     origin: "http://localhost:3001",
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: env.WEBSITE_URL,
    credentials: true,
  })
);

// For logs endpoint on the console
app.use(morgan("dev"));

// for post methods
app.use(express.json());

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      domain:"www.atalaykarahan.com",
      sameSite : "none",
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
    rolling: true,
    store: new pgSession({
      conObject: {
        connectionString: env.POSTGRE_CONNECTION_STRING, // Veritabanı bağlantı dizenizi buraya ekleyin
      },
      tableName: "DB_SESSION",
    }),
  })
);

// dashboard
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// testing after publishing project
app.get("/xaera", (req, res) => {
  res.send("Connection successful!");
});

// Book routes api/books
app.use("/api/books", booksRoutes);

// User routes api/users
app.use("/api/users", userRoutes);

// Author routes api/authors
app.use("/api/authors", authorRoutes);

// Publisher routes api/publishers
app.use("/api/publishers", publisherRoutes);

// Category routes api/categories
app.use("/api/categories", categoryRoutes);

// Status routes api/statuses
app.use("/api/statuses", statusRoutes);

// Reading routes api/readings
app.use("/api/readings", readingRoutes);

app.use((req, res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});


// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.log(error);
  let errorMessage = "An unknown error occurred";
  let statusCode = 500;
  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }
  res.status(statusCode).json({ error: errorMessage });
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

export default app;

