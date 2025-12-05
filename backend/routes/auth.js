const passport = require('passport')
const express = require('express');
const crypto = require('node:crypto')
const HASH_FUNCTION = process.env.HASH || 'sha256'
const SALT_BITS = process.env.SALT_BITS || 16
const SECRET = process.env.SECRET || 'secret';
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const { Strategy } = require('passport-jwt');
const {isAuthenticated,isAdmin} = require('./middleware')
const cookieExtractor = req => {
    if (req && req.cookies) {
        return req.cookies.jwt;
    }
    return null;
};
const time = new Date().toLocaleString('pl-PL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
const opts = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: SECRET,
};


passport.use(new Strategy(opts, async (payload, done) => {
    try {
        const user = await User.findById(payload.id);
        if (!user) return done(null, false);
        return done(null, user);
    } catch (err) {
        return done(err, false);
    }
}));

router.post('/login', async (req, res,next) => {
    try{
        console.log(`INFO User is logging in ${time}`)
        const user = await User.findOne({login:req.body.login})
        if(user && user.isAcceptedByAdmin){
            const testPassword = crypto.pbkdf2Sync(req.body.password, user.salt, 310000, 32, HASH_FUNCTION) 
            if(crypto.timingSafeEqual(user.password, testPassword)){
                const accessToken = jwt.sign({
                    id: user._id,isAdmin:user.isAdmin,isAcceptedByAdmin:user.isAcceptedByAdmin},
                    SECRET,
                    { expiresIn: '1d' });
                    res.cookie("jwt", accessToken, { httpOnly: true, secure:true,sameSite:"none" ,maxAge: 1000 * 60 * 60 * 24});
                console.log(`INFO User ${req.body.login} succesfully logged in ${time}`)
                return res.json({message:"Login successful!",status:200})
            }
            else{
                console.log(`INFO User ${req.body.login} tried logging in but failed due to an incorrect password ${time}`)
                return res.status(500).json({messaage:"Incorrect password"})
            }
        }
        else{
            console.log(`INFO User ${req.body.login} tried logging in but failed due to not being accepted by admin ${time}`)
            return res.status(500).json({message:"You are not accepted by the administrator"})
        }
    }
    catch (error){
        console.log(`ERROR ${error} ${time}`)
        next(error)
    }
});
router.post('/register', async (req, res,next) => {
    console.log(`INFO User ${req.body.login} is trying to register ${time}`)
    try{
        let salt = crypto.randomBytes(Number(SALT_BITS));
        const users = await User.find({login:req.body.login})
        if(users.length===0){
            crypto.pbkdf2(req.body.password, salt, 310000, 32, HASH_FUNCTION, async (err, hashedPassword) => {
                // const user = new User({isAdmin:true,password:hashedPassword,login:req.body.login,email:req.body.email,salt:salt,modOfThreadsId:[],isAcceptedByAdmin:true})
                const user = new User({isAdmin:false,password:hashedPassword,login:req.body.login,email:req.body.email,salt:salt,modOfThreadsId:[],isAcceptedByAdmin:false})
                if (err) { return next(err); }
                console.log(`INFO User ${req.body.login} registered succesfully ${time}`)
                await user.save()
                req.app.get('io').emit('adminMessage',`INFO - User ${req.body.login} is waiting to be accepted!`)
                req.app.get('io').emit('addUserToBeAccepted',user)
                return res.json({message:"Registration successful!",status:200})})
            }
        else{
            console.log(`INFO Username ${req.body.login} was already taken ${time}`)
            return res.status(500).json({message:"Username already taken"})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({message:"Error occured",status:400})
    }
});
router.get('/me',passport.authenticate('jwt',{session:false}), async (req, res) => {
    try{
        console.log(`INFO User ${req.user.login} is requesting authentication ${time}`)
          const userData = {
            _id: req.user.id,
            email: req.user.email,
            login: req.user.login,
            isAdmin: req.user.isAdmin,
            isAcceptedByAdmin: req.user.isAcceptedByAdmin,};
        return res.json({user:userData,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
    }
});
router.post('/logout', (req, res, next) => {
    res.clearCookie('jwt',{httpOnly:true,secure:true,sameSite:'none'})
    res.json({status:200})
});

module.exports = router;