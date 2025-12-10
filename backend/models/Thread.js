const { Schema, model } = require('mongoose');

// Pole „_id” dodawane jest domyślnie, dlatego pomijamy je w deklaracji
const threadSchema = new Schema({
    title: String,
    content:String,
    parentThreadId: {
    type: Schema.Types.ObjectId,
    default: null},
    childThreadsId: [Schema.Types.ObjectId],
    modsThreadId: [Schema.Types.ObjectId],
    creatorId: Schema.Types.ObjectId,
    threadAuthors: [{id:{type:Schema.Types.ObjectId},login:String}],
    userLikesId:[Schema.Types.ObjectId],
    likes:Number,
    blockedId : [Schema.Types.ObjectId],
    tags:[String],
    isClosed:Boolean,
    isHidden:Boolean,
    rootModId: Schema.Types.ObjectId
},{timestamps:true});

module.exports = model('Thread', threadSchema);
