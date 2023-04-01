const jwt = require('jsonwebtoken');
require('dotenv').config();


const auth = (req, res, next) => {
    try {
        const token = req.header("Authorization");
        if(!token) return res.status(401).json({message: "Autenticação invalida!"});

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) =>{
            if(err) return res.status(401).json({message: "Autenticação invalida!"});

            req.user = user;
            next();
        })
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
}
module.exports = auth