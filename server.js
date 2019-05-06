const express = require('express');
let ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const port = "4545"
const host = "192.168.1.10"
const app = express();
let http = require("http").createServer(app);
const { Dispatcher } = require("./engine/Dispatcher")
const { MongoDBManager } = require("./engine/MangoDB")
let mongoDB = new MongoDBManager("mongodb+srv://lp:lp@gocdb-jmzof.gcp.mongodb.net/test?retryWrites=true")
let dispatcher = new Dispatcher()
const SocketManager = require("./engine/Socket")

dispatcher.add("register/user", registerUser)
dispatcher.add("login/user", loginUser)
dispatcher.add("add/event", addEvent)
dispatcher.add("get/event", getEvent)
dispatcher.add("get/myEvent", getMyEvent)
dispatcher.add("update/event", updateEvent)
dispatcher.add("get/joinedEvent", getJoinedEvent)
dispatcher.add("join/event", joinEvent)
dispatcher.add("delete/event", deleteEvent)
dispatcher.add("add/post", addPost)
dispatcher.add("like/post", likePost)
dispatcher.add("comment/post", commentPost)
dispatcher.add("delete/post", deletePost)
dispatcher.add("unlike/post", unlikePost)
dispatcher.add("uncomment/post", unCommentPost)
dispatcher.add("get/post", getPost)
SocketManager.init(dispatcher, http)



function registerUser(message, id) {
    let uniqueMailAdressQuery = { mail: message.data.mail }
    mongoDB.db.collection("user").findOne(uniqueMailAdressQuery, (error, results) => {
        if (error) {
            SocketManager.emit("register/user", JSON.stringify({ code: 500, data: { message: error } }), id);
            console.log(error)
        } else if (results) {
            SocketManager.emit("register/user", JSON.stringify({ code: 403, data: { message: "Adresse mail déja utilisé" } }), id);
            console.log(message)
        } else {
            //adresse mail non utilise
            let passwordToHash = message.data.password;
            bcrypt.hash(passwordToHash, 10).then(hash => {
                // Store hash in your password DB.
                let objNew = { firstName: message.data.firstName, lastName: message.data.lastName, password: hash, mail: message.data.mail };
                mongoDB.db.collection("user").insertOne(objNew, (error, results) => {
                    if (error) {
                        SocketManager.emit("register/user", JSON.stringify({ code: 500, data: { message: error } }), id);
                    } else {
                        SocketManager.emit("register/user", JSON.stringify({ code: 201, data: { message: "Utilisateur inscrit", user: { id: results.insertedId, firstName: message.data.firstName, lastName: message.data.lastName, mail: message.data.mail } } }), id);
                        console.log(message)
                    }
                });
            })
        }
    });
}

function loginUser(message, id) {
    // Load hash from your password DB.
    mongoDB.db.collection('user').findOne({ mail: message.data.mail }, (err, result) => {
        //adresse mail trouver
        if (result) {
            //password here
            bcrypt.compare(message.data.password, result.password).then(res => {
                //password match
                if (res) {
                    SocketManager.emit("login/user", JSON.stringify({
                        code: 200, data: {
                            message: "Utilisateur connecté", user: {
                                userId: result._id, firstName: result.firstName, lastName: result.lastName,
                                mail: result.mail
                            }
                        }
                    }), id);
                } else {
                    SocketManager.emit("login/user", JSON.stringify({ code: 403, data: { message: "Mot de passe incorrecte" } }), id);
                }
            })
        } else {
            SocketManager.emit("login/user", JSON.stringify({ code: 403, data: { message: "Adresse mail inconnue" } }), id);
        }
    });

}

function addEvent(message, id) {
    //verification inviteCodeUnique
    mongoDB.db.collection("event").findOne({ inviteCode: message.data.inviteCode }, (errorInvCode, resultsInvCode) => {
        if (errorInvCode) {
            SocketManager.emit("add/event", JSON.stringify({ code: 500, data: { message: errorInvCode } }), id);
        } else if (resultsInvCode) {
            SocketManager.emit("add/event", JSON.stringify({ code: 403, data: { message: "Code d'invitation non unique" } }), id);
            console.log(message)
        } else {
            // Ajout de l'événement
            let objNew = {
                title: message.data.title, date: message.data.date, description: message.data.description, image: message.data.image, guests: [], admin: message.auth, inviteCode: message.data.inviteCode, picturesList: [], status: message.data.status
                , commentEventList: []
            };
            mongoDB.db.collection("event").insertOne(objNew, (error, results) => {
                if (error) {
                    SocketManager.emit("add/event", JSON.stringify({ code: 500, data: { message: error } }), id);
                } else {
                    console.log(message)
                    SocketManager.emit("add/event", JSON.stringify({ code: 200, data: { message: "Event crée" } }), id);
                }
            });
        }
    });
}

function getEvent(message, id) {
    mongoDB.db.collection("event").find({ $or: [{ admin: message.auth }, { guests: message.auth }] }).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/event", JSON.stringify({ code: 500, data: { message: err } }), id);
        } else {
            SocketManager.emit("get/event", JSON.stringify({ code: 200, data: res }), id);
            console.log(message)
        }
    })
}

function getMyEvent(message, id) {
    mongoDB.db.collection("event").find({ admin: message.auth }).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/MyEvent", JSON.stringify({ code: 500, data: { message: err } }), id);
        } else {
            SocketManager.emit("get/MyEvent", JSON.stringify({ code: 200, data: res }), id);
            console.log(message)
        }
    })
}

function updateEvent(message, id) {
    mongoDB.db.collection("event").findOne({ _id: message.auth }, (err, res) => {
        if (err) {
            SocketManager.emit("update/event", JSON.stringify({ code: 500, data: { message: err } }), id);
        } else if (res) {
            mongoDB.db.collection("event").updateOne(
                { _id: new ObjectID(message.auth) },
                {
                    $set: {
                        title: message.data.title, // Update
                        date: message.data.date,
                        description: message.data.description,
                        image: message.data.image,
                        inviteCode: message.data.inviteCode,
                        status: message.data.status
                    }
                }, (errUpdate, resUpdate) => {
                    if (errUpdate) {
                        SocketManager.emit("update/event", JSON.stringify({ code: 500, data: { message: errUpdate } }), id);
                    } else {
                        SocketManager.emit("update/event", JSON.stringify({ code: 200, data: res }), id);
                        console.log(message)
                    }
                })
        }
    });
}

function getJoinedEvent(message, id) {
    mongoDB.db.collection("event").find({ guests: message.auth }).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/joinedEvent", JSON.stringify({ code: 500, data: { message: err } }), id);
        } else {
            SocketManager.emit("get/joinedEvent", JSON.stringify({ code: 200, data: res }), id);
            console.log(message)
        }
    })
}

function deleteEvent(message, id) {
    mongoDB.db.collection("event").deleteOne(
        { _id: new ObjectID(message.auth) }
        , (err, res) => {
            if (err) {
                SocketManager.emit("delete/event", JSON.stringify({ code: 500, data: { message: err } }), id);
            } else {
                SocketManager.emit("delete/event", JSON.stringify({ code: 200, data: { message: "Event supprimer" } }), id);
                console.log(message)
            }
        })
}

function joinEvent(message, id) {


    //check if user is in event
    mongoDB.db.collection("event").findOne({ guests: message.auth }, (errorGuests, resultsGuests) => {
        if (errorGuests) SocketManager.emit("join/event", JSON.stringify({ code: 500, data: { message: errorGuests } }), id);

        if (resultsGuests) {
            SocketManager.emit("join/event", JSON.stringify({ code: 403, data: { message: "Event déjà rejoint" } }), id);
        } else {
            mongoDB.db.collection("event").updateOne(
                { inviteCode: message.data.inviteCode },
                { $push: { guests: message.auth } }
                , (err, res) => {
                    if (err) SocketManager.emit("join/event", JSON.stringify({ code: 500, data: { message: err } }), id);
                    SocketManager.emit("join/event", JSON.stringify({ code: 200, data: { message: "Event Rejoint" } }), id);
                });
        }
    });
}

function addPost(message, id) {
    db.collection("event").updateOne(
        { _id: new ObjectID(message.auth) }, {
            $push: {
                picturesList: {
                    image: message.data.imageB64, userId: message.data.userId,
                    firstName: message.data.firstName, lastName: message.data.lastName, likeList: [], commentList: []
                }
            }
        }, (err, res) => {
            if (err) {
                SocketManager.emit("add/post", JSON.stringify({ code: 500, data: { message: err } }), id);
            } else {
                //todo broadcast
            }
        })
}

function likePost(message, id) {
    db.collection('event').findOne({ _id: new ObjectID(message.auth), 'picturesList.likeList': { idUser: message.data.idUser, liked: true } }, (errFind, resFind) => {
        if (errFind) {
            SocketManager.emit("like/post", JSON.stringify({ code: 500, data: { message: errFind } }), id);
        } else if (resFind) {
            //like 
            SocketManager.emit("like/post", JSON.stringify({ code: 403, data: { message: "Event déjà like" } }), id);
        } else {
            //ajout like
            db.collection('event').updateOne({ _id: new ObjectID(message.auth) }, {
                $push: {
                    'picturesList.likeList': {
                        idUser: message.data.idUser,
                        liked: true
                    }
                }
            }, (err, res) => {
                if (err) {
                    SocketManager.emit("like/post", JSON.stringify({ code: 500, data: { message: err } }), id);
                } else {
                    //todo broadcast
                }
            })
        }
    })
}

function commentPost(message, id) {

}

function deletePost(message, id) {

}

function unlikePost(message, id) {

}

function unCommentPost(message, id) {

}

function getPost(message, id) {

}


http.listen(port, host);