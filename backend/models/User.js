const { Schema, model } = require('mongoose');

// Pole „_id” dodawane jest domyślnie, dlatego pomijamy je w deklaracji
const userSchema = new Schema({
    isAdmin: Boolean,
    login: String,
    registrationDate: String,
    isRootMod:Boolean,
    password: Buffer,
    salt: Buffer,
    modOfThreadsId:[Schema.Types.ObjectId],
    isAcceptedByAdmin: Boolean
});

module.exports = model('User', userSchema);
