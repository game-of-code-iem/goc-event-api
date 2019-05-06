const Dispatcher = require("./Dispatcher")
let io
let sockets = new Map()

function init(http) {
    io = require('socket.io')(http, { origins: '*:*' });
    io.on("connection", socket => {

        //Dico des sockets
        socket.emit("status","200")

        sockets.set(socket.id,socket)

        socket.on("register/user", data => {
            Dispatcher.dispatch("register/user", data)
        })
        
        socket.on("login/user", data => {
            Dispatcher.dispatch("login/user", data)
        })
    
        socket.on("add/event", data => {
            Dispatcher.dispatch("add/event", data)
        })
    
        socket.on("get/event", data => {
            Dispatcher.dispatch("get/event", data)
        })
    
        socket.on("get/MyEvent", data => {
            Dispatcher.dispatch("get/myEvent", data)
        })
    
        socket.on("update/event", data => {
            Dispatcher.dispatch("update/event", data)
        })
    
        socket.on("get/joinedEvent", data => {
            Dispatcher.dispatch("get/joinedEvent", data)
        })
    
        socket.on("delete/event", data => {
            Dispatcher.dispatch("delete/event", data)
        })
        
        socket.on("join/event", data => {
            Dispatcher.dispatch("join/event", data)
        })
    
        socket.on("add/post", data => {
            Dispatcher.dispatch("add/post", data)
        })
    
        socket.on("like/post", data => {
            Dispatcher.dispatch("like/post", data)
        })
        
        socket.on("comment/post", data => {
            Dispatcher.dispatch("comment/post", data)
        })
    
        socket.on("delete/post", data => {
            Dispatcher.dispatch("delete/post", data)
        })
    
        socket.on("unlike/post", data => {
            Dispatcher.dispatch("unlike/post", data)
        })
    
        socket.on("uncomment/post", data => {
            Dispatcher.dispatch("uncomment/post", data)
        })
        
        socket.on("get/post", data => {
            Dispatcher.dispatch("get/post", data)
        })
    
        socket.on("disconnect", reason => {
            socket.close()
            sockets.delete(socket.id)
            console.log("Disconnected: " + reason)
        })
    })
}

function getSocket(id) {
    return sockets.get(id)
}

function broadcast(route,data) {
    io.broadcast(route,data)
}

function emit(route, data, id) {
    let socket = getSocket(id)
    socket.emit(route, data)
}

export default { init, emit, getSocket, broadcast}
