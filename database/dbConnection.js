const mongoose=require('mongoose');

const dbPath="mongodb://localhost/anket_app";
mongoose.connect(dbPath,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(()=>{
    console.log('Veritabanı bağlantısı sağlandı.');
}).catch((err)=>{
    console.log('Veritabanı bağlantısı sağlanırken hata oluştu. '+err);
});