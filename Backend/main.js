/*  rubberboard api server v0.1

    Dependancies
        * NodeJS
        * Express
        * bygoneBackend.js

    Created by Niko Norwood on 03/31/2025
*/

//database connection string
const databaseLocation = ""

const express = require('express');
const app = express();
const bygone = require ('./bygoneBackend');
const postgres = require('postgres');
const path = require('path');

const sql = postgres(databaseLocation)

//port the server will operate on
const port = 3060;

//Throw some output to show different sessions in serverLog.txt
bygone.output("\n\n-----Rubberboard Backend v0.1-----\n");
bygone.output("INITIALIZING...");

bygone.setDebug(true);

app.use(express.json());



//test query function
async function getAllData(){
    const data = await sql`
        SELECT id,username,topic,time,body,likes,dislikes,catagory 
        FROM posts 
        ORDER BY id DESC
        LIMIT 20;`

    return data
}



//Returns last x number of posts
app.get("/api/newPosts", (req, res) => {
    getAllData().then((sqlReturn) =>{
        res.send(sqlReturn)
    });
});



//Returns the post and comments of a specific post
app.get("/api/readPost", (req,res) => {
    //this is something
});



app.post("/api/makePost", (req,res) => {
    //some code should go here
});



//start Server
app.listen(port, () =>{bygone.output(`Server Online at port ${port}`)})

// gonna be honest... no clue if this function is nessesary anymore ¯\_(ツ)_/¯
// Close the logger when application exits
process.on('exit', () => {
    logger.close();
});