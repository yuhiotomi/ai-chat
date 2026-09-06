import { useRef, useState } from 'react';
import MessageList from './components/MessageList.jsx';
import MessageInput from './components/MessageInput.jsx';
import { sendChatMessage } from './api/chat.js';
import './App.css';

export default function App() {
  // 会話履歴はコンポーネントのstateとしてメモリ上にのみ保持する(リロードで消える)
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const handleSend = async (text, images = []) => {
    setError(null);

    const userMessage = { role: 'user', content: text, images };
    const assistantMessage = { role: 'assistant', content: '' };
    // Anthropic APIに送信する会話履歴(今回のユーザー発言までを含む)
    const historyToSend = [...messages, userMessage];

    setMessages([...historyToSend, assistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await sendChatMessage(
        historyToSend,
        (chunk) => {
          // 受信したテキストチャンクを、末尾のAI応答メッセージに逐次追記する
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + chunk,
            };
            return updated;
          });
        },
        controller.signal
      );
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'AIとの通信中にエラーが発生しました');
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>AIチャットボット</h1>
      </header>

      <MessageList messages={messages} />

      {isStreaming && <p className="app__status">AIが応答を生成中です…</p>}
      {error && <p className="app__error">エラー: {error}</p>}

      <MessageInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
