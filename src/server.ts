import express from "express";
const app = express();
const port = 5000;

app.get("/",(req,res) => {
    res.send("Hello World!");
});

app.get("/conn", (req,res) => {
    res.send("Connection successfull!");
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});