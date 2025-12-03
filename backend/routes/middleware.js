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
    if (req.user && req.user.isAdmin === true) {
        return next();
    }
    else{
      console.log(`INFO User was denied due to the lack of access ${time}`)
      return res.status(403).send("Access denied (Admins only)");
    }
};
const isAcceptedByAdmin = (req,res,next) =>{
    if(req.user && req.user.isAcceptedByAdmin===true){
      return next()
    }
    else{
      console.log(`ERROR ${err} ${time}`)
      return res.status(403).send("You are not an accepted user!");
    }
}
module.exports = { isAuthenticated, isAdmin, isAcceptedByAdmin };