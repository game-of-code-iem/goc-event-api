//const DB = require("./constant/constant").DB
const express = require('express');
const controller = require('./controller/controller');
let MongoClient = require("mongodb").MongoClient;
let ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const DB = "mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true"
const port = "4545"
const host = "192.168.43.233"


const app = express();

// Pour autoriser les appels http
//const cors = require('cors')
//app.use(cors({credentials: true, origin: true}))

let http = require("http").createServer(app);
const io = require('socket.io')(http, { origins: '*:*' });

// CONTROLLER = controller
io.on("connection", (socket) => {
    console.log("on connection")
    socket.emit("status", 202);

    // INSCRIPTION
    socket.on("register/user", message => {
        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error) socket.emit("register/user", JSON.stringify({ code: 500, data: { message: error } }));
            let db = client.db('ptutdb');
            //check si adresse mail unique
            let jsonMessage = JSON.parse(message);
            let uniqueMailAdressQuery = { mail: jsonMessage.data.mail }
            db.collection("user").findOne(uniqueMailAdressQuery, (error, results) => {
                if (error){
                    socket.emit("register/user", JSON.stringify({ code: 500, data: { message: error } }));
                } else if (results) {
                    socket.emit("register/user", JSON.stringify({ code: 403, data: { message: "Adresse mail déja utilisé" } }));
                } else {
                    //adresse mail non utilise
                    let passwordToHash = jsonMessage.data.password;
                    bcrypt.hash(passwordToHash, 10).then(hash => {
                        // Store hash in your password DB.
                        let objNew = { firstName: jsonMessage.data.firstName, lastName: jsonMessage.data.lastName, password: hash, mail: jsonMessage.data.mail };
                        db.collection("user").insertOne(objNew, (error, results) => {
                            if (error){
                                socket.emit("register/user", JSON.stringify({ code: 500, data: { message: error } }));
                            } else {
                                socket.emit("register/user", JSON.stringify({ code: 201, data: { message: "Utilisateur inscrit", user: { id: results.insertedId, firstName: jsonMessage.data.firstName, lastName: jsonMessage.data.lastName, mail: jsonMessage.data.mail } } }));
                            }
                        });
                    })
                }
            });
        });
    })

    // CONNEXION
    socket.on("login/user", message => {
        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error){
                socket.emit("login/user", JSON.stringify({ code: 500, data: { message: error } }));
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
                                socket.emit("login/user", JSON.stringify({
                                    code: 200, data: {
                                        message: "Utilisateur connecté", user: {
                                            userId: result._id, firstName: result.firstName, lastName: result.lastName,
                                            mail: result.mail
                                        }
                                    }
                                }));
                            } else {
                                socket.emit("login/user", JSON.stringify({ code: 403, data: { message: "Mot de passe incorrecte" } }));
                            }
                        })
                    } else {
                        socket.emit("login/user", JSON.stringify({ code: 403, data: { message: "Adresse mail inconnue" } }));
                    }
                });
            }
        })
    });


    // EVENEMENTS
    socket.on("add/event", message => {
        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                socket.emit("add/event", JSON.stringify({ code: 500, data: { message: error } }));
            } else {
                let db = client.db('ptutdb');

                let jsonMessage = JSON.parse(message);
                //verification inviteCodeUnique
                db.collection("event").findOne({ inviteCode: jsonMessage.data.inviteCode }, (errorInvCode, resultsInvCode) => {
                    if (errorInvCode) {
                        socket.emit("add/event", JSON.stringify({ code: 500, data: { message: errorInvCode } }));
                    } else if (resultsInvCode) {
                        socket.emit("add/event", JSON.stringify({ code: 403, data: { message: "Code d'invitation non unique" } }));
                    } else {
                        // Ajout de l'événement
                        let objNew = { title: jsonMessage.data.title, date: jsonMessage.data.date, description: jsonMessage.data.description, image: jsonMessage.data.image, guests: [], admin: jsonMessage.auth, inviteCode: jsonMessage.data.inviteCode, picturesList: [], status: jsonMessage.data.status 
                        , commentEventList : []};
                        db.collection("event").insertOne(objNew, (error, results) => {
                            if (error) {
                                socket.emit("add/event", JSON.stringify({ code: 500, data: { message: error } }));
                            } else {
                                socket.emit("add/event", JSON.stringify({ code: 200, data: { message: "Event crée" } }));
                            }
                        });
                    }
                });
            }
        });
    })

    //get all event
    socket.on("get/event", (message) => {

        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                socket.emit("get/event", JSON.stringify({ code: 500, data: { message: error } }));
            } else {
                let db = client.db('ptutdb');

                let jsonMessage = JSON.parse(message);
                db.collection("event").find({ $or: [{ admin: jsonMessage.auth }, { guests: jsonMessage.auth }] }).toArray((err, res) => {
                    if (err){
                        socket.emit("get/event", JSON.stringify({ code: 500, data: { message: err } }));
                    } else {
                        socket.emit("get/event", JSON.stringify({ code: 200, data: res }));
                    }
                })
            }
        });
    })

    //get my event
    socket.on("get/MyEvent", (message) => {

        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                socket.emit("get/MyEvent", JSON.stringify({ code: 500, data: { message: error } }));
            } else {
                let db = client.db('ptutdb');

                let jsonMessage = JSON.parse(message);
                db.collection("event").find({admin: jsonMessage.auth }).toArray((err, res) => {
                    if (err){
                        socket.emit("get/MyEvent", JSON.stringify({ code: 500, data: { message: err } }));
                    } else {
                        socket.emit("get/MyEvent", JSON.stringify({ code: 200, data: res }));
                    }
                })
            }
        });
    })

    //get event joined
    socket.on("get/joinedEvent", (message) => {

        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                socket.emit("get/joinedEvent", JSON.stringify({ code: 500, data: { message: error } }));
            } else {
                let db = client.db('ptutdb');

                let jsonMessage = JSON.parse(message);
                db.collection("event").find({ guests: jsonMessage.auth }).toArray((err, res) => {
                    if (err){
                        socket.emit("get/joinedEvent", JSON.stringify({ code: 500, data: { message: err } }));
                    } else {
                        socket.emit("get/joinedEvent", JSON.stringify({ code: 200, data: res }));
                    }
                })
            }
        });
    })

    //update evenement
    socket.on("update/event", message => {
        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error) {
                socket.emit("get/event", JSON.stringify({ code: 500, data: { message: error } }));
            } else {
                let db = client.db('ptutdb');

                let jsonMessage = JSON.parse(message);
                db.collection("event").findOne({ _id: jsonMessage.auth }, (err, res) => {
                    if (err){
                        socket.emit("update/event", JSON.stringify({ code: 500, data: { message: err } }));
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
                                    socket.emit("update/event", JSON.stringify({ code: 500, data: { message: errUpdate } }));
                                } else {
                                    socket.emit("update/event", JSON.stringify({ code: 200, data: res }));
                                }      
                            })
                    }
                });
            }
      
        });
    });

    //delete event
    socket.on("delete/event", message => {
        
        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error){
                socket.emit("delete/event", JSON.stringify({ code: 500, data: { message: error } }));
            } else {
                let db = client.db('ptutdb');
                let jsonMessage = JSON.parse(message);

                db.collection("event").deleteOne(
                    { _id: new ObjectID(jsonMessage.auth) }
                ,(err,res)=>{
                    if (err){
                        socket.emit("delete/event", JSON.stringify({ code: 500, data: { message: err } }));
                    } else {
                        socket.emit("delete/event", JSON.stringify({ code: 200, data: { message: "Event supprimer" } }));
                    }
                })
            }
        });
    })
    
    socket.on("join/event", message => {

        MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
            if (error) socket.emit("join/event", JSON.stringify({ code: 500, data: { message: error } }));
            let db = client.db('ptutdb');
            let jsonMessage = JSON.parse(message);

            //check if user is in event
            db.collection("event").findOne({ guests: jsonMessage.auth }, (errorGuests, resultsGuests) => {
                if (errorGuests) socket.emit("join/event", JSON.stringify({ code: 500, data: { message: errorGuests } }));

                if (resultsGuests) {
                    socket.emit("join/event", JSON.stringify({ code: 403, data: { message: "Event déjà rejoint" } }));
                } else {
                    db.collection("event").updateOne(
                        { inviteCode: jsonMessage.data.inviteCode },
                        { $push: { guests: jsonMessage.auth } }
                        , (err, res) => {
                            if (err) socket.emit("join/event", JSON.stringify({ code: 500, data: { message: err } }));

                            socket.emit("join/event", JSON.stringify({ code: 200, data: { message: "Event Rejoint" } }));

                        });
                }
            });
        });

        //Ajouter des photos à l'évenement
        socket.on("add/post", message => {
            MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
                if (error){
                    socket.emit("add/post", JSON.stringify({ code: 500, data: { message: err } }));
                } else {
                    let db = client.db('ptutdb');
                    let jsonMessage = JSON.parse(message);
                    db.collection("event").updateOne(
                        { _id: new ObjectID(jsonMessage.auth) }, { $push: { picturesList: { image: jsonMessage.data.imageB64, userId: jsonMessage.data.userId,
                            firstName: jsonMessage.data.firstName, lastName : jsonMessage.data.lastName , likeList : [] , commentList : []} } },(err,res)=>{
                                if (err){
                                    socket.emit("add/post", JSON.stringify({ code: 500, data: { message: err } }));
                                } else {
                                    //todo broadcast
                                }
                            })
                    }
                });
            });
    
              

        socket.on("like/post", message => {
            MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {
                if (error){
                    socket.emit("like/post", JSON.stringify({ code: 500, data: { message: error } }));
                } else {
                    let db = client.db('ptutdb');
                    let jsonMessage = JSON.parse(message);
                    //check if photo is already liked by user
                    db.collection('event').findOne({_id: new ObjectID(jsonMessage.auth),'picturesList.likeList': {idUser:jsonMessage.data.idUser, liked:true}},(errFind,resFind)=>{
                        if(errFind){
                            socket.emit("like/post", JSON.stringify({ code: 500, data: { message: errFind } }));
                        }else if (resFind) {
                            //like 
                            socket.emit("like/post",JSON.stringify({ code: 403, data: { message: "Event déjà like" } }));
                        } else {
                            //ajout like
                            db.collection('event').updateOne({_id: new ObjectID(jsonMessage.auth)}, {$push: {'picturesList.likeList': {idUser:jsonMessage.data.idUser,
                                liked: true}}},(err,res)=>{
                                    if(err){
                                        socket.emit("like/post", JSON.stringify({ code: 500, data: { message: err } }));
                                    } else {
                                        //todo broadcast
                                    }
                                })
                        }
                    })
                }
            });
        });

        socket.on("comment/post", message => {
            MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {


            });
        });

        socket.on("delete/post", message => {
            MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {


            });
        });

        socket.on("unlike/post", message => {
            MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {


            });
        });

        socket.on("uncomment/post", message => {
            MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {


            });
        });

        socket.on("get/post", message => {
            MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {


            });
        });

        socket.on("update/post", message => {
            MongoClient.connect(DB, { useNewUrlParser: true }, (error, client) => {


            });
        });

    });
});

const {Dispatcher} = require("./engine/Dispatcher")
let dispatcher = new Dispatcher()
const SocketManager = require("./engine/Socket")



dispatcher.add("register/user",registerUser)
dispatcher.add("login/user",loginUser)
dispatcher.add("add/event",addEvent)
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

function registerUser(data,id) {
    SocketManager.emit("register/user",{},id)
}

function loginUser(data,id) {

}

function addEvent(data,id) {

}

function getMyEvent(data,id) {

}

function updateEvent(data,id) {

}

function getJoinedEvent(data,id) {

}

function deleteEvent(data,id) {

}

function joinEvent(data,id) {

}

function addPost(data,id) {

}

function likePost(data,id) {

}

function commentPost(data,id) {

}

function deletePost(data,id) {

}

function unlikePost(data,id) {

}

function unCommentPost(data,id) {

}

function getPost(data,id) {

}


http.listen(port, host);