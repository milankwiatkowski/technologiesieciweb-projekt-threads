const express = require('express');
const router = express.Router();
const path = require('node:path');
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
router.post('/',async(req,res)=>{
    try{
        const newThread = new Thread({title:req.body.title,subThreadsId:[],modsThreadId:[req.user.id],creatorId:req.user.id})
        await newThread.save()
        const threads = await Thread.find()
        return res.json({threads:threads,status:200})
    }
    catch{
        return res.json({message:"An error occured, we're working on it.",status:400})
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