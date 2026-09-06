// バックエンドAPIサーバーのURL(未設定時は http://localhost:3001 を使用)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * バックエンドの POST /api/chat に会話履歴を送信し、
 * SSEでストリーミングされるテキストチャンクを逐次コールバックへ渡す。
 *
 * @param {Array<{role: 'user'|'assistant', content: string, images?: Array<{data: string, mediaType: string}>}>} messages 送信する会話履歴(imagesは画像添付時のみ)
 * @param {(chunk: string) => void} onChunk テキストチャンクを受信するたびに呼ばれるコールバック
 * @param {AbortSignal} [signal] リクエストを中断するためのシグナル
 */
export async function sendChatMessage(messages, onChunk, signal) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || `サーバーエラーが発生しました(status: ${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSEは "\n\n" で1イベントを区切る
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? ''; // 末尾は不完全な可能性があるため次回に持ち越す

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();

      if (data === '[DONE]') {
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue; // JSONとして解釈できない行は無視する
      }

      if (parsed.error) {
        throw new Error(parsed.error);
      }
      if (parsed.text) {
        onChunk(parsed.text);
      }
    }
  }
}
