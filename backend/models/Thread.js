const { Schema, model, SchemaType } = require('mongoose');

// Pole „_id” dodawane jest domyślnie, dlatego pomijamy je w deklaracji
const threadSchema = new Schema({
    title: String,
    subThreadsId: [Schema.Types.ObjectId],
    modsThreadId: [Schema.Types.ObjectId],
    creatorId: Schema.Types.ObjectId,
    threadAuthors: [{id:{type:Schema.Types.ObjectId},login:String}],
    blockedId : [Schema.Types.ObjectId]
});

module.exports = model('Thread', threadSchema);
