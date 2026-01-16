const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const {isAdmin} = require('./middleware')
const crypto = require('node:crypto')
const HASH_FUNCTION = process.env.HASH || 'sha256'
const SALT_BITS = process.env.SALT_BITS || 16
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
router.get('/find/:loginUser',isAdmin, async (req, res) => {
    console.log(`INFO User ${req.user.login} is trying to find user ${req.params.loginUser} ${getTime()}`)
    const login = req.params.loginUser
    try{
        const foundUser = await User.findOne({login:login}).skip()
        console.log(`INFO User ${req.user.login} successfully found user ${req.params.loginUser} ${getTime()}`)
        return res.status(200).json({user:foundUser})
    }
    catch (err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.status(400)
    }
});
router.get(`/:page/:limit`,isAdmin, async (req, res) => {
    const page = req.params.page
    const limit = req.params.limit
    console.log(`INFO User ${req.user.login} is requesting the list of all users ${getTime()}`)
    try{
        const users =  await User.find().skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
        console.log(`INFO User ${req.user.login} was granted the list of all users ${getTime()}`)
        return res.status(200).json({users:users})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.status(400).json({message:"Error occurred"})
    }
});
router.delete('/:idUser',isAdmin, async (req, res) => {
    console.log(`INFO User ${req.user.login} is trying to delete user ${req.params.idUser} ${getTime()}`)
    try{
        const user = await User.findById(req.params.idUser)
        if(!user.isAdmin){
            await User.findByIdAndDelete(req.params.idUser)
            console.log(`INFO User ${req.params.idUser} was succesfully deleted ${getTime()}`)
            return res.json({message:"User deleted",status:200})
        }
    }    
    catch (err){
        console.log(`ERROR User ${req.user.login} didn't delete user ${req.params.idUser} ${err } ${getTime()}`)
        return res.json({message:"User not found or is an admin",status:400})
    }
});


router.post('/patch/:idUser', async (req, res) => {
    console.log(`INFO User ${req.user.login} is trying to patch user ${req.params.idUser} ${getTime()}`)
    const id = req.params.idUser;
    try{
        if(req.user.id === req.params.idUser){
            if(req.body.login){
                const users = await User.find({login:req.body.login})
                if(users.length===0){
                    await User.findByIdAndUpdate(req.params.idUser,
                    { $set: {login:req.body.login}},
                    { new:true, runValidators:true})
                    console.log(`INFO User's ${req.body.login} LOGIN was patched successfully ${getTime()}`)
                }
                else{
                    console.log(`INFO Username ${req.body.login} was already taken ${getTime()}`)
                    return res.status(500).json({message:"Username already taken"})
                }
            }
            else if(req.body.password && req.body.repeatedPassword){
                let salt = crypto.randomBytes(Number(SALT_BITS));
                const users = await User.find({login:req.body.login})
                    crypto.pbkdf2(req.body.password, salt, 310000, 32, HASH_FUNCTION, async (err, hashedPassword) => {
                        const user = await User.findByIdAndUpdate(req.params.idUser,
                            { $set: {password:hashedPassword}},
                            { new:true, runValidators:true}
                        )
                        if (err) { return next(err); }
                        console.log(`INFO User's ${req.body.login} PASSWORD was patched succesfully ${getTime()}`)
                        return res.json({message:"Patch successful",user:user,status:200})})
            }
            console.log(`INFO User ${req.user.id} successfully patched user ${req.params.idUser} ${getTime()}`)
            const user = await User.findById(req.params.idUser)
            req.app.get("io").emit('user',user) //TODO
            return res.json({status:200})
        }
    }
    catch (err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
});
router.get(`/toBeAccepted`,isAdmin, async (req, res,next) => {
    console.log(`INFO Admin ${req.user.login} is requesting users to be accepted ${getTime()}`)
    try{
        const users = await User.find({isAcceptedByAdmin:false,isAdmin:false})
        return res.json({users:users,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        next(err)
    }
});
router.post(`/toBeAccepted/:id`,isAdmin, async (req, res,next) => {
    console.log(`INFO Admin ${req.user.login} is accepting user ${req.params.id} ${getTime()}`)
    try{
        const user = await User.findByIdAndUpdate(req.params.id,
            { $set: {isAcceptedByAdmin:true}},
            { new:true, runValidators:true})
        req.app.get('io').to('admins').emit('userAccepted',user)
        req.app.get('io').to('adminsChat').emit('adminMessage',`INFO - User ${user.login} was accepted!`)
        return res.json({user:user,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        next(err)
    }
});
router.post(`/notToBeAccepted/:id`,isAdmin, async (req, res,next) => {
    console.log(`INFO Admin ${req.user.login} is not accepting user ${req.params.id} ${getTime()}`)
    try{
        const user = await User.findByIdAndDelete(req.params.id)
        req.app.get('io').to('admins').emit('userNotAccepted',user)
        req.app.get('io').to('adminsChat').emit('adminMessage',`INFO - User ${user.login} was denied!`)
        return res.json({user:user,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        next(err)
    }
});
router.post(`/giveAdmin/:id`,isAdmin,async(req,res,next)=>{
    console.log(`INFO Admin ${req.user.login} is trying to give admin to user ${req.params.id} ${getTime()}`)
    try{
        const user = await User.findByIdAndUpdate(req.params.id,
            { $set: {isAdmin:true}},
            { new:true, runValidators:true})
        req.app.get('io').to('admins').emit('adminAdded',user)
        return res.json({user:user,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        next(err)
    }
})
module.exports = router;
