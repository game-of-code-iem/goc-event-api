//const DB = require("./constant/constant").DB
const express = require('express');
const controller = require('./controller/controller');
let MongoClient = require("mongodb").MongoClient;
let ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');


const app = express();

// Pour autoriser les appels http
//const cors = require('cors')
//app.use(cors({credentials: true, origin: true}))

let http = require("http").createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});
let connectedUser;

// CONTROLLER = controller
 io.on("connection",(socket) => {
     console.log("on connection")

     
     // INSCRIPTION
     socket.on("register",message => {
         console.log("on register: " +message)

         MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
           if (error) throw error ;
            let db = client.db('ptutdb');

            //check si adresse mail unique
            let jsonMessage = JSON.parse(message);
            let uniqueMailAdressQuery = {mail:jsonMessage.mail}
            db.collection("user").findOne(uniqueMailAdressQuery, (error, results) => {
                if (error) throw error;
                if(results){
                    socket.emit("register", JSON.stringify({codeStatus:404,message:"Adresse mail déja utilisé"})); 
                }else {
                    //adresse mail non utilise
                    let passwordToHash = jsonMessage.password;
                    bcrypt.hash(passwordToHash, 10).then(hash => {
                        // Store hash in your password DB.
                        let objNew = { firstName: jsonMessage.firstName, lastName: jsonMessage.lastName, password: hash, mail: jsonMessage.mail,eventList:[]};  
                        db.collection("user").insertOne(objNew,(error, results) =>{
                            if (error) throw error;
                    
                            socket.emit("register", JSON.stringify({codeStatus:201,message:"Utilisateur inscrit",user:results.insertedId}));   
                        });
                    })
                }
                  
            });
        });        
     })

     // CONNEXION
     socket.on("login",message => {
        console.log("on login: "+message)

        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) => {
          if (error) throw (error);
           let db = client.db('ptutdb');


           let jsonMessage = JSON.parse(message);
           // Load hash from your password DB.
           let user = db.collection('user').findOne({mail: jsonMessage.mail},(err,result) => {
               //adresse mail trouver
               if(result){
                   //password here
                   bcrypt.compare(jsonMessage.password,result.password).then(res => {
                        //password match
                        if(res){
                            socket.emit("login", JSON.stringify({codeStatus:200,message:"Utilisateur connecté",user:{firstName:result.firstName,lastName:result.lastName,
                            mail:result.mail,eventList:result.eventList}}));   
                        }else {
                            socket.emit("login", JSON.stringify({codeStatus:404,message:"Mot de passe incorrecte"}));   
                        }
                   })
               } else {
                socket.emit("login", JSON.stringify({codeStatus:404,message:"Adresse mail inconnue"}));   
            }
           });
            })
            
       });        
    

    // EVENEMENTS
     socket.on("addEvent", message => {
         console.log("on event added: "+ JSON.stringify(message))
         MongoClient.connect(CONSTANT.DB, function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             let db = client.db('ptutdb');

            // Ajout de l'événement
             let objNew = { title: message[0].title, date: message[0].date, description: message[0].description, image: message[0].image, guests: [], admin: connectedUser, inviteCode: message[0].inviteCode, picturesList: [], status: message[0].status};
             db.collection("event").insertOne(objNew, null, function (error, results) {
                 if (error) throw error;
                 console.log("EVENT inséré");    
             });
         }); 
     })

     socket.on("getEvent", () => {
        console.log("on get event: ")
        MongoClient.connect(CONSTANT.DB, function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             let db = client.db('ptutdb');

            let eventsList = db.collection("event").find({admin: connectedUser}).toArray((err,res)=>{
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
        MongoClient.connect(CONSTANT.DB, function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             let db = client.db('ptutdb');

             let eventToUpdate = db.collection("event").findOne( {_id : message[0].idEvent});

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
        MongoClient.connect(CONSTANT.DB, function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             let db = client.db('ptutdb');
  
             db.collection("event").remove( 
                 { _id: new ObjectID(message[0].idEvent) }
             ).then((obj => {
                console.log('Deleted - ' + obj);
                socket.emit("getEvent", [{error: obj.n, result: obj.ok, data: 0}]) 
             }))

         }); 
     })

     socket.on("joinEvent", message => {
        console.log("on event joined: " + JSON.stringify(message))

        MongoClient.connect(CONSTANT.DB, function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             let db = client.db('ptutdb');

             db.collection("event").updateOne(
                {_id : message[0].idEvent},
                { $push: { "guests.0.login": connectedUser.login }}
              );
     })

        //  let eventToJoin = db.collection("event").findOne( {_id : message[0].idEvent});
        //  if ( eventToJoin ){
        //     console.log("eventToJoin found")
             
        //     let guests = []
        //     guests.push(eventToJoin.guests);                
        //     console.log("guests : "+guests)

        //     //  db.collection("event").updateOne(
        //     //      {_id: new ObjectID(message[0].idEvent)}, // Filtre
        //     //      {$set: { guests: connectedUser}})                    
        //     //      .then((obj => {
        //     //         console.log('Updated - ' + obj);
        //     //      }))

        //  } else {
        //      console.log("eventToJoin NOT found")
        //  }  
     })
     
     //Ajouter des photos à l'évenement
     socket.on("addPhotoEvent", message => {
        MongoClient.connect(CONSTANT.DB, function(error, client) {
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             let db = client.db('ptutdb');

            
          db.collection("event").updateOne(
            {_id: new ObjectID(message[0].idEvent)},{$push: {picturesList: {image : message[0].imageB64,userId:message[0].userId}}})   

         }); 
     })


     //Deconnection 
    /* socket.on("disconnect",() => {
         
        //voir quel code a envoye
        socket.emit("disconnect",[{status:200}])
        socket.close();

     })*/
    });
    

 


http.listen("8080","localhost");