const passport = require('passport')
const isAuthenticated = passport.authenticate("jwt", { session: false });
const time = new Date().toLocaleString('pl-PL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});
const isAdmin = (req, res, next) => {
  try{
    if (req.user && req.user.isAdmin === true) {
        return next();
    }
    console.log(`INFO User was denied due to the lack of access ${time}`)
    return res.status(403).send("Access denied (Admins only)");
  }
  catch(err){
    console.log(`ERROR ${err} ${time}`)
  }
};
module.exports = { isAuthenticated, isAdmin };