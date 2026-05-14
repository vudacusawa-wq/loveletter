// ============================================
// LOVE LETTER BACKEND - server.js
// Framework: Express.js (Node.js)
// ============================================

// 'require' = cara Node.js import library (seperti import di bahasa lain)
const express = require("express"); // Web framework
const cors = require("cors"); // Izinkan request dari browser
const { v4: uuidv4 } = require("uuid"); // Generate ID unik, contoh: "a3f2-bc91..."
const path = require("path"); // Utility untuk path file (bawaan Node.js)
const fs = require("fs"); // Baca/tulis file (bawaan Node.js)

const app = express(); // Buat instance aplikasi Express
const PORT = process.env.PORT || 8080; // Port server berjalan

// ── MIDDLEWARE ─────────────────────────────
// Middleware = fungsi yang jalan SEBELUM request sampai ke route handler
app.use(cors()); // Izinkan semua origin (browser beda domain)
app.use(express.json()); // Parse body request format JSON otomatis
app.use(express.static("public")); // Sajikan file HTML/CSS/JS dari folder 'public'

// ── DATABASE SEDERHANA (file JSON) ─────────
// Untuk belajar, kita pakai file JSON sebagai "database"
// Di production nyata, pakai MySQL / PostgreSQL / MongoDB
// Auto buat folder data kalau belum ada
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(__dirname, "data", "letters.json");

// Fungsi baca semua surat dari file JSON
function readLetters() {
  if (!fs.existsSync(DB_FILE)) return {}; // Kalau file belum ada, return object kosong
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

// Fungsi simpan semua surat ke file JSON
function saveLetters(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); // null,2 = format rapi
}

// ══════════════════════════════════════════
// API ROUTES (Endpoint)
// ══════════════════════════════════════════

// ── POST /api/letters ──────────────────────
// Fungsi: Simpan surat baru, return ID pendek
// Method POST = mengirim data ke server untuk disimpan
app.post("/api/letters", (req, res) => {
  // req.body = data yang dikirim dari browser (sudah di-parse jadi object JS)
  const { from, to, message, youtubeUrl } = req.body;

  // Validasi: pastikan field wajib ada
  if (!from || !to || !message) {
    // Status 400 = Bad Request (kesalahan dari sisi client)
    return res
      .status(400)
      .json({ error: "from, to, dan message wajib diisi!" });
  }

  const letters = readLetters(); // Ambil data yang sudah ada

  // Buat ID unik pendek: ambil 8 karakter pertama dari UUID
  // UUID contoh: "550e8400-e29b-41d4-a716-446655440000"
  // Kita ambil: "550e8400"
  const id = uuidv4().split("-")[0];

  // Simpan surat baru ke object letters
  letters[id] = {
    id,
    from,
    to,
    message,
    youtubeUrl: youtubeUrl || "", // Kalau tidak ada YouTube, simpan string kosong
    createdAt: new Date().toISOString(), // Timestamp: "2025-01-15T10:30:00.000Z"
  };

  saveLetters(letters); // Tulis ke file JSON

  // ✅ baseUrl harus di LUAR .json(), sebelum res.status
  const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;

  res.status(201).json({
    success: true,
    id,
    shareUrl: `${baseUrl}/letter/${id}`,
  });
});

// ── GET /api/letters/:id ───────────────────
// Fungsi: Ambil data surat berdasarkan ID
// ':id' = URL parameter (dinamis), contoh: /api/letters/550e8400
app.get("/api/letters/:id", (req, res) => {
  const { id } = req.params; // Ambil nilai ':id' dari URL
  const letters = readLetters();

  if (!letters[id]) {
    // Status 404 = Not Found
    return res.status(404).json({ error: "Surat tidak ditemukan 💔" });
  }

  // Status 200 = OK (default, bisa tidak ditulis)
  res.json(letters[id]);
});

// ── GET /letter/:id ────────────────────────
// Fungsi: Halaman penerima surat
// Saat penerima buka link, server kirim file HTML
app.get("/letter/:id", (req, res) => {
  // Kirim file view.html — browser akan render halaman ini
  res.sendFile(path.join(__dirname, "public", "view.html"));
});

// ── START SERVER ───────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   💌 Love Letter Server Running!     ║
  ║   http://localhost:${PORT}              ║
  ╚══════════════════════════════════════╝
  `);
});
