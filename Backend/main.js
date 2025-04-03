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
const { request } = require('http');

const sql = postgres(databaseLocation)

//port the server will operate on
const port = 3060;

//Throw some output to show different sessions in serverLog.txt
bygone.output("\n\n-----Rubberboard Backend v0.1-----\n");
bygone.output("INITIALIZING...");

bygone.setDebug(true);

app.use(express.json());



// POSTGRES FUNCTIONS


//returns last x number of posts for main page
async function getNewPosts(limit){
    const data = await sql`
        SELECT p.id, p.username, p.topic, p.time, p.body, p.likes, p.dislikes, p.catagory, u.commonname
        FROM public.posts p
        JOIN public.users u ON p.username = u.username
        ORDER BY p.id DESC
        LIMIT ${limit};`

    return data
}



// returns full data about a post
async function getPostDetails(postid){
    const data = await sql`
        SELECT p.*, u.commonname
        FROM public.posts p
        JOIN public.users u ON p.username = u.username
        WHERE p.id = ${postid};`

    if (data.length != 0) {
        return data;
    } else {
        throw 404;
    }
}


//  REST HANDLERS



//Returns last x number of posts
app.get("/api/newPosts", (req, res) => {
    getNewPosts(20)                          //Change this line to change default number of posts
    .then((queryReturn) =>{
        res.send(queryReturn)
    })
    .catch((error) => {
        if (error == 404){
            res.status(404).send("That Post Was Not Found");
        } else {
            res.status(500).send("The Rats Messed Up That One!");
            bygone.output(`ERROR! /api/newPost triggered 500 response due to ${error}`)
        }
    });
});



//Returns the post and comments of a specific post
app.get("/api/readPost", (req,res) => {
    //make sure the request is being made with data and specificly a number in the postid feild
    if (!req.body || !req.body.postid ||typeof req.body.postid != "number") {
        res.status(400).send("The Rats Didn't Understand What Was Requested!");
        return;
    }

    getPostDetails(req.body.postid)
    .then((queryReturn) =>{
        res.send(queryReturn)
    })
    .catch((error) => {
        if (error == 404){
            res.status(404).send("That Post Was Not Found");
        } else {
            res.status(500).send("The Rats Messed Up That One!");
            bygone.output(`ERROR! /api/newPost triggered 500 response due to ${error}`)
        }
    });
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