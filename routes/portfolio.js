import express from "express";
import Project from "../models/Project.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import { isAdmin } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.get("/api/project/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
});

router.delete("/api/project/:id", isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return res.status(404).json({ success: false, error: "Proyek tidak ditemukan" });
    }

    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (project.images && project.images.length) {
        for (const img of project.images) {
          if (!img || !img.filename) continue;
          const filePath = path.join(uploadsDir, img.filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
    } catch (errFile) {
      console.error("Gagal hapus file:", errFile);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Terjadi kesalahan saat menghapus proyek" });
  }
});

router.post("/api/:month", isAdmin, upload.array("images"), async (req, res) => {
  try {
    const { title, description, imageTitles, imageDescriptions } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: "Judul dan deskripsi wajib diisi" });
    }

    const titlesArray = imageTitles ? (Array.isArray(imageTitles) ? imageTitles : [imageTitles]) : [];
    const descriptionsArray = imageDescriptions ? (Array.isArray(imageDescriptions) ? imageDescriptions : [imageDescriptions]) : [];
    const imagesArray = (req.files || []).map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    const minLength = Math.min(imagesArray.length, titlesArray.length, descriptionsArray.length);
    if (minLength === 0) {
      return res.status(400).json({ success: false, error: "Minimal satu gambar dengan judul & deskripsi diperlukan" });
    }

    const newProject = await Project.create({
      month: req.params.month,
      title,
      description,
      images: imagesArray,
      imageTitles: titlesArray,
      imageDescriptions: descriptionsArray
    });

    res.json({ success: true, project: newProject });
  } catch (err) {
    console.error("❌ Error create project:", err);
    res.status(500).json({ success: false, error: err.message || "Terjadi kesalahan saat menyimpan proyek." });
  }
});

router.get("/:month/new", isAdmin, (req, res) => {
  const month = req.params.month;
  res.render("portfolio-new", { month });
});

router.post("/:month", isAdmin, upload.array("images"), async (req, res) => {
  try {
    const { title, description, imageTitles, imageDescriptions } = req.body;

    const titlesArray = Array.isArray(imageTitles) ? imageTitles : [imageTitles];
    const descriptionsArray = Array.isArray(imageDescriptions) ? imageDescriptions : [imageDescriptions];
    const imagesArray = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    const minLength = Math.min(imagesArray.length, titlesArray.length, descriptionsArray.length);
    const syncedImages = imagesArray.slice(0, minLength);
    const syncedTitles = titlesArray.slice(0, minLength);
    const syncedDescriptions = descriptionsArray.slice(0, minLength);

    await Project.create({
      month: req.params.month,
      title,
      description,
      images: syncedImages,
      imageTitles: syncedTitles,
      imageDescriptions: syncedDescriptions
    });

    res.redirect(`/portfolio/${req.params.month}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan saat menyimpan proyek.");
  }
});

router.post("/:month/:id", isAdmin, upload.array("images"), async (req, res) => {
  try {
    const { title, description, imageTitles, imageDescriptions, oldFilenames } = req.body;
    const { id } = req.params;

    const titlesArray = Array.isArray(imageTitles) ? imageTitles : [imageTitles];
    const descriptionsArray = Array.isArray(imageDescriptions) ? imageDescriptions : [imageDescriptions];
    const oldFilesArray = oldFilenames ? (Array.isArray(oldFilenames) ? oldFilenames : [oldFilenames]) : [];

    const finalImages = [];

    oldFilesArray.forEach(filename => {
      if (filename) {
        finalImages.push({
          filename,
          originalname: filename,
          mimetype: "image/*",
          size: 0
        });
      }
    });

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        finalImages.push({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }

    const syncedTitles = titlesArray.slice(0, finalImages.length);
    const syncedDescriptions = descriptionsArray.slice(0, finalImages.length);

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title,
        description,
        images: finalImages,
        imageTitles: syncedTitles,
        imageDescriptions: syncedDescriptions
      },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ success: false, error: "Proyek tidak ditemukan" });
    }

    res.json({ success: true, project: updatedProject });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Terjadi kesalahan saat mengupdate proyek." });
  }
});

router.get("/:month", async (req, res) => {
  try {
    const month = req.params.month;
    const projects = await Project.find({ month });

    const monthDescriptions = {
      juli: "Bulan Juli menjadi awal perjalanan saya di Datasoft Solusi Indonesia. Pada bulan ini, saya mulai belajar CodeIgniter 3 sebagai framework utama. Kegiatan ini menjadi sarana untuk memahami alur kerja MVC serta implementasi AJAX dalam proses CRUD dinamis. Projek yang saya kerjakan meliputi CRUD Mahasiswa, eksperimen CodeIgniter + AJAX, pembuatan Sistem Toko Online sederhana.",
      agustus: "Pada bulan Agustus, saya mulai mengembangkan proyek ASTRA Selapan, yaitu aplikasi tata tertib sekolah berbasis CodeIgniter 3 dan AJAX. Proyek ini dirancang untuk mendukung pengelolaan data siswa, pencatatan pelanggaran, poin, serta kehadiran. Pengembangan dilakukan secara tim yang terdiri dari dua orang, sehingga setiap proses dikerjakan secara kolaboratif. Pada tahap awal, saya mulai membangun halaman utama yaitu Data Siswa sebagai Master Data yang menjadi dasar untuk pengembangan fitur-fitur lainnya.",
      september: "Pada bulan September, saya melanjutkan pengembangan dengan membuat halaman Pelanggaran dan Ketidakhadiran yang terintegrasi dengan Data Siswa. Melalui integrasi ini, setiap catatan pelanggaran dan ketidakhadiran dapat tersimpan dan terhubung secara otomatis dengan identitas siswa yang ada di database, sehingga pencatatan menjadi lebih akurat dan terstruktur.",
      oktober: "Pada bulan Oktober, saya melanjutkan pengembangan dengan membuat halaman Revisi Poin Siswa, yang memungkinkan admin untuk memantau jumlah poin siswa berdasarkan data pelanggaran dan ketidakhadiran. Melalui halaman ini, admin dapat dengan mudah mengetahui siswa yang telah mencapai batas poin tertentu. Selain itu, pada tahap ini saya juga menambahkan fitur logout untuk meningkatkan keamanan akses pengguna dalam aplikasi."
    };
    const monthDescription = monthDescriptions[month.toLowerCase()] || "Portofolio bulanan";

    res.render("portfolio", {
      month,
      monthDescription,
      projects,
      user: req.session.user || null,
      isAdmin: !!req.session.isAdmin,
      next: req.originalUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan saat menampilkan proyek.");
  }
});

export default router;