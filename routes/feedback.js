import express from "express";
import multer from "multer";
import path from "path";
import Feedback from "../models/Feedback.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.post("/", upload.single("foto"), async (req, res) => {
  try {
    const { nama, pesan } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : "";
    const feedback = new Feedback({ nama, pesan, foto });
    await feedback.save();
    res.redirect("/about?msg=Feedback+berhasil+dikirim!&type=success#feedback");
  } catch (err) {
    res.redirect("/about?msg=Gagal+menyimpan+saran.&type=danger#feedback");
  }
});

router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.render("feedback", { feedbacks });
  } catch (err) {
    res.status(500).send("Gagal memuat saran");
  }
});

router.get("/edit/:id", async (req, res) => {
  try {
    const feedbackToEdit = await Feedback.findById(req.params.id);
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });

    res.render("about", {
      skills: [
        { icon: "fa-pen", title: "UI/UX Design", desc: "Membuat desain antarmuka modern & pengalaman pengguna dengan Figma dan Canva." },
        { icon: "fa-laptop-code", title: "Fullstack Development", desc: "Mengembangkan aplikasi web end-to-end dengan HTML, CSS, JS, Laravel & CodeIgniter." },
        { icon: "fa-mobile-screen", title: "Mobile Development", desc: "Membangun aplikasi Android berbasis Flutter dengan performa optimal dan UI responsif." },
        { icon: "fa-video", title: "Editing", desc: "Editing foto & video untuk branding, konten digital, dan media promosi." },
        { icon: "fa-database", title: "Database", desc: "Manajemen data dengan MySQL & HeidiSQL untuk aplikasi berskala besar." }
      ],
      feedbacks,
      feedbackToEdit,
      editMode: true
    });
  } catch (err) {
    res.status(500).send("Gagal memuat data untuk edit");
  }
});

router.post("/update/:id", upload.single("foto"), async (req, res) => {
  try {
    const { nama, pesan } = req.body;
    const updateData = { nama, pesan };
    if (req.file) updateData.foto = `/uploads/${req.file.filename}`;
    await Feedback.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/about?msg=Feedback+berhasil+diupdate!&type=warning#feedback");
  } catch (err) {
    res.redirect("/about?msg=Gagal+memperbarui+feedback.&type=danger#feedback");
  }
});

router.post("/delete/:id", async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.redirect("/about?msg=Feedback+berhasil+dihapus!&type=danger#feedback");
  } catch (err) {
    res.redirect("/about?msg=Gagal+menghapus+feedback.&type=danger#feedback");
  }
});

export default router;
