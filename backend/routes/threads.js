const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const Thread = require(path.join(process.cwd(), 'models', 'Thread'));
const Subthread = require(path.join(process.cwd(), 'models', 'Subthread'));

router.get('/',async(req,res)=>{
    try{
        const threads = await Thread.find()
        return res.json({threads:threads,status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.get('/:threadId',async(req,res)=>{
    try{
        const thread = await Thread.findById(req.params.threadId)
        // console.log(thread)
        return res.json({thread:thread,status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.post('/',async(req,res)=>{
    try{
        const newThread = new Thread({title:req.body.title,subThreadsId:[],modsThreadId:[req.user.id],creatorId:req.user.id,threadAuthors:[],blockedId:[]})
        await newThread.save()
        const threads = await Thread.find()
        return res.json({threads:threads,status:200})
    }
    catch{
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
})
router.post('/:threadId/block/:userId',async(req,res)=>{
    try{
        const thread = await Thread.findById(req.params.threadId)
        const blocked = thread.blockedId
        if(!blocked.includes(req.params.userId)){
            blocked.push(req.params.userId)
        }
        const updated = await Thread.findByIdAndUpdate(
            req.params.threadId,
            { $set: {blockedId:blocked}},
            { new:true, runValidators:true}
        )
        return res.json({status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.post('/:threadId/givemod/:userId',async(req,res)=>{
    try{
        const thread = await Thread.findById(req.params.threadId)
        const mods = thread.modsThreadId
        if(!mods.includes(req.params.userId)){
            mods.push(req.params.userId)
            const user = await User.findById(req.params.userId)
            if(!user.modOfThreadsId.includes(req.params.threadId)){
                const userUpdate = await User.findByIdAndUpdate(
                    req.params.userId,
                    { $set: {modOfThreadsId: [...user.modOfThreadsId,req.params.threadId]}},
                    {new:true, runValidators:true}
                )
            }
        }
        const updated = await Thread.findByIdAndUpdate(
            req.params.threadId,
            { $set: {modsThreadId:mods}},
            { new:true, runValidators:true}
        )
        return res.json({status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.delete('/:threadId/givemod/:userId',async(req,res)=>{
    try{
        const thread = await Thread.findById(req.params.threadId)
        const mods = thread.modsThreadId
        if(mods.includes(req.params.userId)){
            const newMods = mods.filter((x) => x.toString() !== req.params.userId)
            const user = await User.findById(req.params.userId)
            if(user.modOfThreadsId.includes(req.params.threadId)){
                const newmodOfThreadsId = user.modOfThreadsId.filter((x) => x.toString() !== req.params.threadId)
                const userUpdate = await User.findByIdAndUpdate(
                    req.params.userId,
                    { $set: {modOfThreadsId: newmodOfThreadsId}},
                    {new:true, runValidators:true}
                )
            }
            const updated = await Thread.findByIdAndUpdate(
            req.params.threadId,
            { $set: {modsThreadId:newMods}},
            { new:true, runValidators:true}
            )
        }
        return res.json({status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.delete('/:threadId',async(req,res)=>{
    try{
        const threadToBeDeleted = await Thread.findById(req.params.threadId)
        if(req.user.id === threadToBeDeleted.creatorId  || req.user.isAdmin){
            threadToBeDeleted.subThreadsId.map(async (x)=>{
                await Subthread.findByIdAndDelete(x)
            })
            await Thread.findByIdAndDelete(req.params.threadId)
            const threads = await Thread.find()
            return res.json({threads:threads,status:200})
        }
    }
    catch{
        return res.json({message:'You are not the thread creator nor the administrator!',status:400})
    }
})
module.exports = router