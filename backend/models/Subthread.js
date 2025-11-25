const { Schema, model, Types } = require('mongoose');

// Pole „_id” dodawane jest domyślnie, dlatego pomijamy je w deklaracji
const subthreadSchema = new Schema({
    title: String,
    content: String,
    mainThreadId: Schema.Types.ObjectId,
    subthreadCreatorId: Schema.Types.ObjectId,
    userLikesId:[Schema.Types.ObjectId],
    likes:Number,
});

module.exports = model('Subthread', subthreadSchema);
