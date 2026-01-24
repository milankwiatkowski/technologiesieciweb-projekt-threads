const { Schema, model } = require('mongoose');

// Pole „_id” dodawane jest domyślnie, dlatego pomijamy je w deklaracji
const postSchema = new Schema({
    title: String,
    content:String,
    parentThreadId: {
        type: Schema.Types.ObjectId,
        ref: 'Thread',
        default: null},
    tags:[String],
    refersToPost:Schema.Types.ObjectId,
    creatorId: Schema.Types.ObjectId,
    creatorLogin: String,
    userLikesId:[Schema.Types.ObjectId],
    userDislikesId:[Schema.Types.ObjectId],
    likes:Number,
    disLikes:Number,
    isClosed:Boolean,
    isHidden:Boolean,
    rootModId: [Schema.Types.ObjectId]
},{timestamps:true});

module.exports = model('Post', postSchema);
