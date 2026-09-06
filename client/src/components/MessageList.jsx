// メッセージ一覧表示エリア。ユーザー発言とAI応答を区別して表示する。
export default function MessageList({ messages }) {
  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <p>メッセージを入力して会話を始めてください。</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div key={index} className={`message message--${message.role}`}>
          <span className="message__role">
            {message.role === 'user' ? 'あなた' : 'AI'}
          </span>
          <p className="message__content">
            {message.content || (message.role === 'assistant' ? '…' : '')}
          </p>
        </div>
      ))}
    </div>
  );
}
