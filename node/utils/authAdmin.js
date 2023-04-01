const Users = require('../model/user');

const authAdmin = async (req, res, next) => {
    try {
        const user = await Users.findOne({
            _id: req.user.id
        })
        if(user.cargo === 0)return res.status(401).json({message: "Acesso negado! Recursos de administração."});
        
        next();
    } catch (err) {
        return res.status(500).json({message: err.message});
    }
}
module.exports = authAdmin



