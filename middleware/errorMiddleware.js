const errorCatcher =(err,req,res,next) => {
    res.status(err.status||500);
    if(err.code===11000){
        return res.json({
            status:false,
            message:"'"+Object.keys(err.keyValue)+"' için girilen "+Object.keys(err.keyValue)+"' unique olmalıdır.",
            statusCode:err.statusCode||400
        });
    }
    if(err.code===66){
        return res.json({
            status:false,
            message:"Değiştirilemez alanı güncellemeye çalıştınız.",
            statusCode:err.statusCode||400
        });
    }

    res.json({
        status:false,
        message:err.message,
        statusCode:err.statusCode||500
    })
}
module.exports=errorCatcher;