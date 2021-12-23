const express = require('express');
const hbs = require('hbs')

const session = require('express-session');
var app = express()
app.use(session({
    resave: true, 
    saveUninitialized: true, 
    secret: 'abcc##$$0911233$%%%32222', 
    cookie: { maxAge: 24 * 60 * 60 * 1000}
}));

app.set('view engine', 'hbs')

const multer = require('multer');
const fs = require('fs-extra');

const bodyParser = require('body-parser')

//lưu trữ file khi đã upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //file sau khi upload xong sẽ nằm trong "uploads"
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        //tạo tên file = time hiện tại
        cb(null, file.fieldname + '-' + Date.now())
    }
})
    
//khởi tạo middleware với câu hình trên, lưu trên local của server khi dùng multer
const upload = multer({ storage: storage })
app.use(bodyParser.urlencoded({extended: false}))

app.use(express.static('public'))
app.use(express.static('uploads'))

app.get('/', (req, res) =>{
    if(req.session.username == null){
        res.render('login');
    }else{
        res.render('index');
    }
})
app.get('/logout', (req, res) =>{
    req.session.username= null;
    res.render('login');
})
app.get('/add', (req, res) =>{
    if(req.session.username == null){
        res.render('login');
    }else{
    res.render('add')
    }
})

app.get('/login', (req, res) =>{
    res.render('login');
})
app.get('/manage', async(req, res) =>{
    if(req.session.username == null){
        res.render('login');
    }else{
    const results = await dbHandler.searchProduct("","Product");
    res.render('manage', {product:results});
    }
})
app.get('/update', async(req,res)=>{
    const id = req.query.id;
    const condition = dbHandler.find(id);

    const productToEdit = await dbHandler.findOneProduct("Product", condition);

    res.render('edit',{product:productToEdit})
})
app.get('/delete', async(req,res)=>{
    const id = req.query.id;
    const condition = await dbHandler.find(id);

    await dbHandler.deleteProduct("Product", condition);
    let results = await dbHandler.searchProduct("","Product");
    res.render('manage',{product:results});
})
app.post('/doEdit',upload.single('picture'), async(req,res)=>{
    let id = req.body.id;
    var name = req.body.name;
    var introduction = req.body.introduction;
    var price = req.body.price;
    let newValues
    //validate price
    if(price.trim().length == 0 || isFinite(price) == false){
        const condition = dbHandler.find(id);
        const productToEdit = await dbHandler.findOneProduct("Product", condition);
        res.render('edit', {product:productToEdit, editError: 'Price must is number'})
    }else{
        if(!req.file){
            newValues ={$set : {name: name, introduction: introduction, price:price}};
        }
        else{
            //đọc file ảnh từ bộ nhớ
            var img = fs.readFileSync(req.file.path);
            //mã hóa dạng chuỗi base64
            var encode_image = img.toString('base64');
            var finalImg = {
                id: req.file.filename,
                contentType: req.file.mimetype,
                image:  new Buffer.from(encode_image, 'base64')
                };
            newValues ={$set : {name: name, introduction: introduction, picture:finalImg, price:price}};
        }
        let condition = dbHandler.find(id);

        let dbo = await dbHandler.updateOneProduct("Product", condition, newValues);

        let results = await dbHandler.searchProduct("","Product");

        res.render('manage',{product:results});
    }
})

app.post('/insert',upload.single('picture'), async(req,res)=>{
    var name = req.body.name;
    var introduction = req.body.introduction;
    var price = req.body.price;
    var img = fs.readFileSync(req.file.path);
    var encode_image = img.toString('base64');
    var finalImg = {
        id: req.file.filename,
        contentType: req.file.mimetype,
        image:  new Buffer.from(encode_image, 'base64')
        };
    if(price.trim().length == 0 || isFinite(price) == false){
        res.render('add', {addError: 'gia phai la so'})
    }else{
        var newproduct = {name: name, introduction: introduction, picture:finalImg, price:price};
        await dbHandler.insertOneIntoCollection("Product", newproduct);
        var results = await dbHandler.searchProduct("","Product");
        res.render('manage', {product:results});
    }
})
const dbHandler = require('./databaseHandler')
app.post('/search',async (req,res)=>{
    const searchText = req.body.txtName;
    const results = await dbHandler.searchProduct(searchText,"Product");
    res.render('manage',{product:results})
})
app.get('/register',(req,res)=>{
    res.render('register')
});
app.post('/doRegister',async (req,res)=>{
    const nameInput = req.body.name;
    const passInput = req.body.password;
    if(passInput.length< 8){
        res.render('register', {passError: 'Password phai tu 8 ki tu tro len'})
    }
    const newUser = {username:nameInput,password:passInput};
    await dbHandler.insertOneIntoCollection("users", newUser);
    res.render('login')
})
app.post('/doLogin',async (req,res)=>{
    const nameInput = req.body.name;
    const passInput = req.body.password;
    const found = await dbHandler.checkUser(nameInput,passInput);
    if(found){
        req.session.username = nameInput;
        res.render('index',{loginName:nameInput})       
    }else{
        res.render('login',{errorMsg:"Login failed!"})
    }
})


var PORT = process.env.PORT ||5000
app.listen(PORT);
console.log("Server is running on " + PORT)
