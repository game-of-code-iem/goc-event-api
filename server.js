const CONSTANT = require("./constant/constant")
const express = require('express');
const controller = require('./controller/controller');
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require('mongodb').ObjectID;

const app = express();

// Pour autoriser les appels http
//const cors = require('cors')
//app.use(cors({credentials: true, origin: true}))

var http = require("http").createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});
var connectedUser;

// CONTROLLER = controller
 io.on("connection",(socket) => {
     console.log("on connection")

     // INSCRIPTION
     socket.on("register",message => {
         console.log("on register: " +message)

         MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
           if (error) return funcCallback(error);
            console.log("Connecté à la base de données");
            var db = client.db('ptutdb');

            var objNew = { firstName: message[0].firstName, lastName: message[0].lastName, login: message[0].login, password: message[0].password, mail: message[0].mail};  
            db.collection("user").insertOne(objNew, null, function (error, results) {
                if (error) throw error;
                console.log("USER inséré");
                socket.emit("register", [{error: 0, result: 1, data: 1}])   
            });
        });        
     })

     // CONNEXION
     socket.on("login",message => {
        console.log("on login: "+message)

        MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
          if (error) return funcCallback(error);
           console.log("Connecté à la base de données");
           var db = client.db('ptutdb');

            var userLogged = db.collection("user").findOne( { login: message[0].login, password: message[0].password }, (err, res) => {
                if ( res ){
                    console.log("LOGIN DONE")
                    connectedUser = res;
                    console.log("user logged : " + JSON.stringify(connectedUser))
                    socket.emit("login", [{error: 0, result: 1, data: connectedUser}]) 
                } else {
                    console.log("LOGIN FALSE")
                    socket.emit("login", [{error: 0, result: 1, data: 1}]) 
                }
            });
       });        
    })

    // EVENEMENTS
     socket.on("addEvent", message => {
         console.log("on event added: "+ JSON.stringify(message))
         MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             var db = client.db('ptutdb');

            // Ajout de l'événement
             var objNew = { title: message[0].title, date: message[0].date, description: message[0].description, image: message[0].image, guests: message[0].guests, admin: connectedUser, inviteCode: message[0].inviteCode, picturesList: message[0].picturesList, status: message[0].status};
             db.collection("event").insertOne(objNew, null, function (error, results) {
                 if (error) throw error;
                 console.log("EVENT inséré");    
             });
         }); 
     })

     socket.on("getEvent", () => {
        console.log("on get event: ")
        MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             var db = client.db('ptutdb');

            var eventsList = db.collection("event").find({admin: connectedUser}).toArray((err,res)=>{
                if (res.length > 0){
                    console.log("eventsList found" + JSON.stringify(res))
                    socket.emit("getEvent", [{error: 0, result: 1, data: res }])
                } else {
                    console.log("eventsList NOT found")
                    socket.emit("getEvent", [{error: 1, result: 0, data: 0}]) 
                }
             })            
             });           
     })

     socket.on("updateEvent", message => {
        console.log("on event updated: " + JSON.stringify(message))
        MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             var db = client.db('ptutdb');

             var eventToUpdate = db.collection("event").findOne( {_id : message[0].idEvent});

             if ( eventToUpdate ){
                 console.log("eventToUpdate found")
                 
                 db.collection("event").updateOne(
                     {_id: new ObjectID(message[0].idEvent), admin: connectedUser}, // Filtre
                     {$set: {title: message[0].title, // Update
                            date: message[0].date,
                            description: message[0].description,
                            image: message[0].image,
                            picturesList: message[0].picturesList,
                            inviteCode: message[0].inviteCode,
                            guests: message[0].guests,
                            status: message[0].status
                     }})                    
       
                     .then((obj => {
                        console.log('Updated - ' + obj);
                     }))

             } else {
                 console.log("eventToUpdate NOT found")
             }              
         }); 
     })

     socket.on("deleteEvent", message => {
        console.log("on event deleted: " + JSON.stringify(message))
        MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             var db = client.db('ptutdb');
  
             db.collection("event").remove( 
                 { _id: new ObjectID(message[0].idEvent) }
             ).then((obj => {
                console.log('Deleted - ' + obj);
                socket.emit("getEvent", [{error: obj.n, result: obj.ok, data: 0}]) 
             }))

         }); 
     })

 })


http.listen("8080","localhost");