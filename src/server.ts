import express from "express";
import "dotenv/config";
import env from "./util/validateEnv";
import booksRoutes from "./routes/books"

// import exphbs from "express-handlebars";
// import path from "path";

// Database
import db from "../db";

//Test Db
db.authenticate().then(()=> console.log('Database connection successful')).catch((err) => console.log('Error: ' + err));

const app = express();
const port = env.PORT;

app.get("/",(req,res) => {
    res.send("Hello World!");
});

app.get("/xaera", (req,res) => {
    res.send("Connection successful!");
});

// Book routes api/books
app.use("/api/books", booksRoutes);

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});