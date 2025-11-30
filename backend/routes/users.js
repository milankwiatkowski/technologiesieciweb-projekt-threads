const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const {isAdmin} = require('./middleware')
const time = new Date().toLocaleString('pl-PL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

router.get('/',isAdmin, async (req, res) => {
    console.log(`INFO User ${req.user.login} is requesting the list of all users ${time}`)
    try{
        const users =  await User.find()
        console.log(`INFO User ${req.user.login} was granted the list of all users ${time}`)
        return res.json({users:users,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({message:"Error occurred",status:400})
    }
});

router.delete('/:idUser',isAdmin, async (req, res) => {
    console.log(`INFO User ${req.user.login} is trying to delete user ${req.params.idUser} ${time}`)
    try{
        const user = User.findById(req.params.idUser)
        if(!user.isAdmin){
            await User.findByIdAndDelete(req.params.idUser)
            console.log(`INFO User ${req.params.idUser} was succesfully deleted ${time}`)
            return res.json({message:"User deleted",status:200})
        }
    }    
    catch (err){
        console.log(`ERROR User ${req.user.login} didn't delete user ${req.params.idUser} ${err } ${time}`)
        return res.json({message:"User not found or is an admin",status:400})
    }
});

router.get('/find/:idUser', async (req, res) => {
    console.log(`INFO User ${req.user.login} is trying to find user ${req.params.idUser} ${time}`)
    const id = req.params.idUser
    try{
        const foundUser = await User.findById(id)
        console.log(`INFO User ${req.user.login} successfully found user ${req.params.idUser} ${time}`)
        res.render('userFound', {id:foundUser._id,isUserAdmin:foundUser.isAdmin,login:foundUser.login,email:foundUser.email,isAdmin: req.user && req.user.isAdmin})}
    catch (err){
        console.log(`ERROR User ${req.params.idUser} not found ${time}`)
        res.render('userNotFound', {id:id})
    }
});

router.post('/patch/:idUser',isAdmin, async (req, res) => {
    console.log(`INFO User ${req.user.login} is trying to patch user ${req.params.idUser} ${time}`)
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
        console.log(`INFO User ${req.user.login} successfully patched user ${req.params.idUser} ${time}`)
        res.send({'message':"User successfully patched"})}
    catch (err){
        console.log(`ERROR ${err} ${time}`)
        res.render('userNotFound', {id:id})
    }
});

module.exports = router;
