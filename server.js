const express = require('express');
let ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcrypt');
const port = "4545"
const host = "192.168.43.121"
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
dispatcher.add("action", action)

SocketManager.init(dispatcher, http)

function registerUser(message, id) {
    let uniqueMailAdressQuery = { mail: message.data.mail }
    mongoDB.getUser().findOne(uniqueMailAdressQuery, (error, results) => {
        if (error) {
            SocketManager.emit("register/user", { code: 500, data: { message: error }}, id)
        } else if (results) {
            SocketManager.emit("register/user", { code: 403, data: { message: "Adresse mail déja utilisé" } }, id);
        } else {
            let passwordToHash = message.data.password;
            bcrypt.hash(passwordToHash, 10).then(hash => {
                let objNew = { firstName: message.data.firstName, lastName: message.data.lastName, password: hash, mail: message.data.mail };
                mongoDB.getUser().insertOne(objNew, (error, results) => {
                    if (error) {
                        SocketManager.emit("register/user", {
                            code: 500, 
                            data: { 
                                message:error
                            }
                        }, id);
                    } else {
                        SocketManager.emit("register/user", { 
                            code: 201, 
                            data: { 
                                message: "Utilisateur inscrit", 
                                user: { 
                                    id: results.insertedId, 
                                    firstName: message.data.firstName, 
                                    lastName: message.data.lastName, 
                                    mail: message.data.mail 
                                } 
                            } 
                        }, id)
                    }
                });
            })
        }
    })
}

function loginUser(message,id) {
    mongoDB.getUser().findOne({ mail: message.data.mail }, (err, result) => {
        if (result) {
            bcrypt.compare(message.data.password, result.password).then(res => {
                if (res) {
                    SocketManager.emit("login/user",{
                        code: 200, data: {
                            message: "Utilisateur connecté", user: {
                                userId: result._id, 
                                firstName: result.firstName, 
                                lastName: result.lastName,
                                mail: result.mail
                            }
                        }
                    }, id);
                } else {
                    SocketManager.emit("login/user",{code:403,data:{message:"Mot de passe incorrecte"}},id);
                }
            })
        } else {
            SocketManager.emit("login/user",{code: 403,data:{message: "Adresse mail inconnue"}},id);
        }
    });

}

function addEvent(message, id) {
    mongoDB.getEvent().findOne({inviteCode: message.data.inviteCode},(errorInvCode, resultsInvCode) => {
        if (errorInvCode) {
            SocketManager.emit("add/event",{code:500,data:{message: errorInvCode}},id);
        } else if (resultsInvCode) {
            SocketManager.emit("add/event",{code:403,data:{message:"Code d'invitation non unique"}},id);
        } else {
            let objNew = {
                title: message.data.title, 
                date: message.data.date, 
                description: message.data.description, 
                extension:message.data.extension,
                uri:message.data.uri,
                guests: [], 
                admin: message.auth, 
                inviteCode: message.data.inviteCode, 
                picturesList: [], 
                status: message.data.status, 
                commentEventList: []
            };
            mongoDB.getEvent().insertOne(objNew, (error, results) => {
                if (error) {
                    SocketManager.emit("add/event", { code: 500, data: { message: error } }, id);
                } else {
                    console.log(message)
                    SocketManager.emit("add/event", { code: 200, data: { message: "Event crée" } }, id);
                }
            });
        }
    });
}

function getEvent(message, id) {
    mongoDB.getEvent().find({ $or: [{ admin: message.auth }, { guests: message.auth }] }).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/event", { code: 500, data: { message: err } }, id);
        } else {
            SocketManager.emit("get/event", { code: 200, data: res }, id);
            console.log(message)
        }
    })
}

function getMyEvent(message, id) {
    mongoDB.getEvent().find({ admin: message.auth }).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/MyEvent", { code: 500, data: { message: err } }, id);
        } else {
            SocketManager.emit("get/MyEvent", { code: 200, data: res }, id);
        }
    })
}

function updateEvent(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent) }, (err, res) => {
        if (err) {
            console.log("error " + err)
            SocketManager.emit("update/event", { code: 500, data: { message: err } }, id);

        } else if (res) {
            console.log("res " + res)
            mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent) },
                {
                    $set: {
                        title: message.data.title,
                        date: message.data.date,
                        description: message.data.description,
                        extension:message.data.extension,
                        uri:message.data.uri, 
                        inviteCode: message.data.inviteCode,
                        status: message.data.status
                    }
                }, (errUpdate, resUpdate) => {
                    if (errUpdate) {
                        console.log("error " + err)
                        SocketManager.emit("update/event", { code: 500, data: { message: errUpdate } }, id);
                    } else {
                        console.log("res update " + resUpdate)
                        SocketManager.emit("update/event", { code: 200, data: resUpdate }, id);
                        SocketManager.broadcast("action",{ code: 200, data: { action: "update/event" } },id)
                    }
                })
        }else {
            SocketManager.emit("update/event", { code: 500, data: "no event found" }, id);
        }
        console.log(message.data.idEvent)

    });
}

function getJoinedEvent(message, id) {
    mongoDB.getEvent().find({ guests: message.auth }).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/joinedEvent", { code: 500, data: { message: err } }, id);
        } else {
            SocketManager.emit("get/joinedEvent", { code: 200, data: res }, id);
        }
    })
}

function deleteEvent(message, id) {
    mongoDB.getEvent().deleteOne(
        { _id: new ObjectID(message.auth) }, (err, res) => {
            if (err) {
                SocketManager.emit("delete/event", { code: 500, data: { message: err } }, id);
            } else {
                SocketManager.emit("delete/event", { code: 200, data: { message: "Event supprimer" } }, id);
            }
        })
}
function joinEvent(message, id) {
    mongoDB.getEvent().findOne({ guests: message.auth }, (errorGuests, resultsGuests) => {
        if (errorGuests) {
            SocketManager.emit("join/event", { code: 500, data: { message: errorGuests } }, id);
        }
        if (resultsGuests) {
            SocketManager.emit("join/event", { code: 403, data: { message: "Event déjà rejoint" } }, id);
        } else {
            mongoDB.getEvent().updateOne({inviteCode: message.data.inviteCode},{$push:{ guests: message.auth}}, (err, res) => {
                if (err){
                    SocketManager.emit("join/event", { code: 500, data: { message: err } }, id);
                } else {
                    SocketManager.emit("join/event", { code: 200, data: { message: "Event Rejoint" } }, id);
                }    
            });
        }
    });
}

function addPost(message, id) {
    mongoDB.getEvent().updateOne(
        { _id: new ObjectID(message.data.idEvent) }, {
            $push: {
                picturesList: {
                    extension:message.data.extension,
                    uri:message.data.uri, 
                    userId: message.auth,
                    firstName: message.data.firstName, 
                    lastName: message.data.lastName, 
                    likeList: [], 
                    commentList: []
                }
            }
        }, (err, res) => {
            if (err) {
                console.log(err + "rr")
                SocketManager.emit("add/post", { code: 500, data: { message: err } }, id);
            } else if (res.modifiedCount == 0){
                console.log(res + "res")
                SocketManager.emit("add/post", { code: 500, data: { message: "Event non trouvé" } }, id);
               
            }else {
                //SocketManager.broadcast("add/post",)
            }
        })
}

function likePost(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.likeList': { idUser: message.auth} }, (errFind, resFind) => {
        if (errFind) {
            SocketManager.emit("like/post", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {
            SocketManager.emit("like/post", { code: 403, data: { message: "Event déjà like" } }, id);
        } else {
            mongoDB.getEvent().updateOne({ _id: new ObjectID(message.auth) }, {
                $push: {
                    'picturesList.likeList': {
                        idUser: message.data.idUser
                    }
                }
            }, (err, res) => {
                if (err) {
                    SocketManager.emit("like/post", { code: 500, data: { message: err } }, id);
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

function action(message, id) {

}

function getPost(message, id) {
    mongoDB.getEvent().find({_id: new ObjectID(message.data.idEvent)}).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/post", { code: 500, data: { message: err } }, id);
        } else {
            SocketManager.emit("get/post", { code: 200, data: res }, id);
        }
    })

}


http.listen(port, host);