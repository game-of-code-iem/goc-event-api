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

            var objNew = { login: message[0].login, password: message[0].password, mail: message[0].mail};  
            db.collection("user").insertOne(objNew, null, function (error, results) {
                if (error) throw error;
                console.log("USER inséré");
                socket.emit("register", [{error: 0, result: 1, data: 0}])   
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

           var userLogged = db.collection("user").findOne( { login: message[0].login, password: message[0].password } );
            if ( userLogged ){
                console.log("LOGIN DONE")
                socket.emit("login", "ok") 
            } else {
                console.log("LOGIN FALSE")
                socket.emit("login", "no") 
            }
       });        
    })

     socket.on("addEvent", message => {
         console.log("on event added: "+ message)
         MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             var db = client.db('ptutdb');

            // Ajout de la photo
            // var Item = new ItemSchema(
            //     { img: 
            //         { data: Buffer, contentType: String }
            //     }
            //   );
            // var newItem = new Item();
            // newItem.img.data = fs.readFileSync("path")
            // newItem.img.contentType = ‘image/png’;
            // newItem.save();


            // Ajout de l'événement
             var objNew = { name: message[0].name, date: message[0].date, description: message[0].description, urlMainPic: message[0].urlMainPic, guests: message[0].guests, admin: message[0].admin, inviteCode: message[0].inviteCode};
             db.collection("event").insert(objNew, null, function (error, results) {
                 if (error) throw error;
                 console.log("EVENT inséré");    
             });
         }); 
     })

     socket.on("updateEvent", message => {
        console.log("on event updated: " + message)
        MongoClient.connect("mongodb://localhost:27017/gameofcode", function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             var db = client.db('ptutdb');

             var eventToUpdate = db.collection("event").findOne( {_id : "5cc867cc04a29831421cc81c"});

             if ( eventToUpdate ){
                 console.log("eventToUpdate found")

                 db.collection("event").updateOne(
                     {"_id" : "5cc867cc04a29831421cc81c"}, // Filter + check si le user est bien le userConnected
                     {$set: {"name": "test"}}) // Update

                     .then((obj => {
                        console.log('Updated - ' + obj);
                     }))

             } else {
                 console.log("eventToUpdate NOT found")
             }
              
         }); 
     })

 })


http.listen("8080","localhost");