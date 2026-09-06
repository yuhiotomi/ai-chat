import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 使用するAIモデル(Claude Haiku 4.5)
const MODEL = 'claude-haiku-4-5-20251001';

// 画像添付機能の制限値
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 1枚あたり最大3MB
const MAX_IMAGES_PER_MESSAGE = 5; // 1メッセージあたり最大5枚
const ALLOWED_IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// メッセージ1件分の images フィールドを検証する。
// 問題なければ null、問題があればエラーメッセージ(文字列)を返す。
function validateImages(images) {
  if (images === undefined) return null;
  if (!Array.isArray(images)) return 'images は配列で指定してください';
  if (images.length > MAX_IMAGES_PER_MESSAGE) {
    return `画像は1メッセージあたり最大${MAX_IMAGES_PER_MESSAGE}枚までです`;
  }

  for (const image of images) {
    if (!image || typeof image.data !== 'string' || typeof image.mediaType !== 'string') {
      return '画像データには data(Base64文字列) と mediaType が必要です';
    }
    if (!ALLOWED_IMAGE_MEDIA_TYPES.includes(image.mediaType)) {
      return `対応していない画像形式です(対応形式: ${ALLOWED_IMAGE_MEDIA_TYPES.join(', ')})`;
    }

    let byteLength;
    try {
      byteLength = Buffer.from(image.data, 'base64').length;
    } catch {
      return '画像データ(Base64)の形式が不正です';
    }
    if (byteLength === 0 || byteLength > MAX_IMAGE_SIZE_BYTES) {
      return `画像サイズは1枚あたり最大${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MBまでです`;
    }
  }

  return null;
}

// Express/フロントエンド向けのメッセージ形式を、Anthropic Messages APIの
// content 形式(画像添付時はブロック配列)に変換する。
function toAnthropicMessages(messages) {
  return messages.map((m) => {
    if (!m.images || m.images.length === 0) {
      return { role: m.role, content: m.content };
    }
    const content = [];
    if (m.content) {
      content.push({ type: 'text', text: m.content });
    }
    for (const image of m.images) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: image.mediaType, data: image.data },
      });
    }
    return { role: m.role, content };
  });
}

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

  const hasEmptyMessage = messages.some(
    (m) => m.content.trim() === '' && (!Array.isArray(m.images) || m.images.length === 0)
  );
  if (hasEmptyMessage) {
    res.status(400).json({ error: 'content または images のいずれかを指定してください' });
    return;
  }

  for (const m of messages) {
    const imageError = validateImages(m.images);
    if (imageError) {
      res.status(400).json({ error: imageError });
      return;
    }
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
      messages: toAnthropicMessages(messages),
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
