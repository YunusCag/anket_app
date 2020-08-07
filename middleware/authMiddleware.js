const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const createError = require("http-errors");

const auth = async (req, res, next) => {
    try {
        if (req.header("Authorization")) {
            const token = req.header("Authorization").trim();
            const result = await jwt.verify(token, "secretkey");
            const user = await User.findById({ _id: result._id });
            if (user) {
                req.user = user;
            } else {
                throw createError(404, "Kullanıcı bulunamadı.");
            }

            next();
        } else {
            throw createError("Lütfen giriş yapın.");
        }
    } catch (err) {
        next(err);
    }
};
module.exports = auth;
