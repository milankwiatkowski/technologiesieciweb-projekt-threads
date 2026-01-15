const express = require('express');
const router = express.Router();
const path = require('node:path');
const User = require(path.join(process.cwd(), 'models', 'User'));
const Thread = require(path.join(process.cwd(), 'models', 'Thread'));
const Post = require(path.join(process.cwd(), 'models', 'Post'));
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
        console.log(`INFO User ${req.user.login} is searching for threads with tag ${req.params.tag}`)
        const threads = await Thread.find({tags:req.params.tag}).skip((req.params.page-1)*req.params.limit).limit(Number(req.params.limit)).sort({createdAt:-1})
        return res.json({threads:threads,status:200})

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
        const tags = req.body.tags.split(' ')
        const newThread = new Thread({title:req.body.title,parentThreadId:null,childThreadsId:[],subPostsId:[],modsThreadId:[req.user.id],creatorId:req.user.id,threadAuthors:[],blockedId:[],tags:tags,isClosed:false,isHidden:false,rootModId:req.user.id})
        await newThread.save()
        const threads = await Thread.find()
        console.log(`INFO User ${req.user.login} successfully added a root thread ${getTime()}`)
        req.app.get("io").emit("threadAdded",newThread)
        return res.json({threads:threads,status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
}) // OK
router.post('/subthread/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to post a thread ${req.params.threadId} ${getTime()}`)
        const parentThread = await Thread.findById(req.params.threadId)
        const tags = req.body.tags.split(' ')
        if(!parentThread.blockedId.includes(req.user.id) && !parentThread.isClosed && parentThread.modsThreadId.includes(req.user.id)){
            const newThread = new Thread({title:req.body.title,parentThreadId:parentThread._id,childThreadsId:[],subPostsId:[],modsThreadId:[...parentThread.modsThreadId,req.user.id],creatorId:req.user.id,threadAuthors:[],blockedId:[...parentThread.blockedId],tags:[...parentThread.tags],isClosed:false,tags:[...parentThread.tags,...tags],isHidden:false,rootModId:[...parentThread.rootModId,req.user.id]})
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
        console.log(`INFO User ${req.user.login} successfully added a thread ${req.params.threadId} ${getTime()}`)
        return res.json({threads:threads,status:200})
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
        console.log(`INFO User ${req.user.login} successfully blocked user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        return res.json({status:200})
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
        console.log(`INFO User ${req.user.login} successfully blocked user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.post('/:threadId/givemod/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to give mod to user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
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
        console.log(`INFO User ${req.user.login} successfully gave mod to user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.delete('/:threadId/givemod/:userId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to take mod from user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
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
        console.log(`INFO User ${req.user.login} successfully took mod from user ${req.params.userId} in thread ${req.params.threadId} ${getTime()}`)
        return res.json({status:200})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
}) // OK
router.post('/close/:threadId',async(req,res)=>{
    try{
        console.log(`INFO User ${req.user.login} is trying to open/close thread ${req.params.threadId} ${getTime()}`)
        const thread = await Thread.findById(req.params.threadId)
        const mods = thread.modsThreadId
        if(mods.includes(req.user.id) || req.user.isAdmin){
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
        }
        console.log(`INFO User ${req.user.login} successfully changed the OPEN/CLOSE status of thread ${req.params.threadId} ${getTime()}`)
        return res.json({status:200})
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
        if(mods.includes(req.user.id) || req.user.isAdmin){
            if(!thread.isHidden){
                const update = await Thread.findByIdAndUpdate(
                    req.params.threadId,
                    {$set: {isHidden:true}},
                    {new:true, runValidators:true})
                req.app.get('io').emit('threadDeleted',thread)
            }
        }
        console.log(`INFO User ${req.user.login} successfully changed the OPEN/CLOSE status of thread ${req.params.threadId} ${getTime()}`)
        return res.json({status:200})
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
        let title = post.title
        let content = post.content
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
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return req.json({status:400})
    }
}) // OK
router.delete('/delete/:threadId/:postId',async(req,res)=>{
    console.log(`INFO User ${req.user.login} is trying to delete post ${req.params.postId} ${getTime()}`)
    try{
        const parentThread = await Thread.findByIdAndUpdate(
        req.params.threadId,
        { $pull: { subPostsId: req.params.postId } },
        { new:true, runValidators:true})
        const post = await Post.findByIdAndDelete(req.params.postId)
        req.app.get("io").emit("postDeleted",{_id:req.params.postId})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.status(400).json()
    }
}) // OK
router.get('/:threadId/posts/:postId',async(req,res)=>{
    try{
        const post = await Post.findById(req.params.postId)
        return res.status(200).json({post:post})
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({status:400})
    }
})
router.get('/:threadId/posts/:page/:limit',async(req,res)=>{
    try{
        const {page,limit} = req.params
        const posts = await Post.find({parentThreadId:req.params.threadId,isHidden:false}).skip((page-1)*limit).limit(Number(limit)).sort({createdAt:1})
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
        if(!parentThread.blockedId.includes(req.user.id) && !parentThread.isClosed){
            const newPost = new Post({title:req.body.title,content:req.body.content,parentThreadId:parentThread._id,creatorId:req.user.id,creatorLogin:req.user.login,userLikesId:[],userDislikesId:[],likes:0,disLikes:0,isClosed:false,isHidden:false,rootModId:[...parentThread.rootModId,req.user.id]})
            await newPost.save()
            req.app.get("io").emit("postAdded",newPost)
            const authors = parentThread.threadAuthors
            if(!authors.find((x) => x.id.toString() === req.user.id)){
                const user = await User.findById(req.user.id)
                authors.push({id:req.user.id,login:user.login})
            }
            const update = await Thread.findByIdAndUpdate(
                req.params.threadId,
                { $set: {childThreadsId: [...parentThread.childThreadsId,newPost._id],subPostsId:[...parentThread.subPostsId,newPost._id], threadAuthors: authors}},
                { new:true, runValidators:true})
        const threads = await Thread.find({parentThreadId:parentThread._id})
        console.log(`INFO User ${req.user.login} successfully added a thread ${req.params.threadId} ${getTime()}`)
        return res.json({threads:threads,status:200})
        }
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.json({message:"An error occured, we're working on it.",status:400})
    }
}) // OK
router.get('/:threadId/:postId/likes',async(req,res)=>{
    try{
        const {page,limit} = req.params
        console.log(`INFO User ${req.user.login} tried getting post ${req.rapams.postId} likes ${getTime()}`)
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
        const userId = req.user.id;
        console.log(`INFO ${req.user.login} is giving thread a like ${getTime()}`)
        const post = await Post.findById(req.params.postId)
        if(req.body.like === 'like'){
            if(post.userLikesId.find((x) => x.toString() === req.user.id)){
                const newLikesArr = post.userLikesId.filter(x => x.toString() !== userId);
                const updated = await Post.findByIdAndUpdate(
                req.params.postId,
                { $set: {disLikes:post.userDislikesId.length,userDislikesId:post.userDislikesId,likes:newLikesArr.length,userLikesId:newLikesArr}},
                { new: true, runValidators: true })
                req.app.get("io").emit("liked",{disLikes:updated.disLikes,likes:updated.likes})
            }
            else{
                const newDislikes = post.userDislikesId.filter(x => x.toString() !== userId);
                const newLikesArr = [...post.userLikesId, userId];
                const updated = await Post.findByIdAndUpdate(
                req.params.postId,
                { $set: {disLikes:newDislikes.length,userDislikesId:newDislikes,likes:newLikesArr.length,userLikesId:newLikesArr}},
                { new: true, runValidators: true })
                req.app.get("io").emit("liked",{disLikes:updated.disLikes,likes:updated.likes})
            }
        }
        else{
            if(post.userDislikesId.find((x) => x.toString() === req.user.id)){
                const newDislikesArr = post.userDislikesId.filter(x => x.toString() !== userId);
                const updated = await Post.findByIdAndUpdate(
                req.params.postId,
                { $set: {likes:post.likes,userLikesId:post.userLikesId,disLikes: newDislikesArr.length, userDislikesId: newDislikesArr}},
                { new: true, runValidators: true })
                req.app.get("io").emit("disliked",{disLikes:updated.disLikes,likes:updated.likes})
            }
            else{
                const newLikes = post.userLikesId.filter(x => x.toString() !== userId);
                const newDislikesArr = [...post.userDislikesId, userId];
                const updated = await Post.findByIdAndUpdate(
                req.params.postId,
                { $set: {likes:newLikes.length,userLikesId:newLikes,disLikes:newDislikesArr.length,userDislikesId:newDislikesArr}},
                { new: true, runValidators: true })
                req.app.get("io").emit("disliked",{disLikes:updated.disLikes,likes:updated.likes})
            }
        }
        return res.status(200).json()
    }
    catch(err){
        console.log(`ERROR ${err} ${getTime()}`)
        return res.status(400).json()
    }
}) // OK
module.exports = router