import { useRef, useState } from 'react';

// 添付可能な画像の制限値(バックエンドの制限と合わせる)
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024; // 1枚あたり最大3MB
const MAX_IMAGES_PER_MESSAGE = 5; // 1メッセージあたり最大5枚
const ALLOWED_IMAGE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// FileオブジェクトをBase64文字列(データURLのプレフィックスなし)に変換する
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// テキスト入力欄・画像添付ボタン・送信ボタン。応答待ち・ストリーミング中は入力を無効化する。
export default function MessageInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState([]);
  const [attachError, setAttachError] = useState(null);
  const fileInputRef = useRef(null);

  const addFiles = async (fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES_PER_MESSAGE) {
      setAttachError(`画像は1メッセージあたり最大${MAX_IMAGES_PER_MESSAGE}枚までです`);
      return;
    }

    const invalidType = files.find((file) => !ALLOWED_IMAGE_MEDIA_TYPES.includes(file.type));
    if (invalidType) {
      setAttachError('対応していない画像形式です(JPEG, PNG, GIFのみ添付できます)');
      return;
    }

    const tooLarge = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (tooLarge) {
      setAttachError(`画像サイズは1枚あたり最大${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MBまでです`);
      return;
    }

    setAttachError(null);
    const newImages = await Promise.all(
      files.map(async (file) => ({
        mediaType: file.type,
        name: file.name,
        data: await readFileAsBase64(file),
      }))
    );
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (disabled) return;
    addFiles(event.dataTransfer.files);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (disabled || (!trimmed && images.length === 0)) return;
    onSend(trimmed, images);
    setValue('');
    setImages([]);
    setAttachError(null);
  };

  return (
    <form
      className="message-input"
      onSubmit={handleSubmit}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      {attachError && <p className="message-input__error">{attachError}</p>}

      {images.length > 0 && (
        <div className="message-input__previews">
          {images.map((image, index) => (
            <div className="message-input__preview" key={`${image.name}-${index}`}>
              <img src={`data:${image.mediaType};base64,${image.data}`} alt={image.name} />
              <button
                type="button"
                className="message-input__preview-remove"
                onClick={() => removeImage(index)}
                disabled={disabled}
                aria-label={`${image.name}を削除`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="message-input__row">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={ALLOWED_IMAGE_MEDIA_TYPES.join(',')}
          multiple
          disabled={disabled}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="message-input__attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || images.length >= MAX_IMAGES_PER_MESSAGE}
        >
          画像を追加
        </button>
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="メッセージを入力してください"
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || (!value.trim() && images.length === 0)}>
          送信
        </button>
      </div>
    </form>
  );
}
