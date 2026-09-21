const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || BOT_TOKEN;
}

export function getTelegramBot() {
  const token = getBotToken();
  if (!token || token.includes('your_telegram')) {
    return {
      token: null,
      async sendMessage() { throw new Error('TELEGRAM_BOT_TOKEN belum diatur di backend/.env'); },
      async getChat() { throw new Error('TELEGRAM_BOT_TOKEN belum diatur di backend/.env'); },
      async getUpdates() { throw new Error('TELEGRAM_BOT_TOKEN belum diatur di backend/.env'); },
    };
  }
  return {
    token,
    async sendMessage(chatId, text, opts = {}) {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': ' ' + 'application/json'.replace(' ', '') },
        body: JSON.stringify({ chat_id: String(chatId), text, parse_mode: opts.parse_mode || 'HTML', ...opts }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.description || `Telegram API error ${res.status}`);
      }
      return data.result;
    },
    async getChat(chatId) {
      const url = `https://api.telegram.org/bot${token}/getChat?chat_id=${encodeURIComponent(String(chatId))}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.description || `getChat gagal untuk ${chatId}`);
      return data.result;
    },
    async getUpdates(offset) {
      const url = `https://api.telegram.org/bot${token}/getUpdates${offset ? `?offset=${offset}` : ''}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.description || 'getUpdates gagal');
      return data.result || [];
    },
  };
}

export async function sendTelegramMessage(chatId, message) {
  const bot = getTelegramBot();
  return bot.sendMessage(chatId, message);
}
