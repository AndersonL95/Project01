const Users = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user = require('../model/user');
const {body, validationResult} = require('express-validator')
require('dotenv').config();


const useController ={
    register: async (req, res) => {
        try {
            const {name, email, password} = req.body;
            const {picture} = req.file.path

            const user = await Users.findOne({email})
            if(user) return res.status(400).json({message: "Esse email já existe."})
            
            if(password.length < 6)
            return res.status(400).json({message: "Senha tem que possuir mais do que 6 caracteres."})

            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = new Users({
                name: req.body.name, email: req.body.email, picture: req.file.path, password: passwordHash
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
    },
    UpdateUser: async (req, res) => {
        try {
            const {_id, name, email} = req.body;
            const {picture} = req.file.path
            
            await  Users.findByIdAndUpdate({_id: req.params.id},{
                _id, name, email, picture: req.file.path
            });
           
            
            const processToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET,{
                expiresIn: '7d'
            })

            res.json({processToken, message: "Usuario foi alterado."})

        } catch (err) {
            return res.status(500).json({message: err.message});
        }
    },
    updatePasswordValidation:  [
        body('atual').not().isEmpty().trim().withMessage('Digite a senha atual.'),
        body('newPassword').isLength({min: 6}).withMessage('A senha precisa ter 6 digitos ou mais.')
    ],
    updatePassword: async (req, res) => {
        const { atual, newPassword, _id } = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }else {
            const user = await Users.findOne({_id: req.params.id});
            if(user) {
                const matched = await bcrypt.compare(atual, user.password);
                if(!matched) {
                    return res.status(400).json({errors: [{message: "Digite a senha atual"}]})
                }else {
                    try {
                        const salt = await bcrypt.genSalt(10);
                        const hash = await bcrypt.hash(newPassword, salt);
                        const newUser = await Users.findOneAndUpdate(
                            {_id: user},
                            { password: hash},
                            { new: true}
                        );
                        return res.status(200).json({message: "Senha alterada com sucesso."})
                    }catch (err) {
                        return res.status(500).json({message: err.message});
                    }
                }
            } 
        }
    },

    refreshToken: async (req, res) => {
       try {
        const ref_token = req.cookies.refreshToken;
        if(!ref_token) return res.status(400).json({message: "Efetue o login ou registre-se."});

        jwt.verify(ref_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if(err) return res.status(400).json({message:"Efetue o login ou registre-se."});

            const projectToken = createAccessToken({id: user.id})

            res.json({projectToken});
        })
       } catch (err) {
        return res.status(500).json({message: err.message});
       }
    },
    getUser: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password');
            if(!user) return res.status(400).json({message: "Usuario não existe!"});

            res.json(user)
        } catch (err) {
            return res.status(500).json({message: err.message});
        }
    },
    
}
const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '11m'})
}
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}
module.exports = useController