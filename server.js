const CONSTANT = require("./constant/constant")
const express = require('express');
const controller = require('./controller/controller');
var MongoClient = require("mongodb").MongoClient;

const app = express();

// Pour autoriser les appels http
//const cors = require('cors')
//app.use(cors({credentials: true, origin: true}))

var http = require("http").createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});


// CONTROLLER = controller
 io.on("connection",(socket) => {
     console.log("on connection")

     // Retourne le status du server par defaut 200
     socket.emit("status", 300)

     socket.on("register",message => {
         console.log("on register")
         console.log(message)

         MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
           if (error) return funcCallback(error);
            console.log("Connecté à la base de données");

            var db = client.db('ptutdb');

            var objNew = { pseudo: "test", motdepasse: "mdp" };  
            db.collection("utilisateur").insert(objNew, null, function (error, results) {
                if (error) throw error;
                console.log("Le document a bien été inséré");    
            });
        });
        
     })

 })

http.listen("8080","localhost");