import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 起動確認用のヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/chat', chatRouter);

app.listen(port, () => {
  console.log(`サーバーがポート ${port} で起動しました`);
});
