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
        socket.emit("status",202);
     
     // INSCRIPTION
     socket.on("register/user",message => {
         MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
           if (error) socket.emit("register/user", JSON.stringify({code:500,data:{message:error}}));
            let db = client.db('ptutdb');
            //check si adresse mail unique
            let jsonMessage = JSON.parse(message);
            let uniqueMailAdressQuery = {mail:jsonMessage.data.mail}
            db.collection("user").findOne(uniqueMailAdressQuery, (error, results) => {
                if (error) socket.emit("register/user", JSON.stringify({code:500,data:{message:error}}));
                if(results){
                    socket.emit("register/user", JSON.stringify({code:403,data:{message:"Adresse mail déja utilisé"}})); 
                }else {
                    //adresse mail non utilise
                    let passwordToHash = jsonMessage.data.password;
                    bcrypt.hash(passwordToHash, 10).then(hash => {
                        // Store hash in your password DB.
                        let objNew = { firstName: jsonMessage.data.firstName, lastName: jsonMessage.data.lastName, password: hash, mail: jsonMessage.data.mail};  
                        db.collection("user").insertOne(objNew,(error, results) =>{
                            if (error) socket.emit("register/user", JSON.stringify({code:500,data:{message:error}}));
                            socket.emit("register/user", JSON.stringify({code:201,data:{message:"Utilisateur inscrit",user:{id:results.insertedId,firstName: jsonMessage.data.firstName,lastName: jsonMessage.data.lastName,mail: jsonMessage.data.mail}}}));   
                        });
                    })
                }      
            });
        });        
     })

     // CONNEXION
     socket.on("login/user",message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) => {
            if (error) socket.emit("login/user", JSON.stringify({code:500,data:{message:error}}));
            let db = client.db('ptutdb');

           let jsonMessage = JSON.parse(message);
           console.log(jsonMessage)
           // Load hash from your password DB.
           db.collection('user').findOne({mail: jsonMessage.data.mail},(err,result) => {
               //adresse mail trouver
               if(result){
                   //password here
                   bcrypt.compare(jsonMessage.data.password,result.password).then(res => {
                        //password match
                        if(res){
                            socket.emit("login/user", JSON.stringify({code:200,data:{message:"Utilisateur connecté",user:{userId:result._id,firstName:result.firstName,lastName:result.lastName,
                            mail:result.mail}}}));   
                        }else {
                            socket.emit("login/user", JSON.stringify({code:403,data:{message:"Mot de passe incorrecte"}}));   
                        }
                   })
               } else {
                socket.emit("login/user", JSON.stringify({code:403,data:{message:"Adresse mail inconnue"}}));   
            }
           });
        })
    });        
    

    // EVENEMENTS
     socket.on("add/event", message => {
         MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true}, (error, client) =>{
            if (error) socket.emit("add/event", JSON.stringify({code:500,data:{message:error}}));   
             let db = client.db('ptutdb');

             let jsonMessage = JSON.parse(message);
             //verification inviteCodeUnique
             db.collection("event").findOne({inviteCode:jsonMessage.data.inviteCode},(errorInvCode, resultsInvCode) =>{
                if (errorInvCode) socket.emit("add/event", JSON.stringify({code:500,data:{message:errorInvCode}}));  
                 
                if(resultsInvCode){
                    socket.emit("add/event", JSON.stringify({code:403,data:{message:"Code d'invitation non unique"}}));    
                }else {
                // Ajout de l'événement
                let objNew = { title: jsonMessage.data.title, date: jsonMessage.data.date, description: jsonMessage.data.description, image: jsonMessage.data.image, guests: [], admin: jsonMessage.auth, inviteCode: jsonMessage.data.inviteCode, picturesList: [], status: jsonMessage.data.status};
                db.collection("event").insertOne(objNew,(error, results) =>{
                if (error) socket.emit("add/event", JSON.stringify({code:500,data:{message:error}}));  
     
                socket.emit("add/event", JSON.stringify({code:200,data:{message:"Event crée"}}));    
                });
                }
                
             });
           
         }); 
     })

     socket.on("get/event", (message) => {
        
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true}, (error, client) =>{
            if (error) socket.emit("get/event", JSON.stringify({code:500,data:{message:error}}));   
            let db = client.db('ptutdb');

            let jsonMessage = JSON.parse(message);   
            db.collection("event").find({$or:[{admin: jsonMessage.auth},{guests:jsonMessage.auth}]}).toArray((err,res)=>{
                if (err) socket.emit("get/event", JSON.stringify({code:500,data:{message:err}}));   
                
                socket.emit("get/event", JSON.stringify({code:200,data:res}));    
                
             })  
              
             });        
     })

     //à refaire sprint 2
     socket.on("update/event", message => {
        console.log("on event updated: " + JSON.stringify(message))
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true}, (error, client) =>{
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

     //a refaire sprint 2
     socket.on("delete/event", message => {
        console.log("on event deleted: " + JSON.stringify(message))
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) => {
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
     //a faire
     socket.on("join/event", message => {

        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true}, (error, client)=> {
            if (error) socket.emit("join/event", JSON.stringify({code:500,data:{message:error}}));   
            let db = client.db('ptutdb');
            let jsonMessage = JSON.parse(message);   

             db.collection("event").updateOne(
                {_id : new ObjectID(jsonMessage.data.idEvent)},
                { $push: { guests: jsonMessage.auth }}
              ,(err,res) => {
                if (err) socket.emit("join/event", JSON.stringify({code:500,data:{message:err}})); 
                
                socket.emit("join/event", JSON.stringify({code:200,data:{message:"Event Rejoint"}}));    

              });
     });
    });
     
     //Ajouter des photos à l'évenement
     //a refaire
     socket.on("add/post", message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
            if (error) return funcCallback(error);
             console.log("Connecté à la base de données"); 
             let db = client.db('ptutdb');

            
          db.collection("event").updateOne(
            {_id: new ObjectID(message[0].idEvent)},{$push: {picturesList: {image : message[0].imageB64,userId:message[0].userId}}})   

         }); 
     });

     socket.on("like/post", message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
          
     
     });
    });

     socket.on("comment/post", message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
          
     
     });
    });

     socket.on("delete/post", message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
          
     
     });
    });

     socket.on("unlike/post", message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
          
     
     });
    });

     socket.on("uncoment/post", message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
          
     
     });
    });

     socket.on("get/post", message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
          
     
     });
    });

     socket.on("update/post", message => {
        MongoClient.connect("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true",{useNewUrlParser:true},(error, client) =>{
          
     
     });
    });


     //Deconnection 
    /* socket.on("disconnect",() => {
         
        //voir quel code a envoye
        socket.emit("disconnect",[{status:200}])
        socket.close();

     })*/
    });
    

 


http.listen("4545","192.168.43.47");