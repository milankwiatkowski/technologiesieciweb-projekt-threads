const express = require('express');
const app = express();
const path = require('node:path');
const cors = require('cors')
const session = require('express-session')
const cookieParser = require("cookie-parser");
const {isAuthenticated} = require('./routes/middleware')
const passport = require('passport')
const {Server} = require("socket.io")
const http = require("http")
require('dotenv').config();
const server = http.createServer(app)
const io = new Server(server,{
    cors:{
        origin:"http://localhost:5173",
        credentials:true
    }
})
app.set('io',io)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))
app.use(cookieParser());
app.use(session({
    secret: process.env.SECRET || 'hasło szyfrujące',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
const users = require(path.join(process.cwd(), 'routes','users'));
const auth = require(path.join(process.cwd(), 'routes','auth'));
const threads = require(path.join(process.cwd(), 'routes','threads'));
app.use('/users',isAuthenticated, users);
app.use('/auth', auth);
app.use('/threads',isAuthenticated, threads)

// Wczytujemy ewentualne dane konfiguracyjne z pliku „.env”
const dbConnData = {
    host: process.env.MONGO_HOST || '127.0.0.1',
    port: process.env.MONGO_PORT || 27017,
    database: process.env.MONGO_DATABASE || 'lab05'
};
io.on("connection",(socket)=>{
    console.log("user connected")
})
// Do kontaktu z serwerem MongoDB wykorzystamy bibliotekę Mongoose
const mongoose = require('mongoose');

// Łączymy się z bazą MongoDB i jeśli się to uda, uruchamiamy serwer API.
mongoose
    .connect(`mongodb://${dbConnData.host}:${dbConnData.port}/${dbConnData.database}`)
    .then(response => {
        console.log(`Połączono z MongoDB – baza: "${response.connections[0].name}"`)
        const apiPort = process.env.PORT || 3000
        const apiHost = process.env.API_HOST || 'localhost';
        server.listen(apiPort, () => console.log("Server running"));
    })
    .catch(error => {
        console.error('Błąd połączenia z serwerem MongoDB', error)
    });
