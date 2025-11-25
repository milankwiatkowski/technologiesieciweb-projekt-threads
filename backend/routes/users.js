const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const {isAdmin} = require('./middleware')
router.get('/',isAdmin, async (req, res) => {
    try{
        const users =  await User.find()
        res.json({users:users,status:200})
    }
    catch{
        res.json({message:"Error"})
    }
});

router.delete('/:idUser',isAdmin, async (req, res) => {
    try{
        const user = User.findById(req.params.idUser)
        if(!user.isAdmin){
            await User.findByIdAndDelete(req.params.idUser)
            res.json({message:"User deleted",status:200})
        }
    }    
    catch (err){
        res.json({message:"User not found or is an admin",status:400})
    }
});

router.get('/find/:idUser', async (req, res) => {
    const id = req.params.idUser
    try{
        const foundUser = await User.findById(id)
        res.render('userFound', {id:foundUser._id,isUserAdmin:foundUser.isAdmin,login:foundUser.login,email:foundUser.email,isAdmin: req.user && req.user.isAdmin})}
    catch (err){
        res.render('userNotFound', {id:id})
    }
});

router.post('/patch/:idUser',isAdmin, async (req, res) => {
    const id = req.params.idUser;
    try{
        if(req.body.login && req.body.email){
            await User.findOneAndUpdate({_id:id}, {login:req.body.login, email:req.body.email})
        }
        else if(req.body.login){
            await User.findOneAndUpdate({_id:id}, {login:req.body.login})
        }
        else if(req.body.email){
            await User.findOneAndUpdate({_id:id}, {email:req.body.email})
        }
        res.send({'message':"User successfully patched"})}
    catch (err){
        res.render('userNotFound', {id:id})
    }
});

module.exports = router;
