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
var readline = require('readline');

const sql = postgres(databaseLocation)

//port the server will operate on
const port = 3060;

//Throw some output to show different sessions in serverLog.txt
bygone.output("\n\n-----Rubberboard Backend v0.1-----\n\nPress q to exit\n");
bygone.output("INITIALIZING...");

if (databaseLocation.length == 0 || databaseLocation == null){
    bygone.output("ERROR! - database location value is empty! Server cannot start!")
    process.exit();
}

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



//returns all the comments on a post
async function getComments(postid){
    const data = await sql`
    SELECT p.id, c.*
    FROM public.posts p
    LEFT JOIN public.comments c ON p.id = c.postid
    LEFT JOIN public.users cu ON c.commentUser = cu.username
    WHERE p.id = ${postid};`

    return data;
}



//returns full data about a post
async function getPostDetails(postid){
    const data = await sql`
        -- Query for the post itself
        SELECT p.*, u.commonname
        FROM public.posts p
        JOIN public.users u ON p.username = u.username
        WHERE p.id = ${postid}`

    if (data.length != 0) {
        return data;
    } else {
        throw 404;
    }
}



//Handles likes and dislikes. Makes sure username exists then adds it to like or dislike array and removes it from the other if present
async function reactToPost(postid,username,like){
    //Seperate querys for like and dislike
    if (like){
        const data = await sql`
            WITH username_exists AS (
            SELECT 1 FROM users WHERE username = ${username}
            LIMIT 1)

            UPDATE posts
            SET dislikes = array_remove(dislikes,${username}),
                likes = array_append(likes, ${username})
            WHERE id = ${postid} 
            AND ${username} <> ALL(likes)
            AND EXISTS (SELECT 1 FROM username_exists)
            RETURNING likes,dislikes;`

        if (data.length != 0) {
            return data;
        } else {
            throw 404;
        }
    } else {
        const data = await sql`
            WITH username_exists AS (
            SELECT 1 FROM users WHERE username = ${username}
            LIMIT 1)

            UPDATE posts
            SET dislikes = array_append(dislikes,${username}),
                likes = array_remove(likes, ${username})
            WHERE id = ${postid} 
            AND ${username} <> ALL(dislikes)
            AND EXISTS (SELECT 1 FROM username_exists)
            RETURNING likes,dislikes;`
        
        if (data.length != 0) {
            return data;
        } else {
            throw 404;
        }
    }    
}



//Handles creating new posts
async function makePost(username,topic,body,catagory){
    //seperate querys for catagory and no catagory
    if (catagory = null){
        const data = await sql`
            INSERT INTO posts (username,topic,body) VALUES (${username},${topic},${body}) RETURNING *;`
        return data;
    } else {
        const data = await sql`
            INSERT INTO posts (username,topic,body,catagory) VALUES (${username},${topic},${body},${catagory}) RETURNING *;`
        return data;
    }
}



//Creates new comment in comment table and ties it to the post
async function makeComment(postid,username,body){
    const data = await sql`
    INSERT INTO comments (postid,username,body) VALUES (${postid},${username},${body})
    RETURNING *;`
}



//  REST HANDLERS



//Returns last x number of posts
app.get("/api/newPosts", (req, res) => {
    getNewPosts(20)                          //Change this line to change default number of posts
    .then((queryReturn) =>{
        res.send(queryReturn)
    })
    .catch((error) => {
        res.status(500).json({code: 510, message: "The Rats Messed Up That One!"});
        bygone.output(`ERROR! /api/newPosts triggered 510 response due to ${error}`)
    });
});



//Returns the post and comments of a specific post
app.get("/api/readPost", (req,res) => {
    //make sure the request is being made with data and specificly a number in the postid feild
    if (!req.body || !req.body.postid ||typeof req.body.postid != "number") {
        res.status(400).json({code: 520, message: "The Rats Didn't Understand What Was Requested!"});
        return;
    }

    //run sql querry for post
    getPostDetails(req.body.postid)
    .then((post) =>{
        //run query for comments
        getComments(req.body.postid)
        .then((comments) => {
            res.send({post,comments});
        }).catch((error) => {
            res.status(500).json({code: 522, message: "The Rats Dropped the comments!"});
            bygone.output(`ERROR! /api/readPost triggered 522 response due to ${error}`)
        })
    })
    .catch((error) => {
        //check for controlled not found error
        if (error == 404){
            res.status(404).json({code: 404, message: "That Post Was Not Found"});
        } else {
            res.status(500).json({code: 521, message: "The Rats Dropped the Post!"});
            bygone.output(`ERROR! /api/readPost triggered 521 response due to ${error}`)
        }
    });
});



//handles likes and dislikes to the database  {postid:int, username:string, like:bool}
app.post("/api/reactToPost", (req,res) => {
    //make sure the request is being made with data
    if (!req.body || !req.body.postid || !req.body.username || !req.body.like ||
            typeof req.body.postid != "number" || 
            typeof req.body.username != "string" || 
            typeof req.body.like != "boolean") {

        res.status(400).json({code: 530, message: "The Rats Can't hear your cryptic message!"});
        return;
    }
    
    reactToPost(req.body.postid,req.body.username,req.body.like)
    .then((result) =>{
        // might have to think of a better way to handle this but this is the confirmation message
        res.send(result);
    })
    .catch((error) => {
        //check for controlled not found error
        if (error == 404){
            res.status(404).json({code: 404, message: "That Post or User Was Not Found"});
        } else {
            res.status(500).json({code: 531, message: "The Rats Dissagree with you!"});
            bygone.output(`ERROR! /api/reactToPost triggered 531 response due to ${error}`)
        }
    });
});



app.post("/api/makePost", (req,res) => {
    //make sure the request is being made with data
    if (!req.body || !req.body.postBody || !req.body.username || !req.body.topic ||
        typeof req.body.postBody != "string" || 
        typeof req.body.username != "string" || 
        typeof req.body.topic != "string") {

        res.status(400).json({code: 540, message: "The Rats Heard Crazy Rambling Instead of a Post"});
        return;
    }

    let catagory = "";
    if (req.body.catagory){catagory = req.body.catagory;}

    makePost(req.body.username,req.body.topic,req.body.postBody,catagory)
    .then((result) =>{
        // might have to think of a better way to handle this but this is the confirmation message
        res.send(result);
    })
    .catch((error) => {
        res.status(500).json({code: 541, message: "The Rats Couldnt Parse That!"});
        bygone.output(`ERROR! /api/reactToPost triggered 541 response due to ${error}`)
    });
});



//handler for making comments (username : string, commentBody : string)
app.post("/api/makeComment", (req,res) =>{
    //make sure the request is being made with data
    if (!req.body || !req.body.commentBody || !req.body.username || !req.body.postid ||
        typeof req.body.commentBody != "string" || 
        typeof req.body.username != "string" || 
        typeof req.body.postid != "number") {

        res.status(400).json({code: 550, message: "The Rats Didnt Hear Your Comment!"});
        return;
    }

    makeComment(req.body.postid,req.body.username,req.body.commentBody)
    .then((result) => {
        res.send(result);
    })
    .catch((error) =>{
        //check for controlled not found error
        if (error == 404){
            res.status(404).json({code: 404, message: "That Post Was Not Found"});
        } else {
            res.status(500).json({code: 551, message: "The Rats Think Your Opinion is Dumb!"});
            bygone.output(`ERROR! /api/reactToPost triggered 551 response due to ${error}`)
        }
    });
})



//start Server
app.listen(port, () =>{bygone.output(`Server Online at port ${port}`)})

//Keyboard listener
readline.emitKeypressEvents(process.stdin);
process.stdin.on('keypress', (chunk, key) => {
    if (key && key.name == 'q'){
      process.exit();
    }
});

// gonna be honest... no clue if this function is nessesary anymore ¯\_(ツ)_/¯
// Close the logger when application exits
process.on('exit', () => {
    bygone.output("Shutting down...")
    logger.close();
});