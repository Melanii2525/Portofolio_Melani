import express from "express";
const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.isAdmin && req.method === "GET" &&
      !req.path.startsWith("/login") &&
      !req.path.startsWith("/logout") &&
      !req.path.startsWith("/heartbeat")) {
    req.session.lastPage = req.originalUrl;
  }
  next();
});

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "12345") {
    req.session.isAdmin = true;
    req.session.lastPing = Date.now();

    req.session.save(() => {
      res.redirect(req.session.lastPage || "/");
    });
  } else {
    res.render("login", { error: "Username atau password salah!" });
  }
});

router.post("/heartbeat", (req, res) => {
  if (req.session && req.session.isAdmin) {
    req.session.lastPing = Date.now();
    return req.session.save(() => res.status(200).end());
  }
  res.status(200).end();
});

router.all("/logout", (req, res) => {
  console.log("🚪 Logout triggered");

  req.session.destroy(() => {
    if (req.method === "POST" ||
        req.headers["content-type"] === "text/plain") {
      return res.status(200).end();
    }

    res.redirect("/");
  });
});

export default router;