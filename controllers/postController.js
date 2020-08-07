const Post = require("../models/postModel");
const User = require("../models/userModel");
const createError = require("http-errors");

const getPosts = async (req, res, next) => {
    const pagination = req.query.pagination
        ? parseInt(req.query.pagination)
        : 10;

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const onlyFriend = req.query.onlyFriend
        ? req.query.onlyFriend == "true"
        : 0;

    let posts;
    let filteredList = [];
    if (onlyFriend) {
        posts = await Post.find({
            userId: { $in: [...req.user.friends, req.user._id] },
        })
            .skip((page - 1) * pagination)
            .limit(pagination)
            .sort({ createdAt: -1 });
    } else {
        posts = await Post.find({})
            .skip((page - 1) * pagination)
            .limit(pagination)
            .sort({ createdAt: -1 });
    }
    posts.forEach((post) => {
        let postF = post.toObject();
        let isRated = false;
        let isLiked = false;
        let userRateNum = 0;
        postF.rate.forEach((rate) => {
            if ((rate.uId == req.user._id.toString())) {
                isRated = true;
                userRateNum = rate.rateNumber;
            }
        });
        postF.likedUsers.forEach((element) => {
            if(element.uId==req.user._id.toString()){
                isLiked = true;
            }
        });
        if (!postF.likedUsers||(postF.likedUsers.length==0)) {
            isLiked = false;
        }
        postF.isRated = isRated;
        postF.userRateNum = userRateNum;
        postF.isLiked = isLiked;
        delete postF.likedUsers;
        delete postF.rate;
        filteredList.push(postF);
    });

    res.status(200).json({
        status: true,
        page: page,
        pagination: pagination,
        onlyFriend,
        length: posts.length,
        posts: filteredList,
    });
};
const addPost = async (req, res, next) => {
    try {
        const body = {
            userId: req.user._id,
            name: req.user.name,
            username: req.user.username,
            title: req.body.title,
            description: req.body.description,
            profileImage: req.user.profileImage,
        };
        if (req.body.image) {
            body.postImage = req.body.image;
        }
        const post = new Post(body);
        //const { error, value } = post.joiValidation(body);

        const newPost = await post.save({ new: true, runValidator: true });
        const result = await User.findOneAndUpdate(
            { _id: post.userId },
            { $push: { createdPost: newPost } }
        );
        if (result) {
            return res.status(200).json({
                status: true,
                post: newPost,
            });
        } else {
            return res.status(404).json({
                status: false,
                message: "Gönderiniz kaydedilirken hata oluştu",
            });
        }
    } catch (err) {
        next(err);
    }
};
const ratePost = async (req, res, next) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });
        if (post) {
            const check = await post.checkDublicateRate(req.user._id);
            if (check) {
                throw createError(
                    400,
                    "Daha önce bu gönderiyi oyladığınız için oyunuz geçersiz sayılmıştır."
                );
            }

            const result = await Post.findOneAndUpdate(
                { _id: req.params.id },
                {
                    $addToSet: {
                        rate: {
                            uId: req.user._id,
                            rateNumber: req.body.rateNumber,
                        },
                    },
                },
                { new: true }
            );
            if (result) {
                const user = await User.updateOne(
                    { _id: req.user._id },
                    {
                        $addToSet: {
                            ratedPost: {
                                postId: post._id,
                                rateNumber: req.body.rateNumber,
                            },
                        },
                    }
                );
                const postO = result.toObject();
                postO.isRated = true;
                postO.userRateNum = req.body.rateNumber;

                postO.likedUsers.forEach((likeds) => {
                    if (likeds._id == req.user._id.toString()) {
                        postO.isLiked = true;
                    } else {
                        postO.isLiked = false;
                    }
                });
                if (!postO.likedUsers || postO.likedUsers.length == 0) {
                    postO.isLiked = false;
                }

                return res.status(200).json({
                    status: true,
                    post: postO,
                    message: "Gönderi oylandı.",
                });
            }
        } else {
            throw createError(404, "Belirtilen Id'li post bulunamamıştır.");
        }
    } catch (err) {
        next(err);
    }
};
const likePost = async (req, res, next) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });

        if (post) {
            const check = await post.checkDublicateLike(req.user._id);
            if (check) {
                throw createError(
                    400,
                    "Daha önce bu gönderiyi beğendiğiniz için oyunuz geçersiz sayılmıştır."
                );
            } else {
                const result = await Post.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        $addToSet: {
                            likedUsers: {
                                uId: req.user._id,
                            },
                        },
                    },
                    { new: true }
                );
                if (result) {
                    const post = result.toObject();
                    post.rate.forEach((rate) => {
                        if ((rate.uId == req.user._id.toString())) {
                            post.isRated = true;
                            post.userRateNum = rate.rateNumber;
                        } else {
                            post.isRated = false;
                            post.userRateNum = 0;
                        }
                    });
                    if (!post.rate || post.rate.length == 0) {
                        post.isRated = false;
                        post.userRateNum = 0;
                    }
                    post.isLiked = true;
                    res.status(200).json({
                        status: true,
                        post: post,
                        message: "Bu gönderi beğenildi.",
                    });
                }
            }
        } else {
            throw createError(404, "Belirtilen Id'li post bulunamamıştır.");
        }
    } catch (err) {
        next(err);
    }
};
const unLikePost = async (req, res, next) => {
    try {
        const post = await Post.findOne({ _id: req.params.id });

        if (post) {
            const check = await post.checkDublicateLike(req.user._id);
            if (check) {
                const result = await Post.findOneAndUpdate(
                    { _id: req.params.id },
                    {
                        $pull: {
                            likedUsers: {
                                uId: req.user._id,
                            },
                        },
                    },
                    { new: true }
                );
                if (result) {
                    const post = result.toObject();
                    post.rate.forEach((rate) => {
                        if ((rate.uId == req.user._id.toString())) {
                            post.isRated = true;
                            post.userRateNum = rate.rateNumber;
                        } else {
                            post.isRated = false;
                            post.userRateNum = 0;
                        }
                    });
                    if (!post.rate || post.rate.length == 0) {
                        post.isRated = false;
                        post.userRateNum = 0;
                    }
                    post.isLiked = false;
                    res.status(200).json({
                        status: true,
                        post: post,
                        message: "Bu gönderi beğenilmedi.",
                    });
                }
            } else {
                throw createError(
                    400,
                    "Daha önce bu gönderide beğeniniz bulunmadığı için işlem yerine getirilemedi."
                );
            }
        } else {
            throw createError(404, "Belirtilen Id'li post bulunamamıştır.");
        }
    } catch (err) {
        next(err);
    }
};
module.exports = {
    addPost,
    ratePost,
    likePost,
    unLikePost,
    getPosts,
};
