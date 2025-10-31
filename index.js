import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import Session from "./models/Session.js";
import { isAdmin } from "./middleware/isAdmin.js";

// === Import route dan model ===
import authRoutes from "./routes/auth.js";
import feedbackRoutes from "./routes/feedback.js";
import portfolioRoutes from "./routes/portfolio.js";
import Feedback from "./models/Feedback.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: true }));

// === Konfigurasi session ===
app.use(session({
  secret: "supersecret123", 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/portfolioDB", 
    collectionName: "sessions", 
    ttl: 24 * 60 * 60, 
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

// === Koneksi MongoDB ===
mongoose.connect("mongodb://127.0.0.1:27017/portfolioDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));


mongoose.connection.once("open", async () => {
  console.log("🧹 Menghapus session lama...");
  await Session.deleteMany({});
});

setInterval(async () => {
  const sessions = await Session.find();
  const now = Date.now();

  for (const s of sessions) {
    const sess = s.session;

    if (!sess || !sess.isAdmin) continue;

    const lastPing = sess.lastPing || 0;

    if (now - lastPing > 6000) {
      await Session.deleteOne({ _id: s._id });
      console.log("⛔ Session admin dihapus (tab ditutup)");
    }
  }
}, 5000);

process.on("SIGINT", async () => {
  console.log("\n🧹 Server dimatikan. Menghapus semua session...");
  try {
    await Session.deleteMany({});
    console.log("✅ Semua session berhasil dihapus.");
  } catch (err) {
    console.error("❌ Gagal menghapus session:", err);
  } finally {
    process.exit(0);
  }
});

process.on("SIGTERM", async () => {
  console.log("\n🧹 Server dimatikan (SIGTERM). Menghapus semua session...");
  try {
    await Session.deleteMany({});
    console.log("✅ Semua session berhasil dihapus.");
  } catch (err) {
    console.error("❌ Gagal menghapus session:", err);
  } finally {
    process.exit(0);
  }
});

// === ROUTES ===
app.get("/", (req, res) => {
  const now = new Date();
  const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
  const dateOptions = { weekday: "long", day: "2-digit", month: "long", year: "numeric" };

  res.render("landingpage", {
    currentTime: now.toLocaleTimeString("id-ID", timeOptions),
    currentDate: now.toLocaleDateString("id-ID", dateOptions)
  });
});

app.get("/about", async (req, res) => {
  try {
    const skills = [
      {
        icon: "fa-pen",
        title: "UI/UX Design",
        desc: "Membuat desain antarmuka modern & pengalaman pengguna dengan Figma dan Canva."
      },
      {
        icon: "fa-laptop-code",
        title: "Fullstack Development",
        desc: "Mengembangkan aplikasi web end-to-end dengan HTML, CSS, JS, Laravel & CodeIgniter."
      },
      {
        icon: "fa-mobile-screen",
        title: "Mobile Development",
        desc: "Membangun aplikasi Android berbasis Flutter dengan performa optimal dan UI responsif."
      },
      {
        icon: "fa-video",
        title: "Editing",
        desc: "Editing foto & video untuk branding, konten digital, dan media promosi."
      },
      {
        icon: "fa-database",
        title: "Database",
        desc: "Manajemen data dengan MySQL & HeidiSQL untuk aplikasi berskala besar."
      }
    ];

    const feedbacks = await Feedback.find().sort({ createdAt: -1 });

    res.render("about", {
      skills,
      feedbacks,
      editMode: false,
      feedbackToEdit: null,
      query: req.query || {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal memuat halaman About");
  }
});

app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin || false;
  next();
});

// === ROUTES MODULAR ===
app.use("/", authRoutes);

app.use("/portfolio", portfolioRoutes);

app.use("/feedback", feedbackRoutes);

// === Jalankan Server ===
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});