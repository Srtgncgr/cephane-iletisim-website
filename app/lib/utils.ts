// Takip kodu oluşturma fonksiyonu
export function generateTrackingCode(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SR${timestamp}${randomStr}`;
} 