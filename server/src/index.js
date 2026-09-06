import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
// 画像添付(Base64)を受け付けるため、ボディサイズ上限を引き上げる
// (画像最大3MB×5枚 + Base64エンコードによる増加分を考慮)
app.use(express.json({ limit: '25mb' }));

// 起動確認用のヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/chat', chatRouter);

app.listen(port, () => {
  console.log(`サーバーがポート ${port} で起動しました`);
});
