const express = require('express');
const app = express();
const path = require('node:path');
const cors = require('cors')
const session = require('express-session')
const cookieParser = require("cookie-parser");
const {isAuthenticated, isAcceptedByAdmin} = require('./routes/middleware')
const passport = require('passport')
const {Server} = require("socket.io")
const http = require("http")
const cookie = require("cookie")
const jwt = require('jsonwebtoken');
app.use(cookieParser());
app.use(cors({
    origin:"https://localhost",
    credentials:true
}))
const server = http.createServer(app)
const io = new Server(server,{
    cors:{
        origin:"https://localhost",
        credentials:true
    }
})
function socketCookieExtractor(socket) {
  const header = socket.request?.headers?.cookie
  if (!header) return null

  const parsed = cookie.parse(header)
  return parsed.jwt || null
}
io.use((socket,next)=>{
    try{
        const token = socketCookieExtractor(socket)
        if(!token){
            return next(new Error("Unauthorized"))
        }
        const payload = jwt.verify(token,process.env.SECRET)
        socket.user = payload
        return next()
    }
    catch (err){
        return next(new Error("Unauthorized"))
    }
})
app.set('io',io)
io.on("connection",(socket)=>{
    if(socket.user.isAdmin){
        socket.join('admins')
        socket.join('adminsChat')
    }
    else{
        socket.join('users')
    }
    socket.on("thread:join",({threadId})=>{
        socket.join(`thread:${threadId}`)
    })
    socket.on("thread:leave",({threadId})=>{
        socket.leave(`thread:${threadId}`)
    })
    socket.on("post:join",({postId})=>{
        socket.join(`post:${postId}`)
    })
    socket.on("post:leave",({postId})=>{
        socket.leave(`post:${postId}`)
    })
})
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("trust proxy", 1);
app.use(passport.initialize());
const users = require(path.join(process.cwd(), 'routes','users'));
const auth = require(path.join(process.cwd(), 'routes','auth'));
const threads = require(path.join(process.cwd(), 'routes','threads'));
app.use('/users',isAuthenticated,isAcceptedByAdmin, users);
app.use('/auth', auth);
app.use('/threads',isAuthenticated,isAcceptedByAdmin, threads)

// Wczytujemy ewentualne dane konfiguracyjne z pliku „.env”
const dbConnData = {
    host: process.env.MONGO_HOST || "mongo",
    port: parseInt(process.env.MONGO_PORT) || 27017,
    database: process.env.MONGO_DATABASE || 'appdb'
};
// Do kontaktu z serwerem MongoDB wykorzystamy bibliotekę Mongoose
const mongoose = require('mongoose');

// Łączymy się z bazą MongoDB i jeśli się to uda, uruchamiamy serwer API.
mongoose
    .connect(`mongodb://${dbConnData.host}:${dbConnData.port}/${dbConnData.database}`)
    .then(response => {
        console.log(`Połączono z MongoDB – baza: "${response.connections[0].name}"`)
        const apiPort = process.env.PORT || 3000
        const apiHost = process.env.API_HOST || 'host';
        server.listen(apiPort,"0.0.0.0", () => console.log("Server running"));
    })
    .catch(error => {
        console.error('Błąd połączenia z serwerem MongoDB', error)
    });
