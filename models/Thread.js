const { Schema, model } = require('mongoose');

// Pole „_id” dodawane jest domyślnie, dlatego pomijamy je w deklaracji
const threadSchema = new Schema({
    title: String,
    subThreadsId: [Schema.Types.ObjectId],
    modsThreadId: [Schema.Types.ObjectId],
    creatorId: Schema.Types.ObjectId
});

module.exports = model('Thread', threadSchema);
