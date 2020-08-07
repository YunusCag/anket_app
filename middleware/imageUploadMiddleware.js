const multer = require("multer");
const path = require("path");
const Jimp = require("jimp");
const { v4: uuidv4 } = require('uuid');
const storage =multer.diskStorage({
    destination:function (req,file,cb) {
        cb(null,"./uploadedImages/");
    },
    filename:function(req,file,cb) {
        cb(null,uuidv4()+file.originalname);

    }
});

const fileFilter = (req, file, cb) => {
    //reject a file
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb("Please upload only images.", false);
    }
};

const upload = multer({
    storage: storage,
    // limits:{
    //     fileSize:1024*1024*5
    // },
    fileFilter: fileFilter,
});

const resizeImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }
    const filePath =req.file.path;

    const image = await Jimp.read(filePath);
    await image.quality(50);
    await image.resize(900,600);
    await image.writeAsync(filePath);
    req.body.image =req.file.filename;
    next();
};
module.exports = {
    upload,
    resizeImage,
};
