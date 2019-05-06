class Dispatcher {

    constructor() {
        this.dispatcher = new Map()
    }
    
    add(key,call) {
        
        this.dispatcher.set(key,call)
    }

    clear() {
        this.dispatcher = new Map()
    }

    dispatch(key,data,id) {
        this.dispatcher.get(key)(data,id)
    }
}


module.exports = {Dispatcher} 