const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require('../models/User');
const Thread = require(path.join(process.cwd(), 'models', 'Thread'));
const Subthread = require(path.join(process.cwd(), 'models', 'Subthread'));

router.get('/:threadId',async(req,res)=>{
    try{
        const parentThread = await Thread.findById(req.params.threadId)
        const subthreads = await Subthread.find({mainThreadId:parentThread})
        res.render('subthreadmainPage',{subthreads:subthreads,parentId:req.params.threadId})
    }
    catch{
        res.send({"message":"An error occured, we're working on it."})
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
        res.render('subthreadPage',{subthread:subthread})
    }
    catch{
        res.send({"message":"An error occured!"})
    }
})
router.post('/:threadId',async(req,res)=>{
    try{
        const user = await User.findById(req.user.id)
        if(!user.blockedInThreadsId.find((x) => x.toString() === req.params.threadId)){
            const parentThread = await Thread.findById(req.params.threadId)
            const newSubthread = new Subthread({title:req.body.title,content:req.body.content,mainThreadId:parentThread._id})
            await newSubthread.save()
            const subthreadIdTab = parentThread.subThreadsId
            subthreadIdTab.push(newSubthread._id)
            const updated = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {subThreadsId: subthreadIdTab} },
                { new: true, runValidators: true }
            );
            res.redirect(`/subthreads/${req.params.threadId}`)
        }
    }
    catch{
        res.send({"message":`There is no thread with this id: ${req.params.threadId}!`})
    }
})
router.post('/subthread/:subthreadId',async(req,res)=>{
    try{
        const subthreadToBeDeleted = await Subthread.findById(req.params.subthreadId)
        const parentThread = await Thread.findById(subthreadToBeDeleted.mainThreadId)
        if(req.user.id === subthreadToBeDeleted.subthreadCreatorId || parentThread.modsThreadId.find((x)=> x === req.user.id) || parentThread.creatorId === req.user.id || req.user.isAdmin){
            await Subthread.findByIdAndDelete(req.params.subthreadId)
            const subthreadIdTab = parentThread.subThreadsId
            const newTab = subthreadIdTab.filter((x) => x.toString() !== req.params.subthreadId)
            const updated = await Thread.findByIdAndUpdate(
                parentThread._id,
                { $set: {subThreadsId: newTab} },
                { new: true, runValidators: true }
            );
            res.redirect(`/subthreads/${parentThread._id}`)
        }
    }
    catch{
        res.send({'message':'You are not the subthread creator nor the administrator!'})
    }
})
module.exports = router