const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const createError = require("http-errors");
const mongoose = require("mongoose");
const fs = require("fs");
const Post = require("../models/postModel");

const findUser = async (req, res, next) => {
    const searchedUser = await User.find({
        username: { $regex: req.body.username, $options: "i" },
        function(err, docs) {
            if (err) {
                console.log(err);
            } else {
                console.log(docs);
            }
        },
    });

    res.json({
        status: true,
        length: searchedUser.length,
        users: searchedUser,
    });
};

const currentAccount = async (req, res, next) => {
    const friends = await User.find({ _id: { $in: req.user.friends } });

    let currentFriends = [];

    friends.forEach((user) => {
        const newUser = user.toObject();
        delete newUser.friends;
        delete newUser.createdPost;
        delete newUser.ratedPost;
        delete newUser.password;

        currentFriends.push(newUser);
    });
    res.json({
        status: true,
        user: req.user,
        friends: currentFriends,
    });
};

const loginAccount = async (req, res, next) => {
    try {
        const user = await User.login(req.body.email, req.body.password);
        const token = await user.generateToken();

        res.json({
            status: true,
            token,
        });
    } catch (err) {
        next(err);
    }
};
const addUser = async (req, res, next) => {
    try {
        const user = new User(req.body);
        user.password = await bcrypt.hash(user.password, 10);
        const { error, value } = user.joiValidation(req.body);
        if (error) {
            console.log(error);
            next(error);
        } else {
            const result = await user.save({ new: true, runValidator: true });
            if (result) {
                return res.status(200).json({
                    status: true,
                    user: result,
                });
            }
        }
    } catch (error) {
        next(createError(400, error));
    }
};

const addFriend = async (req, res, next) => {
    delete req.body.createdAt;
    delete req.body.updatedAt;

    try {
        const friend = await User.findById({ _id: req.params.id });
        if (friend) {
            const currentUser = req.user;
            const check = await currentUser.checkFriendDublicate(req.params.id);
            console.log("AddFriend->check:" + check);
            if (check) {
                throw createError(
                    400,
                    "Belirtilen Kullanıcı ile zaten arkadaşsınız"
                );
            } else {
                const user = await User.findOneAndUpdate(
                    { _id: currentUser._id },
                    { $addToSet: { friends: friend } },
                    { runValidator: true }
                );

                if (user) {
                    const friends = await User.find({
                        _id: { $in: req.user.friends },
                    });
    
                    let currentFriends = [];
    
                    friends.forEach((user) => {
                        const newUser = user.toObject();
                        delete newUser.friends;
                        delete newUser.createdPost;
                        delete newUser.ratedPost;
                        delete newUser.password;
    
                        currentFriends.push(newUser);
                    });
                    res.json({
                        status: true,
                        user: user,
                        friends: currentFriends,
                    });
                } else {
                    return res.status(404).json({
                        status: false,
                        message: "Sistemde kayıtlı böyle bir kullanıcı yok",
                    });
                }
            }
        }
    } catch (err) {
        next(err);
    }
};
const deleteFriend = async (req, res, next) => {
    const currentUser = req.user;
    try {
        const checkFriendExists = await currentUser.checkFriendDublicate(
            req.params.id
        );
        const friend = await User.findById({ _id: req.params.id });
        if (friend) {
            if (checkFriendExists) {
                const user = await User.findOneAndUpdate(
                    { _id: currentUser._id },
                    { $pull: { friends: { _id: friend._id } } },
                    { new: true, runValidator: true }
                );

                if (user) {
                    const friends = await User.find({
                        _id: { $in: req.user.friends },
                    });
    
                    let currentFriends = [];
    
                    friends.forEach((user) => {
                        const newUser = user.toObject();
                        delete newUser.friends;
                        delete newUser.createdPost;
                        delete newUser.ratedPost;
                        delete newUser.password;
    
                        currentFriends.push(newUser);
                    });
                    res.json({
                        status: true,
                        user: user,
                        friends: currentFriends,
                    });
                } else {
                    return res.status(404).json({
                        status: false,
                        message: "Sistemde kayıtlı böyle bir kullanıcı yok",
                    });
                }
            }
        } else {
            throw createError(
                404,
                "Belirtilen Id'li kullanıcı sistemde kayıtlı değil"
            );
        }
    } catch (err) {
        next(err);
    }
};
const addProfileImage = async (req, res, next) => {
    try {
        if (!req.body.image) {
            throw createError(400, "Lütfen bir resim dosyası gönderin");
        } else {
            const currentUser = req.user;
            if (currentUser.profileImage) {
                const path = `./profileImage/${currentUser.profileImage}`;
                if (fs.existsSync(path)) {
                    fs.unlinkSync(path);
                }
            }
            const user = await User.findOneAndUpdate(
                {
                    _id: req.user._id,
                },
                {
                    profileImage: req.body.image,
                },
                {
                    new: true,
                }
            );
            const result = await Post.updateMany(
                {
                    userId: user._id,
                },
                {
                    profileImage: user.profileImage,
                }
            );
            console.log(result);
            if (user && result) {
                const friends = await User.find({
                    _id: { $in: req.user.friends },
                });

                let currentFriends = [];

                friends.forEach((user) => {
                    const newUser = user.toObject();
                    delete newUser.friends;
                    delete newUser.createdPost;
                    delete newUser.ratedPost;
                    delete newUser.password;

                    currentFriends.push(newUser);
                });
                res.json({
                    status: true,
                    user: user,
                    friends: currentFriends,
                });
            } else {
                throw createError(
                    500,
                    "Sistem belirtilen kullanıcıyı bulamıyor"
                );
            }
        }
    } catch (err) {
        next(err);
    }
};
module.exports = {
    findUser,
    currentAccount,
    loginAccount,
    addUser,
    addFriend,
    deleteFriend,
    addProfileImage,
};
