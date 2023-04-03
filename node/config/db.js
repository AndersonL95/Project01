const mongoose = require('mongoose')
require('dotenv').config()

const options = {
    autoIndex: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family:4
}

module.exports = connect = async () =>{
    const URI = process.env.MONGODB_URL;
    await mongoose.connect(URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, err =>{
        if(err) throw err
        console.log('Conectado ao MongoDB!')
    })

    
    
}