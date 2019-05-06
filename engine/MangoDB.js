
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

}

module.exports = {MongoDBManager} 

