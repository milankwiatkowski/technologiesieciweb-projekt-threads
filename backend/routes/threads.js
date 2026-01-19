const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const Thread = require(path.join(process.cwd(), 'models', 'Thread'));
const Post = require(path.join(process.cwd(), 'models', 'Post'));
const mongoose = require('mongoose');
const {isAdmin} = require('./middleware')
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
        console.log(`INFO User ${req.user.login} is searching for threads with tag(s) ${req.params.tag}`)
        const tags = req.params.tag.split(' ').map(x => x.toLowerCase()).filter(x => x.length>0).slice(0,1)[0]
        const posts = await Post.find({tags:tags,isHidden:false}).skip((req.params.page-1)*req.params.limit).limit(Number(req.params.limit)).sort({createdAt:-1})
        return res.status(200).json({posts:posts})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.get('/root/:page/:limit',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is requesting root threads ${getTime()}`)
        const {page,limit} = req.params
        const threads = await Thread.find({isHidden:false,parentThreadId:null}).skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
        const filtered = threads.filter((x) => x.parentThreadId === null)
        console.log(`INFO User ${req.user.login} was granted root threads ${getTime()}`)
        return res.json({threads:filtered,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.get('/sub/:threadId/:page/:limit',async(req,res)=>{
    console.log(`INFO User ${req.user.login} is requesting threads from ${req.params.threadId} ${getTime()}`)
    try{
        const {page,limit} = req.params
        const thread = await Thread.findById(req.params.threadId)
        const threads = await Thread.find({parentThreadId:req.params.threadId,isHidden:false}).skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
        console.log(`INFO User ${req.user.login} was granted threads from ${req.params.threadId} ${getTime()}`)
        return res.json({threads:threads,thread:thread,status:200})
    }
    catch (err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400});
    }
})
router.get('/subthread/:threadId',async(req,res)=>{
    console.log(`INFO User ${req.user.login} is requesting thread details from ${req.params.threadId} ${getTime()}`)
    try{
        const thread = await Thread.findById(req.params.threadId)
        console.log(`INFO User ${req.user.login} was granted thread details from ${req.params.threadId} ${getTime()}`)
        return res.json({thread:thread,status:200})
    }
    catch (err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400});
    }
}) // OK
// router.delete('/delete/:threadId',async(req,res)=>{
//     try{
//         console.log(`INFO User ${req.user.login} is trying to delete thread ${req.params.threadId} ${getTime()}`)
//         const threadToBeDeleted = await Thread.findById(req.params.threadId)
//         if(req.user.id === threadToBeDeleted.creatorId.toString()  || req.user.isAdmin){
//             const stack = []
//             async function getChildren(thread){
//                 if(thread.childThreadsId.length === 0){
//                     stack.push(thread._id)
//                 }
//                 else{
//                     for(let i=0;i<thread.childThreadsId.length;i++){
//                         const child = await Thread.findById(thread.childThreadsId[i])
//                         await getChildren(child)
//                         stack.push(child._id)
//                     }
//                 }
//             }
//             await getChildren(threadToBeDeleted)
//             for(let i=0;i<stack.length;i++){
//                 await Thread.findByIdAndDelete(stack[i])
//             }
//             await Thread.findByIdAndDelete(threadToBeDeleted._id)
//             if(threadToBeDeleted.parentThreadId!=null){
//                 const parentThread = await Thread.findById(threadToBeDeleted.parentThreadId)
//                 const filteredChildren = parentThread.childThreadsId.filter((x) => x.toString() !== req.params.threadId)
//                 const update = await Thread.findByIdAndUpdate(
//                     parentThread._id,
//                     { $set: {childThreadsId: filteredChildren}},
//                     { new:true, runValidators:true}
//                 )}
//             }
//             req.app.get("io").emit("threadDeleted",{_id:threadToBeDeleted._id})
//             console.log(`INFO User ${req.user.login} successfully deleted thread ${req.params.threadId} ${getTime()}`)
//             return res.json({status:200})
//     }
//     catch(err){
//         console.log(`ERROR ${err} ${getTime()}`)
//         return res.json({message:'You are not the thread creator nor the administrator!',status:400})
//     }
// })
router.post('/root',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to post a root thread ${getTime()}`)
        const rootMods = await User.find({isRootMod:true}).distinct('_id')
        const user = await User.findById(req.user.id)
        if(user.isAdmin || user.isRootMod){
            const tags = req.body.tags.split(' ').map(x => x.toLowerCase()).filter(x => x.length>0).slice(0,20)
            const newThread = new Thread({
                title:req.body.title,
                parentThreadId:null,
                childThreadsId:[],
                subPostsId:[],
                modsThreadId:[],
                creatorId:user._id,
                threadAuthors:[],
                blockedId:[],
                tags:tags,
                isClosed:false,
                isHidden:false,
                rootModId:rootMods})

            await newThread.save()
            const threads = await Thread.find()
            console.log(`INFO User ${req.user.login} successfully added a root thread ${getTime()}`)
            req.app.get("io").to(`thread:root`).emit("threadAdded",newThread)
            return res.status(200).json({threads:threads})
        }
        else{
            console.log(`INFO User ${req.user.login} didn't add a root thread due to the lack of permission. ${getTime()}`)
            return res.status(401)
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
}) // OK
router.post('/subthread/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to post a subthread ${req.params.threadId} ${getTime()}`)
        const parentThread = await Thread.findById(req.params.threadId)
        const tags = req.body.tags.split(' ').map(x => x.toLowerCase()).filter(x => !parentThread.tags.includes(x)).filter(x => x.length>0).slice(0,20)
        const user = await User.findById(req.user.id)
        const rootModId = Array.from(new Set(
            [...parentThread.rootModId, ...parentThread.modsThreadId].map(x => x.toString()))).map(x => new mongoose.Types.ObjectId(x));
        if(user._id && !parentThread.blockedId.some(x => x.equals(user._id)) && !parentThread.isClosed && (parentThread.modsThreadId.some(x => x.equals(user._id)) || parentThread.rootModId.some(x => x.equals(user._id)))){
            const newThread = new Thread({
                title:req.body.title,
                parentThreadId:parentThread._id,
                childThreadsId:[],
                subPostsId:[],
                modsThreadId:[],
                creatorId:user._id,
                threadAuthors:[],
                blockedId:[...parentThread.blockedId],
                isClosed:false,
                tags:[...parentThread.tags,...tags],
                isHidden:false,
                rootModId: rootModId})
            await newThread.save()
            req.app.get("io").to(`thread:${parentThread._id}`).emit("subthreadAdded",newThread)
            const authors = parentThread.threadAuthors
            if(!authors.find((x) => x.id.toString() === user._id.toString())){
                authors.push({id:user._id,login:user.login})
            }
            const update = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {childThreadsId: [...parentThread.childThreadsId,newThread._id], threadAuthors: authors}},
                { new:true, runValidators:true})
        const threads = await Thread.find({parentThreadId:parentThread._id})
        console.log(`INFO User ${req.user.login} successfully added a thread ${req.params.threadId} ${getTime()}`)
        return res.json({threads:threads,status:200})
        }
        else{
            console.log(`ERROR User ${req.user.id} failed to post a subthread to ${parentThread._id} ${getTime()}`)
            return res.status(400).json({error:"User ${req.user.id} failed to post a subthread to ${parentThread._id}"})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
})
router.post('/:threadId/block/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to block user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        const thread = await Thread.findById(req.params.threadId)
        const user = await User.findById(req.user.id)
        const userToBeBlocked = await User.findById(req.params.userId)
        const blocked = thread.blockedId
        if(
            !blocked.some(x => x.equals(user._id)) && 
            !blocked.some(x => x.equals(userToBeBlocked._id)) && 
            !userToBeBlocked.isAdmin &&
            (user.isAdmin || thread.rootModId.some(x => x.equals(user._id)) || 
            (thread.modsThreadId.some(x => x.equals(user._id)) && 
            !thread.rootModId.some(x => x.equals(userToBeBlocked._id))))){

            const stack = []
            async function getChildren(thread){
            if(!thread) return
            stack.push(thread._id)
            for(let i=0;i<thread.childThreadsId.length;i++){
                const child = await Thread.findById(thread.childThreadsId[i])
                if (!child) continue
                await getChildren(child)
            }
        }
        await getChildren(thread)
        await Thread.updateMany(
            {_id:{$in: stack}},
            { $addToSet: {blockedId: userToBeBlocked._id}}
        )
        for(let i=0;i<stack.length;i++){
            req.app.get('io').to(`thread:${stack[i]}`).emit('blockedUser',req.params.userId)
        }
        console.log(`INFO User ${req.user.login} successfully blocked user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        return res.json({status:200})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.post('/:threadId/unblock/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to unblock user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        const thread = await Thread.findById(req.params.threadId)
        const user = await User.findById(req.user.id)
        const userToBeUnblocked = await User.findById(req.params.userId)
        const blocked = thread.blockedId
        if(
            user && 
            userToBeUnblocked &&
            blocked.some(x => x.equals(userToBeUnblocked._id)) && 
            !blocked.some(x => x.equals(user._id)) && 
            (
                user.isAdmin || 
                user.isRootMod || 
                thread.rootModId.some(x => x.equals(user._id)) || 
                thread.modsThreadId.some(x => x.equals(user._id)))){
        
        const stack = []
        async function getChildren(thread){
            if (!thread) return
            stack.push(thread._id)
            for(let i=0;i<thread.childThreadsId.length;i++){
                const child = await Thread.findById(thread.childThreadsId[i])
                if (!child) continue
                await getChildren(child)
            }
        }
        await getChildren(thread)
        await Thread.updateMany(
            {_id:{$in: stack}},
            { $pull: {blockedId: userToBeUnblocked._id}}
        )
        for(let i=0;i<stack.length;i++){
            req.app.get('io').to(`thread:${stack[i]}`).emit('unblockedUser',req.params.userId)
        }
        console.log(`INFO User ${req.user.login} successfully unblocked user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        return res.json({status:200})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.post('/:threadId/givemod/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to give mod to user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        const user = await User.findById(req.user.id)
        if(req.params.threadId!='root'){
        const thread = await Thread.findById(req.params.threadId)
        if(thread && (user._id != req.params.userId && 
                        thread.creatorId !== req.params.userId && 
                        (user.isRootMod || user.isAdmin) ||
                        (thread.rootModId.some(x => x.equals(user._id)) && ((thread.rootModId.some(x => x.equals(req.params.userId)) || thread.modsThreadId.some(x => x.equals(req.params.userId))))) ||
                        (thread.modsThreadId.some(x => x.equals(user._id)) && !thread.rootThreadId.some(x => x === req.params.userId)))){
            const stack = []
            async function getChildren(stackThread){
                if (!stackThread) return
                if(stackThread.childThreadsId.length === 0){
                    stack.push(stackThread._id)
                }
                else{
                    for(let i=0;i<stackThread.childThreadsId.length;i++){
                        const child = await Thread.findById(stackThread.childThreadsId[i])
                        if(!child) continue
                        await getChildren(child)
                        stack.push(child._id)
                    }
                }
            }
            await getChildren(thread)
            for(let i=0;i<stack.length;i++){
                await Thread.findByIdAndUpdate(
                    stack[i],
                    { $addToSet: {rootModId:req.params.userId}}
                )
            }
            await Thread.findByIdAndUpdate(
                thread._id,
                { $addToSet: {modsThreadId:req.params.userId}}
            )
            console.log(`INFO User ${req.user.login} successfully gave mod to user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
            return res.json({status:200})
        }
    }
        else if(req.params.threadId==='root' && (user.isRootMod || user.isAdmin)){
            await User.findByIdAndUpdate(
                req.params.userId,
                { $set: {isRootMod:true}}
            )
            console.log(`INFO User ${req.user.login} successfully gave mod to user ${req.params.userId} in root ${getTime()}`)
            return res.status(200).json()
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.delete('/:threadId/givemod/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to take mod from user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        const user = await User.findById(req.user.id)
        const user2 = await User.findById(req.params.userId)
        if(req.params.threadId!=='root'){
        const thread = await Thread.findById(req.params.threadId)
        if(thread){
            const mods = thread.modsThreadId
            const rootMods = thread.rootModId
            if(
                user._id.toString() !== user2._id.toString() &&  
                thread.creatorId.toString() !== user2._id.toString() && 
                (
                    user.isRootMod ||
                    user.isAdmin ||
                    rootMods.some(x => x.equals(user._id)) || 
                    (mods.some(x => x.equals(user._id)) && mods.some(x => x.equals(user2._id))))){

                const stack = []
                async function getChildren(stackThread){
                    if (!stackThread) return
                    if(stackThread.creatorId.toString() === user2._id.toString()){
                        return
                    }
                    stack.push(stackThread._id)
                    for(let i=0;i<stackThread.childThreadsId.length;i++){
                        const child = await Thread.findById(stackThread.childThreadsId[i])
                        if(!child) continue
                        await getChildren(child)
                    }
                }
                await getChildren(thread)
                for(let i=0;i<stack.length;i++){
                    await Thread.findByIdAndUpdate(
                        stack[i],
                        { $pull: {modsThreadId:req.params.userId,rootModId:req.params.userId}}
                    )
                }
        
            console.log(`INFO User ${req.user.login} successfully took mod from user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
            return res.status(200).json({message:'ok'})
        }
        else{
            console.log(`INFO User ${req.user.login} tried to take mod from user ${req.params.userId} in thread ${req.params.threadId} but had no permission. ${getTime()}`)
            return res.status(403).json({error:'error'})
        }}
        }
        else if(req.params.threadId==='root' && (user.isRootMod || user.isAdmin)){
            await User.findByIdAndUpdate(
                req.params.userId,
                { $set: {isRootMod:false}}
            )
            console.log(`INFO User ${req.user.login} successfully took mod from user ${req.params.userId} in root ${getTime()}`)
            return res.status(200).json()
        }
        else{
            console.log(`ERROR User ${req.user.login} tried to take mod from user ${req.params.userId} but thread ${req.params.threadId} wasn't found. ${getTime()}`)
            return res.status(404).json({error:'error'})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.status(400).json({error:'error'})
    }
}) // OK
router.post('/close/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to open/close thread ${req.params.threadId} ${getTime()}`)
        const thread = await Thread.findById(req.params.threadId)
        const mods = thread.modsThreadId
        const rootMods = thread.rootModId
        const user = await User.findById(req.user.id)
        if(mods.includes(user._id) || rootMods.includes(user._id) || user.isAdmin){
            if(thread.isClosed){
                console.log(`INFO User ${req.user.login} is trying to open thread ${req.params.threadId} ${getTime()}`)
                const update = await Thread.findByIdAndUpdate(
                    req.params.threadId,
                    {$set: {isClosed:false}},
                    {new:true, runValidators:true}
                )
            }
            else{
                console.log(`INFO User ${req.user.login} is trying to close thread ${req.params.threadId} ${getTime()}`)
                const update = await Thread.findByIdAndUpdate(
                    req.params.threadId,
                    {$set: {isClosed:true}},
                    {new:true, runValidators:true}
                )
            }
            console.log(`INFO User ${req.user.login} successfully changed the OPEN/CLOSE status of thread ${req.params.threadId} ${getTime()}`)
            return res.json({status:200})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.post('/hide/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to hide thread ${req.params.threadId} ${getTime()}`)
        const thread = await Thread.findById(req.params.threadId)
        const mods = thread.modsThreadId
        const rootMods = thread.rootModId
        const user = await User.findById(req.user.id)
        if(mods.includes(user._id) || rootMods.includes(user._id) || user.isAdmin){
            if(!thread.isHidden){
                const stack = []
                async function getChildren(thread){
                    if (!thread) return
                    if(thread.childThreadsId.length === 0){
                        stack.push(thread._id)
                    }
                    else{
                        for(let i=0;i<thread.childThreadsId.length;i++){
                            const child = await Thread.findById(thread.childThreadsId[i])
                            if (!child) continue
                            await getChildren(child)
                            stack.push(child._id)
                        }
                    }
                }
                await getChildren(thread)
                stack.push(thread._id)
                for(let i=0;i<stack.length;i++){
                    const updated = await Thread.findByIdAndUpdate(stack[i],
                        { $set: {isHidden:true}},
                        { new:true, runValidators:true})
                    if(updated.parentThreadId !== null){
                        console.log(updated.parentThreadId)
                        req.app.get('io').to(`thread:${updated.parentThreadId}`).emit('threadDeleted',updated)
                    }
                    else{
                        console.log(updated.parentThreadId)
                        req.app.get('io').to(`thread:root`).emit('threadDeleted',thread)
                    }
                }
                console.log(`INFO User ${req.user.login} successfully changed the HIDDEN status of thread ${req.params.threadId} ${getTime()}`)
                return res.json({status:200})
            }
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK

router.post('/edit/:threadId/:postId',async(req,res)=>{
    try{
        console.log(`INFO user ${req.user.login} is editing post ${req.params.postId}`)
        const post = await Post.findById(req.params.postId)
        const parentThread = await Thread.findById(req.params.threadId)
        const user = await User.findById(req.user.id)
        let title = post.title
        let content = post.content
        if(post.creatorId.equals(user._id) && !parentThread.isClosed){
        if(req.body.title.length>0){
            title = req.body.title
        }
        if(req.body.content.length>0){
            content = req.body.content
        }
        const updated = await Post.findByIdAndUpdate(req.params.postId,
            { $set: {title:title,content:content}},
            { new:true, runValidators:true})
        console.log(`INFO User ${req.user.id} successfully updated post ${req.params.postId} ${getTime()}`)
        req.app.get('io').emit('updated',updated)
        return res.json({status:200})
        }
        else{
            return res.status(400).json({message:'No permissions'})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return req.json({status:400})
    }
}) // OK
// router.delete('/delete/:threadId/:postId',async(req,res)=>{
//     console.log(`INFO User ${req.user.login} is trying to delete post ${req.params.postId} ${getTime()}`)
//     try{
//         const parentThread = await Thread.findByIdAndUpdate(
//         req.params.threadId,
//         { $pull: { subPostsId: req.params.postId } },
//         { new:true, runValidators:true})
//         const post = await Post.findByIdAndDelete(req.params.postId)
//         req.app.get("io").to(`thread:${parentThread._id}`).emit("postDeleted",{_id:req.params.postId})
//     }
//     catch(err){
//         console.log(`ERROR ${err} ${getTime()}`)
//         return res.status(400).json()
//     }
// }) // OK
router.get('/:threadId/replies/:postId/:page/:limit',async(req,res)=>{
    console.log(`INFO User ${req.user.login} wants replies from ${req.params.postId} ${getTime()}`)
    try{
        const {page,limit} = req.params
        const post = await Post.findById(req.params.postId)
        const replies = await Post.find({isHidden:false,refersToPost:post._id}).skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
        console.log(`INFO User ${req.user.login} was granted replies from ${req.params.postId} ${getTime()}`)
        return res.status(200).json({replies:replies})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
})
router.get('/:threadId/posts/postDetails/:postId',async(req,res)=>{
    console.log(`INFO User ${req.user.login} wants post details ${req.params.postId} ${getTime()}`)
    try{
        const post = await Post.findOne({_id:req.params.postId,isHidden:false})
        console.log(`INFO User ${req.user.login} was granted post details ${req.params.postId} ${getTime()}`)
        return res.json({post:post,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.status(400).json({error:err})
    }
})
router.get('/hidden/posts/:page/:limit',isAdmin,async(req,res)=>{
    console.log(`INFO User ${req.user.login} is trying to get hidden posts ${getTime()}`)
    try{
        const user = await User.findById(req.user.id)
        if(user && user.isAdmin){
            const {page,limit} = req.params
            const posts = await Post.find({isHidden:true}).skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
            console.log(`INFO User ${req.user.login} was granted hidden posts ${getTime()}`)
            return res.status(200).json({posts:posts})
        }
        else{
            console.log(`INFO User ${req.user.login} wasn't granted hidden posts due to the lack of permissions. ${getTime()}`)
            return res.json({status:400})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
})
router.get('/:threadId/posts/:page/:limit',async(req,res)=>{
    console.log(`INFO User ${req.user.login} wants posts from ${req.params.threadId} ${getTime()}`)
    try{
        const {page,limit} = req.params
        const posts = await Post.find({parentThreadId:req.params.threadId,isHidden:false,refersToPost:null}).skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
        console.log(`INFO User ${req.user.login} was granted posts from ${req.params.threadId} ${getTime()}`)
        return res.json({posts:posts,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.status(400).json({error:err})
    }
}) // OK
router.post(`/:threadId/post`,async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to post a post to subthread ${req.params.threadId} ${getTime()}`)
        const parentThread = await Thread.findById(req.params.threadId)
        const user = await User.findById(req.user.id)
        if(user._id && !parentThread.blockedId.includes(user._id) && !parentThread.isClosed && !parentThread.isClosed){
            const parentTags = parentThread.tags
            const tags = req.body.tags.split(' ').map(x => x.toLowerCase()).filter(x => x.length>0).filter(x => parentTags.includes(x)).slice(0,20)
            const newPost = new Post({title:req.body.title,
                content:req.body.content,
                parentThreadId:parentThread._id,
                tags:tags,
                refersToPost:null,
                creatorId:user._id,
                creatorLogin:user.login,
                userLikesId:[],
                userDislikesId:[],
                likes:0,
                disLikes:0,
                isClosed:false,
                isHidden:false,
                rootModId:[...parentThread.rootModId]})
            await newPost.save()
            req.app.get("io").to(`thread:${parentThread._id}`).emit("postAdded",newPost)
            const authors = parentThread.threadAuthors
            if(!authors.find((x) => x.id.toString()===user._id.toString())){
                authors.push({id:user._id,login:user.login})
            }
            const update = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {subPostsId:[...parentThread.subPostsId,newPost._id], threadAuthors: authors}},
                { new:true, runValidators:true})
        console.log(`INFO User ${req.user.login} successfully added a thread ${req.params.threadId} ${getTime()}`)
        return res.status(200).json({post:newPost})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
}) // OK
router.post('/:threadId/reply/:postId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to post a reply to post ${req.params.postId} ${getTime()}`)
        const parentThread = await Thread.findById(req.params.threadId)
        const replyPost = await Post.findById(req.params.postId)
        const user = await User.findById(req.user.id)
        if(user && !parentThread.blockedId.includes(user._id) && !parentThread.isClosed && !replyPost.isClosed){
            const parentTags = parentThread.tags
            const tags = req.body.tags.split(' ').map(x => x.toLowerCase()).filter(x => x.length>0).filter(x => parentTags.includes(x)).slice(0,20)
            const newPost = new Post({title:req.body.title,
                content:req.body.content,
                parentThreadId:parentThread._id,
                tags:tags,
                refersToPost:req.params.postId,
                creatorId:user._id,
                creatorLogin:user.login,
                userLikesId:[],
                userDislikesId:[],
                likes:0,
                disLikes:0,
                isClosed:false,
                isHidden:false,
                rootModId:[...parentThread.rootModId]})
            await newPost.save()
            req.app.get("io").to(`post:${replyPost._id}`).emit("newReply",newPost)
            const authors = parentThread.threadAuthors
            if(!authors.find(x => x.id.toString() === user._id.toString())){
                authors.push({id:user._id,login:user.login})
            }
            const update = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {subPostsId:[...parentThread.subPostsId,newPost._id], threadAuthors: authors}},
                { new:true, runValidators:true})
        console.log(`INFO User ${req.user.login} successfully added a reply to post ${req.params.postId} ${getTime()}`)
        return res.status(200).json({message:'ok'})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
})
router.get('/:threadId/:postId/likes',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} tried getting post ${req.params.postId} likes ${getTime()}`)
        const post = await Post.findById(req.params.postId)
        return res.json({likes:post.likes,disLikes:post.disLikes,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.post('/:threadId/:postId/likes',async(req,res)=>{
    try{
        console.log(`INFO ${req.user.login} is giving thread a (dis)like ${getTime()}`)
        const user = await User.findById(req.user.id)
        const post = await Post.findById(req.params.postId)
        if(user && post){
            if(req.body.like === 'like'){
                if(post.userLikesId.find((x) => x.equals(user._id))){
                    const updated = await Post.findByIdAndUpdate(
                        req.params.postId,
                        { $pull: {userLikesId:user._id}},
                        { new: true, runValidators: true })
                    req.app.get("io").to(`post:${post._id}`).emit("liked",{disLikes:updated.userDislikesId.length,likes:updated.userLikesId.length})
                }
                else{
                    const updated = await Post.findByIdAndUpdate(
                        req.params.postId,
                        { 
                            $addToSet: {userLikesId:user._id},
                            $pull: {userDislikesId:user._id}
                        },
                        { new: true, runValidators: true })
                    req.app.get("io").to(`post:${post._id}`).emit("liked",{disLikes:updated.userDislikesId.length,likes:updated.userLikesId.length})
                }
            }
            else{
                if(post.userDislikesId.find(x => x.equals(user._id))){
                    const updated = await Post.findByIdAndUpdate(
                    req.params.postId,
                    { $pull: {userDislikesId:user._id}},
                    { new: true, runValidators: true })
                    req.app.get("io").to(`post:${post._id}`).emit("disliked",{disLikes:updated.userDislikesId.length,likes:updated.userLikesId.length})
                }
                else{
                    const updated = await Post.findByIdAndUpdate(
                    req.params.postId,
                        { 
                            $addToSet: {userDislikesId:user._id},
                            $pull: {userLikesId:user._id}
                        },
                    { new: true, runValidators: true })
                    req.app.get("io").to(`post:${post._id}`).emit("disliked",{disLikes:updated.userDislikesId.length,likes:updated.userLikesId.length})
                }
            }
            return res.status(200).json({message:'ok'})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.status(400).json()
    }
}) // OK
router.post('/post/hide/:threadId/:postId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to hide post ${req.params.postId} ${getTime()}`)
        const post = await Post.findById(req.params.postId)
        const thread = await Thread.findById(req.params.threadId)
        const user = await User.findById(req.user.id)
        const mods = thread.modsThreadId
        const rootMods = thread.rootModId
        if(mods.includes(user._id) || rootMods.includes(user._id) || req.user.isAdmin || (post.creatorId && user._id.equals(post.creatorId))){
            if(!post.isHidden){
                const update = await Post.findByIdAndUpdate(
                    req.params.postId,
                    {$set: {isHidden:true}},
                    {new:true, runValidators:true})
                req.app.get('io').to(`thread:${thread._id}`).emit('postDeleted',post)
                if(post.refersToPost !== null){
                    const moveReference = await Post.updateMany(
                        {refersToPost:req.params.postId},
                        {$set:{refersToPost:req.body.postId}})
                    req.app.get('io').to(`post:${req.body.postId}`).emit('postDeleted',post)
                }
                else{
                    const moveReference = await Post.updateMany(
                        {refersToPost:req.params.postId},
                        {$set:{refersToPost:null}})
                    req.app.get('io').to(`post:${req.body.postId}`).emit('postDeleted',post)
                }
                console.log(`INFO User ${req.user.login} successfully changed the OPEN/CLOSE status of post ${req.params.postId} ${getTime()}`)
                return res.json({status:200})
            }
        }
        else{
            console.log(`INFO User ${req.user.login} tried to the change the OPEN/CLOSE status of post ${req.params.postId} but failed ${getTime()}`)
            return res.json({status:400})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
})
module.exports = router