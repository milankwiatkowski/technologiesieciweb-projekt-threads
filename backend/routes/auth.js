const passport = require('passport')
const express = require('express');
const crypto = require('node:crypto')
const HASH_FUNCTION = process.env.HASH || 'sha256'
const SALT_BITS = process.env.SALT_BITS || 16
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const { Strategy } = require('passport-jwt');
const SECRET = process.env.SECRET || 'secret';
const {isAuthenticated,isAdmin} = require('./middleware')
const cookieExtractor = req => {
    if (req && req.cookies) {
        return req.cookies.jwt;
    }
    return null;
};
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

router.get('/login', async (req, res) => {
    res.render('login');
});
router.post('/login', async (req, res,next) => {
    try{
        const user = await User.findOne({login:req.body.login})
        if(user){
            const testPassword = crypto.pbkdf2Sync(req.body.password, user.salt, 310000, 32, HASH_FUNCTION) 
            if(crypto.timingSafeEqual(user.password, testPassword)){
                const accessToken = jwt.sign({
                    id: user._id,isAdmin:user.isAdmin},
                    SECRET,
                    { expiresIn: '1d' });
                    res.cookie("jwt", accessToken, { httpOnly: true, secure:true,sameSite:"none",path:"/" });
                return res.json({message:"Login successful!",status:200})
            }
            else{
                return res.json({message:"Incorrect password",status:400})
            }
        }
    }
    catch (error){
        next(error)
    }
});
router.get('/register', async (req, res) => {
    res.render('registerUser',{isAdmin:req.user && req.user.isAdmin});
});
router.post('/register', async (req, res,next) => {
    let salt = crypto.randomBytes(Number(SALT_BITS));
    crypto.pbkdf2(req.body.password, salt, 310000, 32, HASH_FUNCTION, async (err, hashedPassword) => {
        if (err) { return next(err); }
        const user = new User({isAdmin:false,password:hashedPassword,login:req.body.login,email:req.body.email,salt:salt})
        await user.save()
        res.json({message:"Registration successful!",status:200})})
});
router.get('/me',passport.authenticate('jwt',{session:false}), async (req, res) => {
    try{
        res.json({user:req.user,status:200})
    }
    catch(err){
        console.log(err)
    }
});

router.post('/logout', (req, res, next) => {
    res.clearCookie('jwt')
    res.json({status:200})
});

module.exports = router;