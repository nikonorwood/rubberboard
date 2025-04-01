/*  rubberboard api server v0.1

    Dependancies
        * NodeJS
        * Express
        * bygoneBackend.js

    Created by Niko Norwood on 03/31/2025
*/

const express = require('express');
const app = express();
const bygone = require ('./bygoneBackend');
const path = require('path');

//port the server will operate on
const port = 3060;

//Throw some output to show different sessions in serverLog.txt
bygone.output("\n\n-----Rubberboard Backend v0.1-----\n");
bygone.output("INITIALIZING...");

bygone.setDebug(true);

app.use(express.json());



//Returns last x number of posts
app.get("/api/newPosts", (req, res) => {
    //yessss
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