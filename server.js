//const DB = require("./constant/constant").DB
const express = require('express');
const controller = require('./controller/controller');
let MongoClient = require("mongodb").MongoClient;
let ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const DB = "mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true"
const port = "4545"
const host = "192.168.1.10" 

const app = express();

let http = require("http").createServer(app);

const {Dispatcher} = require("./engine/Dispatcher")
const {MongoDBManager} = require("./engine/MangoDB")
let mongoDB = new MongoDBManager("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true")
let dispatcher = new Dispatcher()
const SocketManager = require("./engine/Socket")

mongoDB.db

dispatcher.add("register/user",registerUser)
dispatcher.add("login/user",loginUser)
dispatcher.add("add/event",addEvent)
dispatcher.add("get/event",getEvent)
dispatcher.add("get/myEvent",getMyEvent)
dispatcher.add("update/event",updateEvent)
dispatcher.add("get/joinedEvent",getJoinedEvent)
dispatcher.add("join/event",joinEvent)
dispatcher.add("delete/event",deleteEvent)
dispatcher.add("add/post",addPost)
dispatcher.add("like/post",likePost)
dispatcher.add("comment/post",commentPost)
dispatcher.add("delete/post",deletePost)
dispatcher.add("unlike/post",unlikePost)
dispatcher.add("uncomment/post",unCommentPost)
dispatcher.add("get/post",getPost)

SocketManager.init(dispatcher,http)



function registerUser(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error) socket.emit("register/user", JSON.stringify({ code: 500, data: { message: error } }));
        let db = client.db('ptutdb');
        //check si adresse mail unique
        let jsonMessage = JSON.parse(message);
        let uniqueMailAdressQuery = { mail: jsonMessage.data.mail }
        db.collection("user").findOne(uniqueMailAdressQuery, (error, results) => {
            if (error){
                SocketManager.emit("register/user", JSON.stringify({ code: 500, data: { message: error } }),id);
                console.log(error)
            } else if (results) {
                SocketManager.emit("register/user", JSON.stringify({ code: 403, data: { message: "Adresse mail déja utilisé" } }),id);
                console.log(jsonMessage)

            } else {
                //adresse mail non utilise
                let passwordToHash = jsonMessage.data.password;
                bcrypt.hash(passwordToHash, 10).then(hash => {
                    // Store hash in your password DB.
                    let objNew = { firstName: jsonMessage.data.firstName, lastName: jsonMessage.data.lastName, password: hash, mail: jsonMessage.data.mail };
                    db.collection("user").insertOne(objNew, (error, results) => {
                        if (error){
                            SocketManager.emit("register/user", JSON.stringify({ code: 500, data: { message: error } }),id);
                        } else {
                            SocketManager.emit("register/user", JSON.stringify({ code: 201, data: { message: "Utilisateur inscrit", user: { id: results.insertedId, firstName: jsonMessage.data.firstName, lastName: jsonMessage.data.lastName, mail: jsonMessage.data.mail } } }),id);
                            console.log(jsonMessage)
                        }
                    });
                })
            }
        });
    });
    
}

function loginUser(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error){
            SocketManager.emit("login/user", JSON.stringify({ code: 500, data: { message: error } }),id);
        } else {
            let db = client.db('ptutdb');

            let jsonMessage = JSON.parse(message);
            // Load hash from your password DB.
            db.collection('user').findOne({ mail: jsonMessage.data.mail }, (err, result) => {
                //adresse mail trouver
                if (result) {
                    //password here
                    bcrypt.compare(jsonMessage.data.password, result.password).then(res => {
                        //password match
                        if (res) {
                            SocketManager.emit("login/user", JSON.stringify({
                                code: 200, data: {
                                    message: "Utilisateur connecté", user: {
                                        userId: result._id, firstName: result.firstName, lastName: result.lastName,
                                        mail: result.mail
                                    }
                                }
                            }),id);
                        } else {
                            SocketManager.emit("login/user", JSON.stringify({ code: 403, data: { message: "Mot de passe incorrecte" } }),id);
                        }
                    })
                } else {
                    SocketManager.emit("login/user", JSON.stringify({ code: 403, data: { message: "Adresse mail inconnue" } }),id);
                }
            });
        }
    })
}

function addEvent(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error) {
            SocketManager.emit("add/event", JSON.stringify({ code: 500, data: { message: error } }),id);
        } else {
            let db = client.db('ptutdb');

            let jsonMessage = JSON.parse(message);
            //verification inviteCodeUnique
            db.collection("event").findOne({ inviteCode: jsonMessage.data.inviteCode }, (errorInvCode, resultsInvCode) => {
                if (errorInvCode) {
                    SocketManager.emit("add/event", JSON.stringify({ code: 500, data: { message: errorInvCode } }),id);
                } else if (resultsInvCode) {
                    SocketManager.emit("add/event", JSON.stringify({ code: 403, data: { message: "Code d'invitation non unique" } }),id);
                    console.log(jsonMessage)
                } else {
                    // Ajout de l'événement
                    let objNew = { title: jsonMessage.data.title, date: jsonMessage.data.date, description: jsonMessage.data.description, image: jsonMessage.data.image, guests: [], admin: jsonMessage.auth, inviteCode: jsonMessage.data.inviteCode, picturesList: [], status: jsonMessage.data.status 
                    , commentEventList : []};
                    db.collection("event").insertOne(objNew, (error, results) => {
                        if (error) {
                            SocketManager.emit("add/event", JSON.stringify({ code: 500, data: { message: error } }),id);
                        } else {
                            console.log(jsonMessage)
                            SocketManager.emit("add/event", JSON.stringify({ code: 200, data: { message: "Event crée" } }),id);
                        }
                    });
                }
            });
        }
    });
}

function getEvent(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error) {
            SocketManager.emit("get/event", JSON.stringify({ code: 500, data: { message: error } }),id);
        } else {
            let db = client.db('ptutdb');
            let jsonMessage = JSON.parse(message);
            db.collection("event").find({ $or: [{ admin: jsonMessage.auth }, { guests: jsonMessage.auth }] }).toArray((err, res) => {
                if (err){
                    SocketManager.emit("get/event", JSON.stringify({ code: 500, data: { message: err } }),id);
                } else {
                    SocketManager.emit("get/event", JSON.stringify({ code: 200, data: res }),id);
                    console.log(jsonMessage)
                }
            })
        }
    }); 
}

function getMyEvent(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error) {
            SocketManager.emit("get/MyEvent", JSON.stringify({ code: 500, data: { message: error } }),id);
        } else {
            let db = client.db('ptutdb');

            let jsonMessage = JSON.parse(message);
            db.collection("event").find({admin: jsonMessage.auth }).toArray((err, res) => {
                if (err){
                    SocketManager.emit("get/MyEvent", JSON.stringify({ code: 500, data: { message: err } }),id);
                } else {
                    SocketManager.emit("get/MyEvent", JSON.stringify({ code: 200, data: res }),id);
                    console.log(jsonMessage)
                }
            })
        }
    });
}

function updateEvent(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error) {
            SocketManager.emit("get/event", JSON.stringify({ code: 500, data: { message: error }}),id);
        } else {
            let db = client.db('ptutdb');
            let jsonMessage = JSON.parse(message);
            db.collection("event").findOne({ _id: jsonMessage.auth }, (err, res) => {
                if (err) {
                    SocketManager.emit("update/event", JSON.stringify({ code: 500, data: { message: err } }),id);
                } else if (res) {
                    db.collection("event").updateOne(
                        { _id: new ObjectID(jsonMessage.auth) },
                        {
                            $set: {
                                title: jsonMessage.data.title, // Update
                                date: jsonMessage.data.date,
                                description: jsonMessage.data.description,
                                image: jsonMessage.data.image,
                                inviteCode: jsonMessage.data.inviteCode,
                                status: jsonMessage.data.status
                            }
                        },(errUpdate,resUpdate)=>{
                            if (errUpdate) {
                                SocketManager.emit("update/event", JSON.stringify({ code: 500, data: { message: errUpdate } }),id);
                            } else {
                                SocketManager.emit("update/event", JSON.stringify({ code: 200, data: res }),id);
                                console.log(jsonMessage)

                            }      
                        })
                }
            });
        }
    });
}

function getJoinedEvent(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error) {
            SocketManager.emit("get/joinedEvent", JSON.stringify({ code: 500, data: { message: error } }),id);
        } else {
            let db = client.db('ptutdb');

            let jsonMessage = JSON.parse(message);
            db.collection("event").find({ guests: jsonMessage.auth }).toArray((err, res) => {
                if (err){
                    SocketManager.emit("get/joinedEvent", JSON.stringify({ code: 500, data: { message: err } }),id);
                } else {
                    SocketManager.emit("get/joinedEvent", JSON.stringify({ code: 200, data: res }),id);
                    console.log(jsonMessage)
                }
            })
        }
    });
}

function deleteEvent(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error){
            SocketManager.emit("delete/event", JSON.stringify({ code: 500, data: { message: error } }),id);
        } else {
            let db = client.db('ptutdb');
            let jsonMessage = JSON.parse(message);

            db.collection("event").deleteOne(
                { _id: new ObjectID(jsonMessage.auth) }
            ,(err,res)=>{
                if (err){
                    SocketManager.emit("delete/event", JSON.stringify({ code: 500, data: { message: err } }),id);
                } else {
                    SocketManager.emit("delete/event", JSON.stringify({ code: 200, data: { message: "Event supprimer" } }),id);
                    console.log(jsonMessage)
                }
            })
        }
    });
}

function joinEvent(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error) SocketManager.emit("join/event", JSON.stringify({ code: 500, data: { message: error } }),id);
        let db = client.db('ptutdb');
        let jsonMessage = JSON.parse(message);

        //check if user is in event
        db.collection("event").findOne({ guests: jsonMessage.auth }, (errorGuests, resultsGuests) => {
            if (errorGuests) SocketManager.emit("join/event", JSON.stringify({ code: 500, data: { message: errorGuests } }),id);

            if (resultsGuests) {
                SocketManager.emit("join/event", JSON.stringify({ code: 403, data: { message: "Event déjà rejoint" } }),id);
            } else {
                db.collection("event").updateOne(
                    { inviteCode: jsonMessage.data.inviteCode },
                    { $push: { guests: jsonMessage.auth } }
                    , (err, res) => {
                        if (err) SocketManager.emit("join/event", JSON.stringify({ code: 500, data: { message: err } }),id);
                        SocketManager.emit("join/event", JSON.stringify({ code: 200, data: { message: "Event Rejoint" } }),id);
                    });
            }
        }); 
    });
}

function addPost(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error){
            SocketManager.emit("add/post", JSON.stringify({ code: 500, data: { message: err } }),id);
        } else {
            let db = client.db('ptutdb');
            let jsonMessage = JSON.parse(message);
            db.collection("event").updateOne(
                { _id: new ObjectID(jsonMessage.auth) }, { $push: { picturesList: { image: jsonMessage.data.imageB64, userId: jsonMessage.data.userId,
                    firstName: jsonMessage.data.firstName, lastName : jsonMessage.data.lastName , likeList : [] , commentList : []} } },(err,res)=>{
                        if (err){
                            SocketManager.emit("add/post", JSON.stringify({ code: 500, data: { message: err } }),id);
                        } else {
                            //todo broadcast
                        }
                    })
            }
    });
}

function likePost(message,id) {
    MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
        if (error){
            SocketManager.emit("like/post", JSON.stringify({ code: 500, data: { message: error } }),id);
        } else {
            let db = client.db('ptutdb');
            let jsonMessage = JSON.parse(message);
            //check if photo is already liked by user
            db.collection('event').findOne({_id: new ObjectID(jsonMessage.auth),'picturesList.likeList': {idUser:jsonMessage.data.idUser, liked:true}},(errFind,resFind)=>{
                if(errFind){
                    SocketManager.emit("like/post", JSON.stringify({ code: 500, data: { message: errFind } }),id);
                }else if (resFind) {
                    //like 
                    SocketManager.emit("like/post",JSON.stringify({ code: 403, data: { message: "Event déjà like" } }),id);
                } else {
                    //ajout like
                    db.collection('event').updateOne({_id: new ObjectID(jsonMessage.auth)}, {$push: {'picturesList.likeList': {idUser:jsonMessage.data.idUser,
                        liked: true}}},(err,res)=>{
                            if(err){
                                SocketManager.emit("like/post", JSON.stringify({ code: 500, data: { message: err } }),id);
                            } else {
                                //todo broadcast
                            }
                        })
                }
            })
        }
    });
}

function commentPost(message,id) {

}

function deletePost(message,id) {

}

function unlikePost(message,id) {

}

function unCommentPost(message,id) {

}

function getPost(message,id) {

}


http.listen(port, host);