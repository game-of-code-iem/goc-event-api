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
dispatcher.add("get/users", getUsers)
dispatcher.add("action", action)
dispatcher.add("like/comment", likeComment)
dispatcher.add("unlike/comment", unlikeComment)
dispatcher.add("delete/comment", deleteComment)




SocketManager.init(dispatcher, http)

function registerUser(message, id) {
    let uniqueMailAdressQuery = { mail: message.data.mail }
    mongoDB.getUser().findOne(uniqueMailAdressQuery, (error, results) => {
        if (error) {
            SocketManager.emit("register/user", { code: 500, data: { message: error } }, id)
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
                                message: error
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

function loginUser(message, id) {
    mongoDB.getUser().findOne({ mail: message.data.mail }, (err, result) => {
        if (result) {
            bcrypt.compare(message.data.password, result.password).then(res => {
                if (res) {
                    SocketManager.emit("login/user", {
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
                    SocketManager.emit("login/user", { code: 403, data: { message: "Mot de passe incorrecte" } }, id);
                }
            })
        } else {
            SocketManager.emit("login/user", { code: 403, data: { message: "Adresse mail inconnue" } }, id);
        }
    });

}

function addEvent(message, id) {
    mongoDB.getEvent().findOne({ inviteCode: message.data.inviteCode }, (errorInvCode, resultsInvCode) => {
        if (errorInvCode) {
            SocketManager.emit("add/event", { code: 500, data: { message: errorInvCode } }, id);
        } else if (resultsInvCode) {
            SocketManager.emit("add/event", { code: 403, data: { message: "Code d'invitation non unique" } }, id);
        } else {
            let objNew = {
                title: message.data.title,
                date: message.data.date,
                description: message.data.description,
                extension: message.data.extension,
                uri: message.data.uri,
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
                    SocketManager.broadcast("action", { code: 200, data: { action: "add/event" } }, id)
                }
            });
        }
    });
}

function getEvent(message, id) {
    mongoDB.getEvent().find({ $or: [{ admin: message.auth }, { 'guests.id': new ObjectID(message.auth) }] }).toArray((err, res) => {
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
                        extension: message.data.extension,
                        uri: message.data.uri,
                        inviteCode: message.data.inviteCode,
                        status: message.data.status
                    }
                }, (errUpdate, resUpdate) => {
                    if (errUpdate) {
                        console.log("error " + err)
                        SocketManager.emit("update/event", { code: 500, data: { message: errUpdate } }, id);
                    } else {
                        //console.log("res update " + resUpdate)
                        SocketManager.emit("update/event", { code: 200, data: resUpdate }, id);
                        SocketManager.broadcast("action", { code: 200, data: { action: "update/event" } }, id)
                    }
                })
        } else {
            SocketManager.emit("update/event", { code: 500, data: "no event found" }, id);
        }
        //console.log(message.data.idEvent)

    });
}

function getJoinedEvent(message, id) {
    mongoDB.getEvent().find({ 'guests.id': new ObjectID(message.auth) }).toArray((err, res) => {
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
                SocketManager.broadcast("action", { code: 200, data: { action: "delete/event" } }, id)

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
            mongoDB.getEvent().updateOne({ inviteCode: message.data.inviteCode }, {
                $push: {
                    guests: {
                        id: new ObjectID(message.auth),
                        firstName: message.data.firstName,
                        lastName: message.data.lastName,
                        mail: message.data.mail
                    }
                }
            }, (err, res) => {
                if (err) {
                    SocketManager.emit("join/event", { code: 500, data: { message: err } }, id);
                } else {
                    SocketManager.emit("join/event", { code: 200, data: { message: "Event Rejoint" } }, id);
                    SocketManager.broadcast("action", { code: 200, data: { action: "join/event" } }, id)

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
                    id: new ObjectID(),
                    extension: message.data.extension,
                    uri: message.data.uri,
                    userId: message.auth,
                    firstName: message.data.firstName,
                    lastName: message.data.lastName,
                    likeList: [],
                    commentList: []
                }
            }
        }, (err, res) => {
            if (err) {
                //console.log(err + "rr")
                SocketManager.emit("add/post", { code: 500, data: { message: err } }, id);
            } else if (res.modifiedCount == 0) {
                //console.log(res + "res")
                SocketManager.emit("add/post", { code: 500, data: { message: "Event non trouvé" } }, id);

            } else {
                //broadwast photo
                SocketManager.emit("add/post", { code: 200, data: { message: "Event ajouté" } }, id);
                SocketManager.broadcast("action", { code: 200, data: { action: "add/post" } }, id)


            }
        })
}

function likePost(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFind, resFind) => {

        if (errFind) {
            SocketManager.emit("like/post", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {

            mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.likeList.idUser': new ObjectID(message.auth) }, (errFindLike, resFindLike) => {

                if (errFindLike) {
                    SocketManager.emit("like/post", { code: 500, data: { message: errFind } }, id);
                } else if (resFindLike) {
                    SocketManager.emit("like/post", { code: 403, data: { message: "Event déjà like" } }, id);
                } else {
                    mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, {
                        $push: {
                            'picturesList.$.likeList': {
                                idUser: new ObjectID(message.auth)
                            }
                        }
                    }, (err, res) => {
                        if (err) {
                            SocketManager.emit("like/post", { code: 500, data: { message: err } }, id);
                        } else {
                            //todo broadcast
                            SocketManager.emit("like/post", { code: 200, data: { message: "photo like" } }, id);
                            SocketManager.broadcast("action", { code: 200, data: { action: "like/post" } }, id)

                        }
                    })
                }
            })
        } else {
            SocketManager.emit("like/post", { code: 403, data: { message: "Photo non trouvé" } }, id);
        }
    })
}

function commentPost(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFind, resFind) => {

        if (errFind) {
            SocketManager.emit("coment/post", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {
            mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, {
                $push: {
                    'picturesList.$.commentList': {
                        id: new ObjectID(),
                        idUser: new ObjectID(message.auth),
                        date: message.data.date,
                        text: message.data.text,
                        firstName: message.data.firstName,
                        lastName: message.data.lastName,
                        mail: message.data.mail,
                        likeList: []
                    }
                }
            }, (err, res) => {
                if (err) {
                    SocketManager.emit("comment/post", { code: 500, data: { message: err } }, id);
                } else {
                    //todo broadcast
                    SocketManager.emit("comment/post", { code: 200, data: { message: "photo commenté" } }, id);
                    SocketManager.broadcast("action", { code: 200, data: { action: "comment/post" } }, id)

                }
            })
        } else {
            SocketManager.emit("comment/post", { code: 403, data: { message: "Photo non trouvé" } }, id);

        }
    })
}


function deletePost(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFind, resFind) => {

        if (errFind) {
            SocketManager.emit("delete/post", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {

            mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFindLike, resFindLike) => {

                if (errFindLike) {
                    SocketManager.emit("delete/post", { code: 500, data: { message: errFind } }, id);
                } else if (resFindLike) {
                    mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, {
                        $pull: {
                            picturesList: {
                                id: new ObjectID(message.data.idPicture)
                            }
                        }
                    }, (err, res) => {
                        if (err) {
                            SocketManager.emit("delete/post", { code: 500, data: { message: err } }, id);
                        } else {
                            SocketManager.emit("delete/post", { code: 200, data: { message: "photo supprimer" } }, id);
                            SocketManager.broadcast("action", { code: 200, data: { action: "delete/post" } }, id)
                        }
                    })
                } else {
                    SocketManager.emit("delete/post", { code: 403, data: { message: "Impossible de supprimer la photo" } }, id);
                }
            })
        } else {
            SocketManager.emit("delete/post", { code: 403, data: { message: "Photo non trouvé" } }, id);
        }
    })
}

function unlikePost(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFind, resFind) => {

        if (errFind) {
            SocketManager.emit("unlike/post", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {

            mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.likeList.idUser': new ObjectID(message.auth) }, (errFindLike, resFindLike) => {

                if (errFindLike) {
                    SocketManager.emit("unlike/post", { code: 500, data: { message: errFind } }, id);
                } else if (resFindLike) {
                    mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, {
                        $pull: {
                            'picturesList.$.likeList': {
                                idUser: new ObjectID(message.auth)
                            }
                        }
                    }, (err, res) => {
                        if (err) {
                            SocketManager.emit("unlike/post", { code: 500, data: { message: err } }, id);
                        } else {
                            SocketManager.emit("unlike/post", { code: 200, data: { message: "photo unlike" } }, id);
                            SocketManager.broadcast("action", { code: 200, data: { action: "unlike/post" } }, id)
                        }
                    })
                } else {
                    SocketManager.emit("unlike/post", { code: 403, data: { message: "Impossible d'unlike la photo" } }, id);
                }
            })
        } else {
            SocketManager.emit("unlike/post", { code: 403, data: { message: "Photo non trouvé" } }, id);
        }
    })
}

function unCommentPost(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFind, resFind) => {

        if (errFind) {
            SocketManager.emit("uncomment/post", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {

            mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.commentList.id': new ObjectID(message.data.idComment) }, (errFindLike, resFindLike) => {

                if (errFindLike) {
                    SocketManager.emit("uncomment/post", { code: 500, data: { message: errFind } }, id);
                } else if (resFindLike) {
                    mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.commentList.id': new ObjectID(message.data.idComment) }, {
                        $pull: {
                            'picturesList.$.commentList': {
                                id: new ObjectID(message.data.idComment)
                            }
                        }
                    }, (err, res) => {
                        if (err) {
                            SocketManager.emit("uncomment/post", { code: 500, data: { message: err } }, id);
                        } else {
                            SocketManager.emit("uncomment/post", { code: 200, data: { message: "commentaire supprimer" } }, id);
                            SocketManager.broadcast("action", { code: 200, data: { action: "uncomment/post" } }, id)
                        }
                    })
                } else {
                    SocketManager.emit("uncomment/post", { code: 403, data: { message: "Impossible de supprimer le commentaire" } }, id);
                }
            })
        } else {
            SocketManager.emit("like/post", { code: 403, data: { message: "Photo non trouvé" } }, id);
        }
    })
}

function action(message, id) {

}

//renvoie la liste des images d'un event
function getPost(message, id) {
    mongoDB.getEvent().find({ _id: new ObjectID(message.data.idEvent) }).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/post", { code: 500, data: { message: err } }, id);
        } else {
            SocketManager.emit("get/post", { code: 200, data: res[0].picturesList }, id);
        }
    })

}

//renvoie la liste users
function getUsers(message, id) {
    mongoDB.getUser().find({}).project({ _id: 1, firstName: 1, lastName: 1, mail: 1 }).toArray((err, res) => {
        if (err) {
            SocketManager.emit("get/users", { code: 500, data: { message: err } }, id);
        } else {
            SocketManager.emit("get/users", { code: 200, data: res }, id);
        }
    })

}
//todo
function likeComment(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFind, resFind) => {

        if (errFind) {
            SocketManager.emit("like/comment", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {

            mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.commentList.id': new ObjectID(message.data.idComment) }, (errFindLike, resFindLike) => {

                if (errFindLike) {
                    SocketManager.emit("like/comment", { code: 500, data: { message: errFind } }, id);
                } else if (resFindLike) {

                    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.commentList.id': new ObjectID(message.data.idComment), 'picturesList.commentList.likeList.idUser': new ObjectID(message.auth) }, (errFindLike, resFindLike) => {

                        if (errFindLike) {
                            SocketManager.emit("like/comment", { code: 500, data: { message: errFind } }, id);
                        } else if (resFindLike) {
                            SocketManager.emit("like/comment", { code: 403, data: { message: "Commentaire déjà like" } }, id);
                        } else {
                            mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.commentList.id': new ObjectID(message.data.idComment) }, {
                                $push: {
                                    'picturesList.$.commentList.0.likeList': {
                                        idUser: new ObjectID(message.auth)
                                    }
                                }
                            }, (err, res) => {
                                if (err) {
                                    SocketManager.emit("like/comment", { code: 500, data: { message: err } }, id);
                                } else {
                                    //todo broadcast
                                    SocketManager.emit("like/comment", { code: 200, data: { message: "commentaire like" } }, id);
                                    SocketManager.broadcast("action", { code: 200, data: { action: "like/comment" } }, id)

                                }
                            })
                        }
                    })


                } else {
                    SocketManager.emit("like/comment", { code: 403, data: { message: "Commentaire non trouvé" } }, id);
                }

            })
        } else {
            SocketManager.emit("like/comment", { code: 403, data: { message: "Photo non trouvé" } }, id);
        }
    })
}
function unlikeComment(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFind, resFind) => {

        if (errFind) {
            SocketManager.emit("unlike/comment", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {

            mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.commentList.id': new ObjectID(message.data.idComment) }, (errFindLike, resFindLike) => {

                if (errFindLike) {
                    SocketManager.emit("unlike/comment", { code: 500, data: { message: errFind } }, id);
                } else if (resFindLike) {

                    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.commentList.id': new ObjectID(message.data.idComment), 'picturesList.commentList.likeList.idUser': new ObjectID(message.auth) }, (errFindLike, resFindLike) => {

                        if (errFindLike) {
                            SocketManager.emit("unlike/comment", { code: 500, data: { message: errFind } }, id);
                        } else if (resFindLike) {
                            mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture), 'picturesList.commentList.id': new ObjectID(message.data.idComment) }, {
                                $pull: {
                                    'picturesList.$.commentList.0.likeList': {
                                        idUser: new ObjectID(message.auth)
                                    }
                                }
                            }, (err, res) => {
                                if (err) {
                                    SocketManager.emit("like/comment", { code: 500, data: { message: err } }, id);
                                } else {
                                    //todo broadcast
                                    SocketManager.emit("like/comment", { code: 200, data: { message: "commentaire unlike" } }, id);
                                    SocketManager.broadcast("action", { code: 200, data: { action: "unlike/comment" } }, id)
                                }
                            })
                        } else {
                            SocketManager.emit("unlike/comment", { code: 403, data: { message: "Utilisateur introuvable" } }, id);
                        }
                    })
                } else {
                    SocketManager.emit("unlike/comment", { code: 403, data: { message: "Commentaire introuvable" } }, id);
                }
            })
        }else {
            SocketManager.emit("unlike/comment", { code: 403, data: { message: "Photo non trouvé" } }, id);
        }
    })
}

function deleteComment(message, id) {
    mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, (errFind, resFind) => {

        if (errFind) {
            SocketManager.emit("delete/comment", { code: 500, data: { message: errFind } }, id);
        } else if (resFind) {

            mongoDB.getEvent().findOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture),'picturesList.commentList.id': new ObjectID(message.data.idComment) }, (errFindLike, resFindLike) => {

                if (errFindLike) {
                    SocketManager.emit("delete/comment", { code: 500, data: { message: errFind } }, id);
                } else if (resFindLike) {
                    mongoDB.getEvent().updateOne({ _id: new ObjectID(message.data.idEvent), 'picturesList.id': new ObjectID(message.data.idPicture) }, {
                        $pull: {
                            'picturesList.$.commentList': {
                                id: new ObjectID(message.data.idComment)
                            }
                        }
                    }, (err, res) => {
                        if (err) {
                            SocketManager.emit("delete/comment", { code: 500, data: { message: err } }, id);
                        } else {
                            SocketManager.emit("delete/comment", { code: 200, data: { message: "Commentaire supprimer" } }, id);
                            SocketManager.broadcast("action", { code: 200, data: { action: "delete/comment" } }, id)
                        }
                    })
                } else {
                    SocketManager.emit("delete/comment", { code: 403, data: { message: "Commentaire introuvable" } }, id);
                }
            })
        } else {
            SocketManager.emit("delete/comment", { code: 403, data: { message: "Photo non trouvé" } }, id);
        }
    })
}


http.listen(port, host);