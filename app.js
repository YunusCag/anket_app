const express = require("express");
const morgan= require("morgan");
require("./database/dbConnection.js");
const errorMiddleware = require("./middleware/errorMiddleware");
const userRouter = require("./routers/userRouter.js");
const postRouter = require("./routers/postRouter");
const bodyParser = require('body-parser');
const app = express();


if(process.env.NODE_ENV==='development'){
  app.use(morgan('dev'));
}
app.use(bodyParser.json());
app.use('/uploadedImages',express.static('uploadedImages'));
app.use(bodyParser.urlencoded({extended:true}));

app.use((req, res, next) =>{
  req.requestTime=new Date().toISOString();
  next();
});

app.use("/api/users", userRouter);
app.use("/api/posts",postRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Anket uygulamasına hoşgeldiniz.",
  });
});

app.use(errorMiddleware);

module.exports=app;
