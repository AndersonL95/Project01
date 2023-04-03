const multer = require('multer');

var storage = multer.diskStorage({
    filename: function(req, file, cb) {
        let name = Date.now()+"-"+file.originalname;
        cb(null, name);
    },
    destination: function(req, file, cb) {
        let path = "./picture/users";
        cb(null, path);
    }
})
var upload = multer({storage});

module.exports = upload;