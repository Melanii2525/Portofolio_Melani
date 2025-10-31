export function isAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  
  return res.redirect("/login");
}  