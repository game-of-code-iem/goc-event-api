let io
let sockets = new Map()
let Dispatcher

function init(dispatcher, http) {
    Dispatcher = dispatcher
    io = require('socket.io')(http, { origins: '*:*' });
    io.on("connection", socket => {

        //socket.emit("status", 202)
        sockets.set(socket.id, socket)

        socket.on("register/user", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("register/user", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("login/user", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("login/user", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("add/event", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("add/event", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("get/event", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("get/event", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("get/MyEvent", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("get/myEvent", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("update/event", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("update/event", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("get/joinedEvent", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("get/joinedEvent", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("delete/event", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("delete/event", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("join/event", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("join/event", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("add/post", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("add/post", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("like/post", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("like/post", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("comment/post", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("comment/post", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("delete/post", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("delete/post", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("unlike/post", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("unlike/post", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("uncomment/post", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("uncomment/post", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("get/post", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("get/post", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("get/users", data => {
            try {
                let message = JSON.parse(data)
                Dispatcher.dispatch("get/users", message, socket.id)
            } catch (error) {
                console.log("Anomalie: Invalid JSON PARSING" + error)
            }
        })

        socket.on("disconnect", reason => {
            console.log(reason)
            sockets.delete(socket.id)
            console.log("Disconnected: " + reason)
        })
    })
}

function getSocket(id) {
    return sockets.get(id)
}

function broadcast(route, data, id) {
    console.log(data)
    try {
        let socket = getSocket(id)
        socket.broadcast.emit(route, JSON.stringify(data))
        socket.emit(route, JSON.stringify(data))
    } catch (error) {
        console.log("Anomalie: Invalid JSON PARSING" + error)
    }
}

function emit(route, data, id) {
    console.log(data)
    try {
        let socket = getSocket(id)
        socket.emit(route, JSON.stringify(data))
    } catch (error) {
        console.log("Anomalie: Invalid JSON PARSING" + error)
    }

}

module.exports = { init, emit, getSocket, broadcast }
