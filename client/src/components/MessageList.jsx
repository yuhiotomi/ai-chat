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
          {message.images && message.images.length > 0 && (
            <div className="message__images">
              {message.images.map((image, imageIndex) => (
                <img
                  key={imageIndex}
                  className="message__image"
                  src={`data:${image.mediaType};base64,${image.data}`}
                  alt={image.name || `添付画像${imageIndex + 1}`}
                />
              ))}
            </div>
          )}
          {(message.content || message.role === 'assistant') && (
            <p className="message__content">
              {message.content || (message.role === 'assistant' ? '…' : '')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
