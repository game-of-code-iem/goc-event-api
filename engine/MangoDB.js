let MongoClient = require("mongodb").MongoClient;
class MongoDBManager {

    constructor(url) {
        MongoClient.connect(url, { useNewUrlParser: true } ,(error,client) => {
            if(error) {
                console.log("ANOMALIE = Error connexion DB")
            }
            this.db = client.db('ptutdb');
        })
    }

    getCollection(name) {
        return this.db.collection(name)
    }

    getEvent() {
        return this.db.collection("event")
    }

    getUser() {
        return this.db.collection("user")
    }


}

module.exports = {MongoDBManager} 

