const express = require('express');
const router = express.Router();
const path = require('node:path');
const Thread = require(path.join(process.cwd(), 'models', 'Thread'));
const Subthread = require(path.join(process.cwd(), 'models', 'Subthread'));

router.get('/',async(req,res)=>{
    try{
        const threads = await Thread.find()
        res.render('mainPage',{threads:threads})
    }
    catch{
        res.send({"message":"An error occured, we're working on it."})
    }
})
router.post('/',async(req,res)=>{
    try{
        const newThread = new Thread({title:req.body.title,subThreadsId:[],modsThreadId:[req.user.id],creatorId:[req.user.id]})
        await newThread.save()
        res.redirect('/threads')
    }
    catch{
        res.send({"message":"An error occured, we're working on it."})
    }
})
router.post('/:threadId',async(req,res)=>{
    try{
        const threadToBeDeleted = await Thread.findById(req.params.threadId)
        if(req.user.id === threadToBeDeleted.creatorId  || req.user.isAdmin){
            threadToBeDeleted.subThreadsId.map(async (x)=>{
                await Subthread.findByIdAndDelete(x)
            })
            await Thread.findByIdAndDelete(req.params.threadId)
            res.redirect(`/threads/`)
        }
    }
    catch{
        res.send({'message':'You are not the thread creator nor the administrator!'})
    }
})
module.exports = router