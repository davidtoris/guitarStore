const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()
const mongoose = require('mongoose')

//Squemas
const { Brand } = require('./models/brand')
const  { User } = require('./models/user')
const  { Wood } = require('./models/wood')
const { Product } = require('./models/product')

// Middleware
const { auth } = require('./middleware/auth')
const { admin } = require('./middleware/admin')


require('dotenv').config()

//3 parametros en mongoose.connect)dirección,opciones de conexion,callback
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true, useCreateIndex: true }, (err) => {
    if(err) return err
    console.log("Conectado a MongoDB")
})

app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(cookieParser())

const port = process.env.PORT || 3002

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`)
})




app.post('/api/users/register', (req, res) => {
    const user = new User(req.body)
    user.save((err, doc) => {
        if(err) return res. json({success: false, err})
        res.status(200).json({
            success: true,
            userdata: doc
        })
    })
})


//LOGIN
app.post('/api/users/login', (req, res) => {
    
    // 1. Encuentra el correo
    User.findOne({'email': req.body.email}, (err,userinput) => {
        if(!userinput) return res.json({loginSuccess: false, message: 'Auth fallida, email no encontrado'})

        // 2. Obtén el password y compruébalo
        userinput.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({loginSuccess: false, message: "Password erróneo"})
    
            // 3. Si todo es correcto, genera un token
            userinput.generateToken((err, userinput)=> {
                if(err) return res.status(400).send(err)
                // Si todo bien, debemos guardar este token como un "cookie"
                res.cookie('guitarshop_auth', userinput.token).status(200).json(
                    {loginSuccess: true}
                )
            })
    
        })
    
    })
    
})


//Autenticacion de Usuariopor Token en todas las rutas
app.get('/api/users/auth', auth, (req, res) => {
    res.status(200).json({
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        cart: req.user.cart,
        history: req.user.history
    })
})


app.post('/api/users/auth', (req, res) => {
    res.status(200).json({
    success: true
    })
})


//Cerrar sesión
app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate(
        {_id: req.user._id},
        {token: ''},
        (err, doc) => {
            if(err) return res.json({success: false, err})
            return res.status(200).json({
                success: true
            })
        }
    )
})



// **************** BRAND ********************

app.post('/api/product/brand', auth, admin, (req, res) => {
    const brand = new Brand(req.body)
    brand.save((err, doc) => {
        if(err) return res.json({success: false, err})
        res.status(200).json({
            success: true,
            brand: doc
        })
    })
})

// Obtener todos
app.get('/api/product/brands', (req, res) => {
    Brand.find({}, (err, brands) => { 
        if(err) return res.status(400).send(err)
        res.status(200).send(brands)
    })
})


// **************** WOODS ********************

app.post('/api/product/wood', auth, admin, ( req, res) => { 
    const wood = new Wood(req.body)
    wood.save((err, doc) =>{
        if(err) return res.status(400).send(err)
        res.status(200).json({
            success: true,
            wood: doc
        })
    })
})


app.get('/api/product/woods', (req, res) =>{
    Wood.find({}, (err, woods) => {
        if(err) return res.status(400).send(err)
        res.status(200).send(woods)
    })
})



// **************** PRODUCTS ********************
app.post('/api/product/article', auth, admin, (req, res) =>{
    const product = new Product(req.body)
    product.save((err, doc) => {
        if(err) return res.json({success: false}, err)
        res.status(200).json({
            success: true,
            article: doc
        })
    })
})

