const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Cấu hình Multer để lưu ảnh vào thư mục uploads/
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.set('view engine', 'ejs');

// Trang chính hiển thị ảnh
app.get('/', (req, res) => {
  fs.readdir('./uploads', (err, files) => {
    if (err) return res.send('Lỗi đọc thư mục');
    res.render('index', { files });
  });
});

// Trang admin đăng nhập
app.get('/admin', (req, res) => {
  res.render('admin', { loggedIn: false });
});

// Xử lý đăng nhập
app.post('/admin', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === '1234') {
    res.render('admin', { loggedIn: true });
  } else {
    res.send('Sai tài khoản hoặc mật khẩu');
  }
});

// Xử lý upload ảnh
app.post('/upload', upload.single('image'), (req, res) => {
  res.redirect('/admin');
});

app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
