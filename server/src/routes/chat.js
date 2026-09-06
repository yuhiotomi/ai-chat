import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 使用するAIモデル(Claude Haiku 4.5)
const MODEL = 'claude-haiku-4-5-20251001';

router.post('/', async (req, res) => {
  const { messages } = req.body;

  // リクエストボディのバリデーション
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages は必須です(配列形式で1件以上指定してください)' });
    return;
  }

  const hasInvalidMessage = messages.some(
    (m) => !m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string'
  );
  if (hasInvalidMessage) {
    res.status(400).json({
      error: 'messages の各要素には role("user"または"assistant") と content(文字列) が必要です',
    });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'サーバーにANTHROPIC_API_KEYが設定されていません' });
    return;
  }

  // Server-Sent Events(SSE)のレスポンスヘッダーを設定
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let stream;
  try {
    stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 1024,
      messages,
    });
  } catch (error) {
    console.error('Anthropic APIの呼び出しに失敗しました:', error);
    res.write(`data: ${JSON.stringify({ error: 'AIサーバーへの接続に失敗しました' })}\n\n`);
    res.end();
    return;
  }

  // テキストチャンクを受信するたびにクライアントへ逐次送信する
  stream.on('text', (textDelta) => {
    res.write(`data: ${JSON.stringify({ text: textDelta })}\n\n`);
  });

  // ストリーム終了を通知する
  stream.on('end', () => {
    res.write('data: [DONE]\n\n');
    res.end();
  });

  stream.on('error', (error) => {
    console.error('ストリーミング中にエラーが発生しました:', error);
    res.write(`data: ${JSON.stringify({ error: 'AIからの応答中にエラーが発生しました' })}\n\n`);
    res.end();
  });

  // クライアント側で接続が切断された場合はAPI呼び出しを中断する
  req.on('close', () => {
    stream.abort();
  });
});

export default router;
