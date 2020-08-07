const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Joi=require("@hapi/joi");
const createError=require("http-errors");

const PostSchema=new Schema({
    userId:{
        type: Schema.Types.ObjectId,
        ref:'User',
        require:true
    },
    name:{
        type:String,
        require:true,
        minLength:3,
        maxLength:50
    },
    username:{
        type:String,
        require:true,
        minLength:3,
        maxLength:50
    },
    profileImage:{
        type: String,
        require: false,
        trim: true,
    },
    postImage:{
        type: String,
        require: false,
        trim: true,
    },
    title:{
        type:String,
        require:true,
        minLength:2
    },
    description:{
        type:String,
        require:true,
        minlength:20
    },
    rate:[
        {
            uId:{
                type:Schema.Types.ObjectId,
                ref:'User'
            },
            rateNumber:{
                type:Number,
                min:1,
                max:5
            }
        }
    ],
    likedUsers:[
        {
            uId:{
                type:Schema.Types.ObjectId,
                ref:'User'
            }
        }
    ]

},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true},
    timestamps:{ createdAt: 'createdAt' },
    collection:"user_posts"
});

const schema =Joi.object({
    title:Joi.string().min(3),
    description:Joi.string().min(20),
});

PostSchema.virtual('rateAverage').get(function (){
    if(this.rate&&this.rate.length>0){
        let sum = 0;
        this.rate.forEach(element =>{
            sum+=element.rateNumber;
        })
        
        return sum/this.rate.length;
    }
    return 0;
});
PostSchema.virtual('ratedCount').get(function (){
    if(this.rate&&this.rate.length>0){

        return this.rate.length;
    }
    return 0;
});
PostSchema.virtual('likedCount').get(function (){
    if(this.likedUsers&&this.likedUsers.length>0){

        return this.likedUsers.length;
    }
    return 0;
});

PostSchema.methods.joiValidation=(postObject)=>{
    schema.required();
    return schema.validate(postObject);
};
PostSchema.methods.checkDublicateRate=async function (userId){
    const currentPost = this;
    if(currentPost.rate && currentPost.rate.length>0){
        const result=await currentPost.rate.filter(element=>element.uId===userId.toString());
        
        if(result.length){
            return true;
        }

        return false;
    }
    return false;
};
PostSchema.methods.checkDublicateLike=async function (userId){
    const currentPost = this;
    if(currentPost.likedUsers&&currentPost.likedUsers.length>0){
        const result=await currentPost.likedUsers.filter(element=>element._id===userId.toString());
        if(result){
            return true;
        }
        return false;
    }
    return false;
};
PostSchema.methods.toJSON = function () {
    const post = this.toObject();
    delete post.updatedAt;
    delete post.likedUsers;
    delete post.rate;
    delete post.__v;

    return post;
};



const Post=mongoose.model("Post",PostSchema);
module.exports=Post;