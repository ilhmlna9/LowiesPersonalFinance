// WhatsApp provider agnostic: Meta Cloud API (WHATSAPP_TOKEN + PHONE_NUMBER_ID) atau fallback mock log
// Mock mode tetap jalan tanpa env, pesan hanya di-log di server

function getConfig() {
  return {
    token: process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_CLOUD_TOKEN || null,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
    // opsional provider lain (mis. Fonnte: FONNTE_TOKEN)
    fonnteToken: process.env.FONNTE_TOKEN || null,
  };
}

export function getWhatsAppAdapter() {
  const { token, phoneNumberId, fonnteToken } = getConfig();
  const hasCloud = !!(token && phoneNumberId);
  const hasFonnte = !!fonnteToken;

  if (!hasCloud && !hasFonnte) {
    return {
      provider: 'mock',
      async sendMessage(phoneNumber, text) {
        console.log(`[WhatsApp MOCK] to ${phoneNumber}: ${text}`);
        return { mocked: true, to: phoneNumber };
      },
      async verifyNumber(phoneNumber) {
        // mock: anggap valid jika format sudah lolos validasi frontend
        return { valid: true, phoneNumber };
      },
    };
  }

  // Meta Cloud API
  if (hasCloud) {
    return {
      provider: 'meta-cloud',
      async sendMessage(phoneNumber, text) {
        const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: String(phoneNumber).replace(/\D/g, ''),
            type: 'text',
            text: { preview_url: false, body: String(text) },
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error?.message || `WhatsApp Cloud API error ${res.status}`);
        return data;
      },
      async verifyNumber(phoneNumber) {
        // Cloud API tidak punya verify khusus, cukup coba kirim tidak error
        return { valid: true, phoneNumber };
      },
    };
  }

  // Fonnte fallback
  return {
    provider: 'fonnte',
    async sendMessage(phoneNumber, text) {
      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: String(fonnteToken) },
        body: new URLSearchParams({ target: String(phoneNumber).replace(/\D/g, ''), message: String(text) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status === false) throw new Error(data.reason || `Fonnte error ${res.status}`);
      return data;
    },
    async verifyNumber(phoneNumber) { return { valid: true, phoneNumber }; },
  };
}

export async function sendWhatsAppMessage(phoneNumber, message) {
  const adapter = getWhatsAppAdapter();
  return adapter.sendMessage(phoneNumber, message);
}
