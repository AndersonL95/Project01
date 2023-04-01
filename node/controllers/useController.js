const Users = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const useController ={
    register: async (req, res) => {
        try {
            const {name, email, password} = req.body;

            const user = await Users.findOne({email})
            if(user) return res.status(400).json({message: "Esse email já existe."})
            
            if(password.length < 6)
            return res.status(400).json({message: "Senha tem que possuir mais do que 6 caracteres."})

            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = new Users({
                name, email, password: passwordHash
            });
            await newUser.save();

            const projectToken = createAccessToken({id: newUser._id});
            const refreshToken = createRefreshToken({id: newUser._id});

            res.cookie('refreshToken', refreshToken,{
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*1000
            })

            res.json({projectToken})

        } catch (err) {
            return res.status(500).json({message: err.message});
        }
    },
    login: async (req, res) => {
        try {
            const {email, password} = req.body;
    
            const user = await Users.findOne({email});
            if(!user) return res.status(400).json({message: "Usuario não existe!"});

            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch) return res.status(400).json({message: "Senha incorreta."});

            const projectToken = createAccessToken({id: user._id});
            const refreshToken = createRefreshToken({id: user._id});

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*1000
            })
            res.json({projectToken});
        } catch (err) {
            return res.status(500).json({message: err.message});
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshToken', {path: '/user/refresh_token'});
                return res.json({message: "Logout"});
        } catch(err) {
            return res.status(500).json({message: err.message});
        }
    }
}
const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '11m'})
}
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}
module.exports = useController