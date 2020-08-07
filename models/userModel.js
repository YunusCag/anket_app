const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("@hapi/joi");
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserSchema = new Schema(
    {
        name: {
            type: String,
            require: true,
            trim: true,
            minLength: 3,
            maxLength: 50,
        },
        username: {
            type: String,
            require: true,
            lowercase: true,
            unique: true,
            trim: true,
            minLength: 3,
            maxLength: 50,
        },
        email: {
            type: String,
            require: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            require: true,
            minLength: 6,
            trim: true,
        },
        profileImage:{
            type: String,
            require: false,
            trim: true,
            default:'cb0bc4f8-38d8-421b-8b05-b58833fe33a9virus-4999857_1280.png'
        },
        //kullanıcının arkadaşlarının tutulduğu yer
        friends: [
            {
                fid: {
                    type: Schema.Types.ObjectId,
                    ref:'User',
                },
            },
        ],
        //kullanıcın postlarını tutulduğu ter
        createdPost:[
            {
                postId:{
                    type: Schema.Types.ObjectId,
                    ref: 'Post'
                },
            }
        ],
        ratedPost:[
            {
                postId:{
                    type: Schema.Types.ObjectId,
                    ref: 'Post'
                },
                rateNumber:{
                    type:Number,
                    min:1,
                    max:5
                }
            }
        ],
    },
    { collection: "app_users", timestamps: true }
);

const schema = Joi.object({
    name: Joi.string().min(3).max(50).trim(),
    username: Joi.string().min(3).max(50).trim(),
    email: Joi.string().trim().email(),
    password: Joi.string().min(6),
});

UserSchema.methods.joiValidation = (userObject) => {
    schema.required();
    return schema.validate(userObject);
};

UserSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.createdAt;
    delete user.updatedAt;
    delete user.password;
    delete user.__v;

    return user;
};

UserSchema.methods.generateToken = async function () {
    const loginUser = this;
    const token = await jwt.sign(
        {
            _id: loginUser._id,
            isActive: true,
        },
        "secretkey",
        {
            expiresIn: "30d",
        }
    );

    return token;
};
UserSchema.methods.checkFriendDublicate=async function (friendId){
    const currentUser = this;
    if(currentUser.friends && currentUser.friends.length>0){
        const result=currentUser.friends.filter(element=>element._id===friendId.toString());
        if(result){
            return true;
        }
        return false;
    }
    return false;
}
UserSchema.statics.login = async (email, password) => {
    const { error, value } = schema.validate({ email, password });

    if (error) {
        throw createError(400, error);
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw createError(400, "Wrong email/password");
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
        throw createError(400, "Wrong email/password");
    }
    return user;
};

UserSchema.statics.joiValidationForUpdate = (userObject) => {
    return schema.validate(userObject);
};
const User = mongoose.model("User", UserSchema);

module.exports = User;
