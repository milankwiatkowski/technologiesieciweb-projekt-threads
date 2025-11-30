const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const Thread = require(path.join(process.cwd(), 'models', 'Thread'));

router.get('/:threadId/likes',async(req,res)=>{
    try{
        const thread = await Thread.findById(req.params.threadId)
        return res.json({likes:thread.likes,status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.post('/:threadId/likes',async(req,res)=>{
    try{
        const thread = await Thread.findById(req.params.threadId)
        if(thread.userLikesId.find((x) => x.toString() === req.user.id)){
            const updated = await Thread.findByIdAndUpdate(
            req.params.threadId,
            { $set: {likes: thread.likes-1, userLikesId: thread.userLikesId.filter((x) => x.toString() !== req.user.id)}},
            { new: true, runValidators: true })
        }
        else{
            const updated = await Thread.findByIdAndUpdate(
            req.params.threadId,
            { $set: {likes: thread.likes+1, userLikesId: [...thread.userLikesId,req.user.id]}},
            { new: true, runValidators: true })
        }
        const e = await Thread.findById(req.params.id)
        console.log(e.likes)
        return res.json({status:200})
    }
    catch{
        return res.json({status:400})
    }
})

router.get('/:page/:limit',async(req,res)=>{
    try{
        // await Thread.deleteMany({})
        const {page,limit} = req.params
        const threads = await Thread.find().skip((page-1)*limit).limit(Number(limit))
        const filtered = threads.filter((x) => x.parentThreadId === null)
        return res.json({threads:filtered,status:200})
    }
    catch{
        return res.json({status:400})
    }
})
router.get('/:threadId/:page/:limit',async(req,res)=>{
    try{
        const {page,limit} = req.params
        const thread = await Thread.findById(req.params.threadId)
        const childThreads = await Promise.all(thread.childThreadsId.map(async (x) => {
            const child = await Thread.findById(x._id)
            return{
                _id: child._id,
                title: child.title,
                content: child.content
            }
        }))
        return res.json({threads:childThreads,thread:thread,status:200})
    }
    catch (err){
        console.log(err)
        return res.json({status:400});
}
})
router.delete('/:threadId',async(req,res)=>{
    try{
        const threadToBeDeleted = await Thread.findById(req.params.threadId)
        if(req.user.id === threadToBeDeleted.creatorId  || req.user.isAdmin){
            const stack = []
            async function getChildren(thread){
                if(thread.childThreadsId.length === 0){
                    stack.push(thread._id)
                }
                else{
                    for(let i=0;i<thread.childThreadsId.length;i++){
                        const child = await Thread.findById(thread.childThreadsId[i])
                        await getChildren(child)
                        stack.push(child._id)
                    }
                }
            }
            await getChildren(threadToBeDeleted)
            for(let i=0;i<stack.length;i++){
                await Thread.findByIdAndDelete(stack[i])
            }
            await Thread.findByIdAndDelete(threadToBeDeleted._id)
            if(threadToBeDeleted.parentThreadId!=null){
                const parentThread = await Thread.findById(threadToBeDeleted.parentThreadId)
                const filteredChildren = parentThread.childThreadsId.filter((x) => x.toString() !== req.params.threadId)
                const update = await Thread.findByIdAndUpdate(
                    parentThread._id,
                    { $set: {childThreadsId: filteredChildren}},
                    { new:true, runValidators:true}
                )}
            }
            const threads = await Thread.find()
            return res.json({threads:threads,status:200})
    }
    catch{
        return res.json({message:'You are not the thread creator nor the administrator!',status:400})
    }
})
router.post('/',async(req,res)=>{
    try{
        const newThread = new Thread({title:req.body.title,content:req.body.content,parentThreadId:null,childThreadsId:[],modsThreadId:[req.user.id],creatorId:req.user.id,threadAuthors:[],userLikesId:[],likes:0,blockedId:[],tags:[],isClosed:false})
        await newThread.save()
        const threads = await Thread.find()
        return res.json({threads:threads,status:200})
    }
    catch{
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
})
router.post('/:threadId',async(req,res)=>{
    try{
        const parentThread = await Thread.findById(req.params.threadId)
        if(!parentThread.blockedId.includes(req.user.id) && !parentThread.isClosed){
            const newThread = new Thread({title:req.body.title,content:req.body.content,parentThreadId:parentThread._id,childThreadsId:[],modsThreadId:[...parentThread.modsThreadId,req.user.id],creatorId:req.user.id,threadAuthors:[],userLikesId:[],likes:0,blockedId:[...parentThread.blockedId],tags:[...parentThread.tags],isClosed:false})
            await newThread.save()
            const authors = parentThread.threadAuthors
            if(!authors.find((x) => x.id.toString() === req.user.id)){
                const user = await User.findById(req.user.id)
                authors.push({id:req.user.id,login:user.login})
            }
            const update = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {childThreadsId: [...parentThread.childThreadsId,newThread._id], threadAuthors: authors}},
                { new:true, runValidator:true})
        const threads = await Thread.find({parentThreadId:parentThread._id})
        return res.json({threads:threads,status:200})
        }
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
router.post('/close/:threadId',async(req,res)=>{
    try{
        const thread = await Thread.findById(req.params.threadId)
        const mods = thread.modsThreadId
        if(mods.includes(req.user.id) || req.user.isAdmin){
            if(thread.isClosed){
                const update = await Thread.findByIdAndUpdate(
                    req.params.threadId,
                    {$set: {isClosed:false}},
                    {new:true, runValidators:true}
                )
            }
            else{
                const update = await Thread.findByIdAndUpdate(
                    req.params.threadId,
                    {$set: {isClosed:true}},
                    {new:true, runValidators:true}
                )
            }
        }
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
module.exports = router