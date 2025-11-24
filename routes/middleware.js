const passport = require('passport')
const isAuthenticated = passport.authenticate("jwt", { session: false });
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin === true) {
        return next();
    }
    return res.status(403).send("Access denied (Admins only)");
};
module.exports = { isAuthenticated, isAdmin };