require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Product = require('./models/product');

const app = express();
app.use(express.json());

// Kiểm tra sức khỏe (dùng cho healthcheck ở Bước 9)
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'error',
    db: connected ? 'connected' : 'disconnected',
  });
});

// Hàm đọc pid từ đường dẫn
const parsePid = (req, res) => {
  const pid = Number(req.params.pid);
  if (Number.isNaN(pid)) {
    res.status(400).json({ message: 'pid phải là số' });
    return null;
  }
  return pid;
};

// CREATE
app.post('/api/products', async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// READ ALL
app.get('/api/products', async (req, res) => {
  res.json(await Product.find().sort({ pid: 1 }));
});

// READ ONE
app.get('/api/products/:pid', async (req, res) => {
  const pid = parsePid(req, res);
  if (pid === null) return;
  const product = await Product.findOne({ pid });
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

// UPDATE (không cho đổi pid)
app.put('/api/products/:pid', async (req, res) => {
  const pid = parsePid(req, res);
  if (pid === null) return;
  const { pid: _bo_qua, ...data } = req.body;
  const product = await Product.findOneAndUpdate({ pid }, data, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
});

// DELETE
app.delete('/api/products/:pid', async (req, res) => {
  const pid = parsePid(req, res);
  if (pid === null) return;
  const product = await Product.findOneAndDelete({ pid });
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json({ message: 'Đã xóa', product });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: 'pid đã tồn tại' });
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ' });
});

// Kết nối MongoDB rồi mới mở server
const PORT = process.env.PORT || 3000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Đã kết nối MongoDB');
    app.listen(PORT, () => console.log(`API chạy tại http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Lỗi kết nối MongoDB:', err.message);
    process.exit(1);
  });