const { Schema, model } = require('mongoose');

// Pole „_id” dodawane jest domyślnie, dlatego pomijamy je w deklaracji
const userSchema = new Schema({
    isAdmin: Boolean,
    login: String,
    email: String,
    registrationDate: Date,
    password: Buffer,
    salt: Buffer,
    modOfThreadsId:[Schema.Types.ObjectId]
});

module.exports = model('User', userSchema);
