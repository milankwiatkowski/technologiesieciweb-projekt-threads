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
const validator = require('validator')
const cookieExtractor = req => {
    if (req && req.cookies) {
        return req.cookies.jwt;
    }
    return null;
};
function getDate(){
    return new Date().toLocaleString('pl-PL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}
function getTime(){
    return new Date().toLocaleString('pl-PL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
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
        console.log(`INFO User is logging in ${getTime()}`)
        const user = await User.findOne({login:req.body.login})
        if(user){
            if(user.isAcceptedByAdmin){
                const testPassword = crypto.pbkdf2Sync(req.body.password, user.salt, 310000, 32, HASH_FUNCTION) 
                if(crypto.timingSafeEqual(user.password, testPassword)){
                    const accessToken = jwt.sign({
                        id: user._id,login:user.login,isRootMod:user.isRootMod,isAdmin:user.isAdmin,isAcceptedByAdmin:user.isAcceptedByAdmin},
                        SECRET,
                        { expiresIn: '1d' });
                        res.cookie("jwt", accessToken, { httpOnly: true, secure:true,sameSite:"none" ,maxAge: 1000 * 60 * 60 * 24});
                    console.log(`INFO User ${req.body.login} succesfully logged in ${getTime()}`)
                    return res.json({message:"Login successful!",status:200, token:accessToken})
                }
                else{
                    console.log(`INFO User ${req.body.login} tried logging in but failed due to an incorrect password ${getTime()}`)
                    return res.status(501).json({messaage:"Incorrect password"})
                }
            }
            else{
                console.log(`INFO User ${req.body.login} tried logging in but failed due to not being accepted by admin ${getTime()}`)
                return res.status(500).json({message:"You are not accepted by the administrator"})
            }
        }
        else{
            console.log(`INFO User ${req.body.login} tried logging in but failed (wrong login) ${getTime()}`)
            return res.status(501).json({message:"Incorrect login"})
        }
    }
    catch (error){
        console.log(`ERROR ${error} ${getTime()}`)
        next(error)
    }
});
router.post('/register', async (req, res,next) => {
    console.log(`INFO User ${req.body.login} is trying to register ${getTime()}`)
    try{
        const login_remade = String(req.body.login || "").trim().toLowerCase()
        if(!validator.isEmail(login_remade)){
            return res.status(500).json({message:"Username has to be an email!"})
        }
        else{
            if(req.body.password===req.body.repeatedPassword){
                if(req.body.password.length>=7 && req.body.password.length<=15){
                    let salt = crypto.randomBytes(Number(SALT_BITS));
                    const users = await User.find()
                    if(users.length===0){
                        crypto.pbkdf2(req.body.password, salt, 310000, 32, HASH_FUNCTION, async (err, hashedPassword) => {
                            const user = new User({isAdmin:true,password:hashedPassword,isRootMod:true,login:login_remade,salt:salt,modOfThreadsId:[],isAcceptedByAdmin:true,isBlockedEverywhere:false,registrationDate:getDate()})
                            if (err) { return next(err); }
                            console.log(`INFO User ${login_remade} registered succesfully ${getTime()}`)
                            await user.save()
                            return res.json({message:"Registration successful!",status:200})})
                    }
                    else{
                        const userFound = users.filter((x) => x.login === req.body.login)
                        if(userFound.length===0){
                            crypto.pbkdf2(req.body.password, salt, 310000, 32, HASH_FUNCTION, async (err, hashedPassword) => {
                                const user = new User({isAdmin:false,password:hashedPassword,isRootMod:false,login:login_remade,salt:salt,modOfThreadsId:[],isAcceptedByAdmin:false,isBlockedEverywhere:false})
                                console.log(`INFO User ${login_remade} registered succesfully ${getTime()}`)
                                if (err) { return next(err); }
                                await user.save()
                                req.app.get('io').to('adminsChat').emit('adminMessage',`INFO - User ${login_remade} is waiting to be accepted!`)
                                req.app.get('io').to('admins').emit('addUserToBeAccepted',user)
                                return res.json({message:"Registration successful!",status:200})})
                        }
                        else{
                            console.log(`INFO Username ${login_remade} was already taken ${getTime()}`)
                            return res.status(500).json({message:"Username already taken"})
                        }
                    }
                }
                else{
                    console.log(`INFO User ${login_remade} tried to register but the password was of a wrong length!${getTime()}`)
                    return res.status(500).json({message:"Password has a wrong length! They should have between 7 and 15 characters"})
                }
            }
            else{
                console.log(`ERROR Passwords must match! ${getTime()}`)
                return res.status(500).json({message:"Passwords must match!"})
            }
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({message:"Error occured",status:400})
    }
});
router.get('/me',passport.authenticate('jwt',{session:false}), async (req, res) => {
    try{
        console.log(`INFO User ${req.user.login} is requesting authentication ${getTime()}`)
          const userData = {
            _id: req.user.id,
            isRootMod: req.user.isRootMod,
            login: req.user.login,
            isAdmin: req.user.isAdmin,
            isAcceptedByAdmin: req.user.isAcceptedByAdmin,
            isBlockedEverywhere: req.user.isBlockedEverywhere};
        return res.json({user:userData,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
    }
});
router.post('/logout', (req, res, next) => {
    res.clearCookie('jwt',{httpOnly:true,secure:true,sameSite:'none'})
    return res.status(200).json({message:'ok'})
});

module.exports = router;