const Users = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const user = require('../model/user');
const PasswordReset = require('../model/PasswordReset');
const UserVerification = require('../model/userVerification');
const {body, validationResult} = require('express-validator');
const {v4: uuidv4} = require('uuid');
const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = nodemailer.createTransport({
    service: 'outlook',
    port: 587,
    secure: false,
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    },
})
transporter.verify((error, success) =>{
    if(error) {
        console.log(error);
    }else {
        console.log("Pronto para mensagens.");
        console.log(success);
    }
})
const sendVerificationEmail = ({id, email}, res) => {
    const url = "http://localhost:5000/";
    const uniqueString = uuidv4() + id;
    
    const emailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verifique o seu email!",
        html: `<p>Verifique o seu email para completar o login na sua conta.</p>
            <p><b>O link expira em 6 horas.</b></p>
            <p>Pressione <a href=${url + "user/verify/" + id + "/" + uniqueString}>Aqui</a> para continuar.</p>
        `
    };
    const salt = 10;
    bcrypt.hash(uniqueString, salt)
        .then((hashedUniqueString) => {
            const newVerification = UserVerification({
                _id: id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiresAt: Date.now() + 2160000,
            });
            newVerification.save()
                .then(() => {
                    transporter.sendMail(emailOptions)
                        .then(() => {
                            res.status(200).json({message: "Email de verificação foi enviado."})

                        })
                        .catch((error) => {
                            console.log(error);
                            res.status(400).json({message: "Verificação de e-mail falida."})

                        })
                })
                .catch((error) => {
                    console.log(error);
                    res.status(400).json({message: "Erro ao salvar verificação de e-mail."})

                })
        })
        .catch((error) => {
            console.log(error)
            res.status(400).json({message: "Um erro ocorreu quando executado o hash do e-mail."})
        })
};
const path = require('path');

const useController ={
    register: async (req, res) => {
        try {
            const {name, email, password, verified} = req.body;
            const {picture} = req.file.path

            const user = await Users.findOne({email})
            if(user) return res.status(400).json({message: "Esse email já existe."})
            
            if(password.length < 6)
            return res.status(400).json({message: "Senha tem que possuir mais do que 6 caracteres."})

            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = new Users({
                name: req.body.name, email: req.body.email, picture: req.file.path,verified: false, password: passwordHash
            });
            await newUser.save()
                .then((result) =>{
                    sendVerificationEmail(result, res);
                })

            const projectToken = createAccessToken({id: newUser._id});
            const refreshToken = createRefreshToken({id: newUser._id});

            res.cookie('refreshToken', refreshToken,{
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*1000
            })

            //res.json({projectToken})

        } catch (err) {
            return res.status(500).json({message: err.message});
        }
    },
    userVerify : async (req, res) =>{
        let {_id, uniqueString} = req.params;

        UserVerification
        .find({_id})
        .then((result) => {
            if(result.length > 0) {
                const {expiresAt} = result[0];
                const hashedUniqueString = result[0].uniqueString;

                if(expiresAt < Date.now()) {
                    UserVerification.deleteOne({_id})
                        .then(result =>{
                            Users.deleteOne({id:_id})
                                .then(() => {
                                    let message = "Link expirado, por favor registre-se novamente.";
                                    res.redirect(`/user/verified/?error=true&message=${message}`);
                                })
                                .catch(error => {
                                    console.log(error);
                                    let message = "Falha na limpeza do usuario com string exclusiva expirada";
                                    res.redirect(`/user/verified/?error=true&message=${message}`);
                                })
                        })
                        .catch((error) =>{
                            console.log(error);
                            let message = "Ocorreu um erro ao limpar o registro de verificação do usuario expirado."
                            res.redirect(`/user/verified/?error=true&message=${message}`);
                        })
                }  else {
                    bcrypt.compare(uniqueString, hashedUniqueString)
                        .then(result => {
                            if(result ) {
                                Users.updateOne({id: _id}, {verified: true})
                                    .then(() => {
                                        UserVerification.deleteOne({_id})
                                            .then(() =>{
                                                res.sendFile(path.join(__dirname, "../views/verified.html"));
                                            })
                                            .catch(error => {
                                                console.log(error)
                                                let message = "Ocorreu um erro ao finalizar a verificação vem-sucedida";
                                                res.redirect(`/user/verified/?error=true&message=${message}`);
                                            }) 
                                    })
                                    .catch(error => {
                                        console.log(error)
                                        let message = "Ocorreu um erro ao modificar o registro do usuario para exibir verificado.";
                                        res.redirect(`/user/verified/?error=true&message=${message}`);
                                    })
                            } else {
                                let message = "Detalhes de verificação invalidos passados. Verifique a sua caixa de entrada";
                                res.redirect(`/user/verified/?error=true&message=${message}`);
                            }
                        })
                        .catch(error => {
                            console.log(error);
                            let message = "Um erro ocorreu ao comparar strings unicas.";
                            res.redirect(`/user/verified/?error=true&message=${message}`);
                        })
                }
            } else {
                let message = "O registro da conta não existe ou já foi verificado. Por favor, registre-se ou faça login."
                res.redirect(`/user/verified/?error=true&message=${message}`);
            }
        })
        .catch((error) => {
            console.log(error);
            let message = "Um erro ocorreu enquanto era checado a existencia da verificação do usuario."
            res.redirect(`/user/verified/?error=true&message=${message}`);
        })
    },
    userVerified: async (req, res) => {
        res.sendFile(path.join(__dirname, "../views/verified.html"));
    },
    login: async (req, res) => {
        try {
            const {email, password} = req.body;
    
       const user = await  Users.find({email})
             .then((data) => {
                     
                if(data.length) {
                    if(!data[0].verified) {
                        return res.status(400).json({message: "O e-mail ainda não foi verificado. Verifique sua caixa de entrada."})
                    } else {
                        const isMatch =  bcrypt.compare(password, data[0].password);
                        if(!isMatch) return res.status(400).json({message: "Senha incorreta."});
        
                        const projectToken = createAccessToken({id: data[0]._id});
                        const refreshToken = createRefreshToken({id: data[0]._id});
        
                        res.cookie('refreshToken', refreshToken, {
                            httpOnly: true,
                            path: '/user/refresh_token',
                            maxAge: 7*24*60*1000
                        })
                        res.json({projectToken});
                    }
                }
                    
             })
             if(!user) return res.status(400).json({message: "Usuario não existe!"});
     
        } catch (err) {
            console.log(err);
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
    requestPasswordReset: async (req, res) => {
        try {
            const {email, redirectUrl} = req.body;
            Users.find({email})
                .then((data) => {
                    if(data.length) {
                        if(!data[0]){
                            res.status(400).json({message: "O e-mail ainda não foi verificado. Verifique sua caixa de entrada."})
                        }else {
                            sendResetEmail(data[0], redirectUrl, res);
                        }
                    }else {
                        res.status(400).json({message: "Não existe nenhuma conta com o e-mail fornecido."})
                    }
                })
                .catch(error => {
                    console.log(error);
                    res.status(400).json({message: "Ocorreu um erro ao verificar o usuario existente."})
                })
        } catch(err) {
            return res.status(500).json({message: err.message});
        }
    },
    PasswordReset: async (req, res) => {
        const {_id, resetString, newPassword} = req.body;

        PasswordReset.find({_id})
            .then(result =>{
                if(result.length > 0){
                    const {expiresAt} = result[0];
                    const hashedResetString = result[0].resetString;

                    if(expiresAt < Date.now()){
                        PasswordReset
                        .deleteOne({_id})
                        .then(() =>{
                            res.status().json({message: "Link de redefinição de senha expirou."})
                        })
                        .catch(error => {
                            console.log(error)
                            res.status(400).json({message: "Falha na limpeza do registro de redefinição de senha."})
                        })
                    }else {
                        bcrypt.compare(resetString, hashedResetString)
                            .then((result) =>{
                                if(result){
                                    const salt = 10;
                                    bcrypt.hash(newPassword, salt)
                                        .then(hashedNewPassword =>{
                                            Users
                                            .updateOne({id: _id},{password: hashedNewPassword})
                                            .then(() =>{
                                                PasswordReset.deleteOne({_id})
                                                    .then(() =>{
                                                        res.status(200).json({message: "Update de senha foi um sucesso."})
                                                    })
                                                    .catch(error =>{
                                                        console.log(error);
                                                        res.status(400).json({message: "Um erro ocorreu enquanto finalizava a redefinição de senha."})
                                                    })
                                            })
                                            .catch(error =>{
                                                console.log(error);
                                                res.status(400).json({message: "Update de senha falido."})
                                            })
                                        })
                                        .catch(error =>{
                                            console.log(error);
                                            res.status(400).json({message: "Ocorreu um erro durante o hash da nova senha."})
                                        })
                                }else {
                                    res.status(400).json({message: "Detalhes de redefinição de senha passados são invalidos."})
                                 }
                            })
                            .catch(error =>{
                                console.log(error);
                                res.status(400).json({message: "A comparação das strings de redefinição de senha falhou."})
                            })
                    }
                }else{
                    res.status(400).json({message: "Requisição de redefinição de senha não encontrada."})
                }
            })
            .catch(error => {
                console.log(error);
                res.status(400).json({message: "A verificação de registro de redefinição de senha existente falhou."})
            })
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
        console.log(err);
        return res.status(500).json({message: err.message});
       }
    },
    getUser: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password');
            if(!user) return res.status(400).json({message: "Usuario não existe!"});

            res.json(user)
        } catch (err) {
            console.log(err);
            return res.status(500).json({message: err.message});
        }
    },

    
}
const sendResetEmail = ({id, email}, redirectUrl, res) =>{
    const resetString = uuidv4() + id;

    PasswordReset
        .deleteMany({_id: id})
        .then(result => {

            const mailOptions = {
                from: process.env.AUTH_EMAIL,
                to: email,
                subject: "Esqueci a minha senha.",
                html:`<p>Soubemos que você perdeu sua senha.</p> <p>Não se preocupe, nós temos o link para você poder resetá-la.</p>
                <b>O link expira em 60 minutos</b>.</p><p>Pressione <a href=${redirectUrl + "/" + id + "/" + resetString}>aqui</a>
                para continuar.</p>`,
            }
            const salt = 10;
            bcrypt
                .hash(resetString, salt)
                .then(hashedResetString => {
                    const newPasswordReset = new PasswordReset({
                        _id: id,
                        resetString: hashedResetString,
                        createAt: Date.now(),
                        expiresAt: Date.now() + 3600000
                    });
                    newPasswordReset
                        .save()
                        .then(() =>{
                            transporter.sendMail(mailOptions)
                                .then(() =>{
                                    res.status(200).json({message: "E-mail de redefinição de senha enviado."})
                                })
                                .catch(error =>{
                                    console.log(error);
                                    res.status(400).json({message: "Redefinição de senha falida."})
                                })
                        })
                        .catch(error =>{
                            console.log(error);
                            res.status(400).json({message: "Não foi possivel salvar os dados de redefinição de senha."})
                        })
                })
                .catch(error =>{
                    console.log(error);
                    res.status(400).json({message: "Um erro ocorreu enquanto a senha era resetada."});
                })
        })
        .catch(error =>{
            console.log(error);
            res.status(400).json({message: "A limpeza dos registros de redefinição de senhas existentes falhou."});
        })
}

const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '11m'});
}
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});
}
module.exports = useController