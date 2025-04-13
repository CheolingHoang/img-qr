const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình nơi lưu ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Cho phép truy cập thư mục uploads công khai
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.urlencoded({ extended: true }));

// Trang gallery chính
app.get("/", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) {
      return res.send("Lỗi đọc thư mục ảnh.");
    }

    const images = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    res.send(`
      <html>
        <head>
          <title>Gallery</title>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
            .img-card { background: white; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; position: relative; }
            .img-card img { width: 100%; height: auto; border-radius: 5px; cursor: pointer; transition: transform 0.2s; }
            .img-card img:hover { transform: scale(1.05); }
            .modal { display: none; position: fixed; z-index: 10; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); justify-content: center; align-items: center; }
            .modal-content { background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; text-align: center; position: relative; }
            .modal-content img { max-width: 100%; max-height: 80vh; }
            .download-btn { margin-top: 10px; background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; }
            .download-btn:hover { background-color: #2980b9; }
            .close-btn { position: absolute; top: 10px; right: 15px; font-size: 18px; cursor: pointer; color: #333; }
          </style>
        </head>
        <body>
          <h1>📸 Ảnh Gallery</h1>
          <div class="grid">
            ${images.map(file => `
              <div class="img-card">
                <img src="/uploads/${file}" alt="${file}" onclick="showModal('/uploads/${file}')">
                <div class="download-btns">
                  <a href="/uploads/${file}" download class="download-btn">Tải ảnh về</a>
                </div>
              </div>
            `).join("")}
          </div>

          <div id="modal" class="modal" onclick="hideModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
              <span class="close-btn" onclick="hideModal()">&times;</span>
              <img id="modal-img" src="" alt="Preview">
              <br>
              <a id="download-link" href="#" download class="download-btn">Tải ảnh về</a>
            </div>
          </div>

          <script>
            function showModal(src) {
              document.getElementById('modal-img').src = src;
              document.getElementById('download-link').href = src;
              document.getElementById('modal').style.display = 'flex';
            }
            function hideModal() {
              document.getElementById('modal').style.display = 'none';
            }
          </script>
        </body>
      </html>
    `);
  });
});

// Trang admin upload + xoá ảnh
app.get("/admin", (req, res) => {
  fs.readdir("uploads", (err, files) => {
    if (err) {
      return res.send("Lỗi đọc thư mục ảnh.");
    }

    const images = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    res.send(`
      <html>
        <head>
          <title>Quản lý ảnh</title>
          <style>
            body { font-family: sans-serif; background: #f5f5f5; padding: 20px; }
            form.upload-form { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
            .img-card { background: white; border-radius: 10px; padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; position: relative; }
            img { width: 100%; height: auto; border-radius: 5px; }
            form.delete-form { margin-top: 10px; }
            button { padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #c0392b; }
          </style>
        </head>
        <body>
          <h1>📤 Upload ảnh</h1>
          <form class="upload-form" action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="photos" multiple required><br><br>
            <button type="submit" style="background:#2ecc71;">Upload</button>
          </form>

          <h2>🧹 Danh sách ảnh</h2>
          <div class="grid">
            ${images.map(file => `
              <div class="img-card">
                <img src="/uploads/${file}" alt="${file}">
                <form class="delete-form" action="/delete" method="post">
                  <input type="hidden" name="filename" value="${file}">
                  <button type="submit">Xóa ảnh</button>
                </form>
              </div>
            `).join("")}
          </div>
        </body>
      </html>
    `);
  });
});

// Xử lý xóa ảnh
app.post("/delete", (req, res) => {
  const filename = path.basename(req.body.filename); // tránh path traversal
  const filePath = path.join(__dirname, "uploads", filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Lỗi xoá ảnh:", err);
    }
    res.redirect("/admin");
  });
});


// Xử lý upload nhiều ảnh
app.post("/upload", upload.array("photos", 10), (req, res) => {
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
