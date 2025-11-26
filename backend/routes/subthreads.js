const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const Thread = require(path.join(process.cwd(), 'models', 'Thread'));
const Subthread = require(path.join(process.cwd(), 'models', 'Subthread'));

router.get('/:threadId/:page/:limit',async(req,res)=>{
    try{
        const {threadId,page,limit} = req.params
        const parentThread = await Thread.findById(threadId)
        const subthreads = await Subthread.find({mainThreadId:parentThread}).skip((page-1)*limit).limit(Number(limit))
        return res.json({subthreads:subthreads,status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.get('/:threadId/admin',async(req,res)=>{
    try{
        const user = await User.findById(req.user.id)
        const users = await User.find()
        if(req.user.isAdmin || user.modOfThreadsId.find(req.params.threadId)){
            res.render('threadMod',{users:users})
        }
    }
    catch{
        res.send({"message":"An error occured, we're working on it."})
    }
})
router.get('/subthread/:subthreadId',async(req,res)=>{
    try{
        const subthread = await Subthread.findById(req.params.subthreadId)
        res.json({subthread:subthread,status:200})
    }
    catch{
        res.json({status:400})
    }
})
router.post('/:threadId',async(req,res)=>{
    try{
        const parentThread = await Thread.findById(req.params.threadId)
        if(!parentThread.blockedId.includes(req.user.id)){
            const newSubthread = new Subthread({title:req.body.title,content:req.body.content,mainThreadId:parentThread._id,subthreadCreatorId:req.user.id,userLikesId:[],likes:0})
            await newSubthread.save()
            const subthreadIdTab = [...parentThread.subThreadsId,newSubthread._id]
            const authors = parentThread.threadAuthors
            if(!authors.find((x) => x.id.toString() === req.user.id)){
                const user = await User.findById(req.user.id)
                authors.push({id:req.user.id,login:user.login})
            }
            const updated = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {subThreadsId: subthreadIdTab,threadAuthors:authors} },
                { new: true, runValidators: true }
            );
            return res.json({status:200}) 
        }
    }
    catch{
        return res.json({message:`There is no thread with this id: ${req.params.threadId}!`})
    }
})
router.delete('/:subthreadId',async(req,res)=>{
    try{
        const subthreadToBeDeleted = await Subthread.findById(req.params.subthreadId)
        const parentThread = await Thread.findById(subthreadToBeDeleted.mainThreadId)
        if(req.user.id === subthreadToBeDeleted.subthreadCreatorId || parentThread.modsThreadId.find((x)=> x.toString() === req.user.id) || parentThread.creatorId === req.user.id || req.user.isAdmin){
            await Subthread.findByIdAndDelete(req.params.subthreadId)
            const subthreadIdTab = parentThread.subThreadsId
            const newTab = subthreadIdTab.filter((x) => x.toString() !== req.params.subthreadId)
            const updated = await Thread.findByIdAndUpdate(
                parentThread._id,
                { $set: {subThreadsId: newTab} },
                { new: true, runValidators: true }
            );
            return res.json({status:200})
        }
    }
    catch{
        return res.json({status:400})
    }
})
router.get('/:subthreadId/likes',async(req,res)=>{
    try{
        const subthread = await Subthread.findById(req.params.subthreadId)
        return res.json({likes:subthread.likes,status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.post('/:subthreadId/likes',async(req,res)=>{
    try{
        const subthread = await Subthread.findById(req.params.subthreadId)
        if(subthread.userLikesId.find((x) => x.toString() === req.user.id)){
            const updated = await Subthread.findByIdAndUpdate(
            req.params.subthreadId,
            { $set: {likes: subthread.likes-1, userLikesId: subthread.userLikesId.filter((x) => x.toString() !== req.user.id)}},
            { new: true, runValidators: true })
        }
        else{
            const updated = await Subthread.findByIdAndUpdate(
            req.params.subthreadId,
            { $set: {likes: subthread.likes+1, userLikesId: [...subthread.userLikesId,req.user.id]}},
            { new: true, runValidators: true })
        }
        return res.json({status:200})
    }
    catch{
        return res.json({status:400})
    }
})
module.exports = router