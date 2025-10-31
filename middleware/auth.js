export function isAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();

  req.session.lastPage = req.originalUrl;

  if (req.originalUrl.startsWith("/portfolio/api/")) {
    return res.status(401).json({ success: false, error: "Silakan login sebagai admin" });
  }

  return res.redirect("/login");
}