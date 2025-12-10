const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const Thread = require(path.join(process.cwd(), 'models', 'Thread'));
const time = new Date().toLocaleString('pl-PL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
// router.post('/deletemany',async(req,res)=>{
//     try{
//         await Thread.deleteMany()
//         console.log("INFO Removed all threads")
//         return res.json({message:"Deleted all threads"})
//     }
//     catch(err){
//         console.log(err)
//         return res.json({message:err})
//     }
// })
router.get('/find/:tag/:page/:limit',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is searching for threads with tag ${req.params.tag}`)
        const threads = await Thread.find({tags:req.params.tag}).skip((req.params.page-1)*req.params.limit).limit(Number(req.params.limit)).sort({createdAt:-1})
        return res.json({threads:threads,status:200})

    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.get('/:threadId/likes',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} tried getting thread likes ${time}`)
        const thread = await Thread.findById(req.params.threadId)
        return res.json({likes:thread.likes,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.post('/:threadId/likes',async(req,res)=>{
    try{
        console.log(`INFO ${req.user.login} is giving thread a like ${time}`)
        const thread = await Thread.findById(req.params.threadId)
        const likes = thread.likes
        if(thread.userLikesId.find((x) => x.toString() === req.user.id)){
            const updated = await Thread.findByIdAndUpdate(
            req.params.threadId,
            { $set: {likes: thread.likes-1, userLikesId: thread.userLikesId.filter((x) => x.toString() !== req.user.id)}},
            { new: true, runValidators: true })
            req.app.get("io").emit("liked",{likes:updated.likes})
        }
        else{
            const updated = await Thread.findByIdAndUpdate(
            req.params.threadId,
            { $set: {likes: thread.likes+1, userLikesId: [...thread.userLikesId,req.user.id]}},
            { new: true, runValidators: true })
            req.app.get("io").emit("liked",{likes:updated.likes})
        }
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.post('/edit/:threadId',async(req,res)=>{
    try{
        console.log(`INFO user ${req.user.login} is editing thread ${req.params.threadId}`)
        const thread = await Thread.findById(req.params.threadId)
        console.log(req.body)
        let title = thread.title
        let content = thread.content
        let tags = thread.tags
        if(req.body.title.length>0){
            title = req.body.title
        }
        if(req.body.content.length>0){
            content = req.body.content
        }
        if(req.body.tags.length>0){
            tags = req.body.tags.split(' ')
        }
        const updated = await Thread.findByIdAndUpdate(req.params.threadId,
            { $set: {title:title,content:content,tags:tags}},
            { new:true, runValidators:true})
        console.log(`INFO User ${req.user.id} successfully updated thread ${req.params.threadId} ${time}`)
        req.app.get('io').emit('updated',updated)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return req.json({status:400})
    }
})
router.get('/root/:page/:limit',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is requesting root threads ${time}`)
        // await Thread.deleteMany()
        const {page,limit} = req.params
        const threads = await Thread.find({isHidden:false,parentThreadId:null}).skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
        const filtered = threads.filter((x) => x.parentThreadId === null)
        console.log(`INFO User ${req.user.login} was granted root threads ${time}`)
        return res.json({threads:filtered,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.get('/sub/:threadId/:page/:limit',async(req,res)=>{
    console.log(`INFO User ${req.user.login} is requesting threads from ${req.params.threadId} ${time}`)
    try{
        const {page,limit} = req.params
        const thread = await Thread.findById(req.params.threadId)
        const threads = await Thread.find({parentThreadId:req.params.threadId,isHidden:false}).skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
        console.log(`INFO User ${req.user.login} was granted threads from ${req.params.threadId} ${time}`)
        return res.json({threads:threads,thread:thread,status:200})
    }
    catch (err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400});
    }
})
router.delete('/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to delete thread ${req.params.threadId} ${time}`)
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
            req.app.get("io").emit("threadDeleted",{_id:threadToBeDeleted._id})
            console.log(`INFO User ${req.user.login} successfully deleted thread ${req.params.threadId} ${time}`)
            return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({message:'You are not the thread creator nor the administrator!',status:400})
    }
})
router.post('/root',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to post a root thread ${time}`)
        const tags = req.body.tags.split(' ')
        const newThread = new Thread({title:req.body.title,content:req.body.content,parentThreadId:null,childThreadsId:[],modsThreadId:[req.user.id],creatorId:req.user.id,threadAuthors:[],userLikesId:[],likes:0,blockedId:[],isClosed:false,tags:tags,isHidden:false,rootModId:req.user.id})
        await newThread.save()
        const threads = await Thread.find()
        console.log(`INFO User ${req.user.login} successfully added a root thread ${time}`)
        req.app.get("io").emit("threadAdded",newThread)
        return res.json({threads:threads,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
})
router.post('/subthread/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to post a thread ${req.params.threadId} ${time}`)
        const parentThread = await Thread.findById(req.params.threadId)
        const tags = req.body.tags.split(' ')
        if(!parentThread.blockedId.includes(req.user.id) && !parentThread.isClosed){
            console.log("DODAJE SUBTHREAD")
            const newThread = new Thread({title:req.body.title,content:req.body.content,parentThreadId:parentThread._id,childThreadsId:[],modsThreadId:[...parentThread.modsThreadId,req.user.id],creatorId:req.user.id,threadAuthors:[],userLikesId:[],likes:0,blockedId:[...parentThread.blockedId],tags:[...parentThread.tags],isClosed:false,tags:[...parentThread.tags,...tags],isHidden:false,rootModId:parentThread.rootModId})
            await newThread.save()
            req.app.get("io").emit("subthreadAdded",newThread)
            const authors = parentThread.threadAuthors
            if(!authors.find((x) => x.id.toString() === req.user.id)){
                const user = await User.findById(req.user.id)
                authors.push({id:req.user.id,login:user.login})
            }
            const update = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {childThreadsId: [...parentThread.childThreadsId,newThread._id], threadAuthors: authors}},
                { new:true, runValidators:true})
        const threads = await Thread.find({parentThreadId:parentThread._id})
        console.log(`INFO User ${req.user.login} successfully added a thread ${req.params.threadId} ${time}`)
        return res.json({threads:threads,status:200})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
})
router.post('/:threadId/block/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to block user ${req.params.userId} in thread ${req.params.threadId} ${time}`)
        const thread = await Thread.findById(req.params.threadId)
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
        await getChildren(thread)
        for(let i=0;i<stack.length;i++){
            await Thread.findByIdAndUpdate(stack[i],
                { $addToSet: {blockedId:req.params.userId}},
                { new:true, runValidators:true})
        }

        const blocked = thread.blockedId
        if(!blocked.includes(req.params.userId)){
            const updated = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {blockedId:[...blocked,req.params.userId]}},
                { new:true, runValidators:true}
            )
        }
        req.app.get('io').emit('blockedUser',req.params.userId)
        console.log(`INFO User ${req.user.login} successfully blocked user ${req.params.userId} in thread ${req.params.threadId} ${time}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.post('/:threadId/unblock/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to unblock user ${req.params.userId} in thread ${req.params.threadId} ${time}`)
        const thread = await Thread.findById(req.params.threadId)
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
        await getChildren(thread)
        for(let i=0;i<stack.length;i++){
            const stackThread = await Thread.findById(stack[i])
            const newBlocked = stackThread.blockedId.filter((x) => x !== req.params.userId)
            const updated = await Thread.findByIdAndUpdate(stack[i],
                { $set: {blockedId:newBlocked}},
                { new:true, runValidators:true})}
        req.app.get('io').emit('unblockedUser',req.params.userId)
        console.log(`INFO User ${req.user.login} successfully blocked user ${req.params.userId} in thread ${req.params.threadId} ${time}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.post('/:threadId/givemod/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to give mod to user ${req.params.userId} in thread ${req.params.threadId} ${time}`)
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
        console.log(`INFO User ${req.user.login} successfully gave mod to user ${req.params.userId} in thread ${req.params.threadId} ${time}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.delete('/:threadId/givemod/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to take mod from user ${req.params.userId} in thread ${req.params.threadId} ${time}`)
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
        console.log(`INFO User ${req.user.login} successfully took mod from user ${req.params.userId} in thread ${req.params.threadId} ${time}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.post('/close/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to open/close thread ${req.params.threadId} ${time}`)
        const thread = await Thread.findById(req.params.threadId)
        const mods = thread.modsThreadId
        if(mods.includes(req.user.id) || req.user.isAdmin){
            if(thread.isClosed){
                console.log(`INFO User ${req.user.login} is trying to open thread ${req.params.threadId} ${time}`)
                const update = await Thread.findByIdAndUpdate(
                    req.params.threadId,
                    {$set: {isClosed:false}},
                    {new:true, runValidators:true}
                )
            }
            else{
                console.log(`INFO User ${req.user.login} is trying to close thread ${req.params.threadId} ${time}`)
                const update = await Thread.findByIdAndUpdate(
                    req.params.threadId,
                    {$set: {isClosed:true}},
                    {new:true, runValidators:true}
                )
            }
        }
        console.log(`INFO User ${req.user.login} successfully changed the OPEN/CLOSE status of thread ${req.params.threadId} ${time}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
router.post('/hide/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to hide thread ${req.params.threadId} ${time}`)
        const thread = await Thread.findById(req.params.threadId)
        const mods = thread.modsThreadId
        if(mods.includes(req.user.id) || req.user.isAdmin){
            if(!thread.isHidden){
                const update = await Thread.findByIdAndUpdate(
                    req.params.threadId,
                    {$set: {isHidden:true}},
                    {new:true, runValidators:true})
                req.app.get('io').emit('threadDeleted',thread)
            }
        }
        console.log(`INFO User ${req.user.login} successfully changed the OPEN/CLOSE status of thread ${req.params.threadId} ${time}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${time}`)
        return res.json({status:400})
    }
})
module.exports = router