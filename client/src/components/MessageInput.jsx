import { useState } from 'react';

// テキスト入力欄と送信ボタン。応答待ち・ストリーミング中は入力を無効化する。
export default function MessageInput({ onSend, disabled }) {
  const [value, setValue] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="メッセージを入力してください"
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        送信
      </button>
    </form>
  );
}
