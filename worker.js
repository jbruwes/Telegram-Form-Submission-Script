export default {
  async fetch(request, { ALLOWED_ORIGIN: allowedOrigin, TELEGRAM_API_KEY: telegramToken, TELEGRAM_CHAT_ID: chatId }) {
    const message = {
      200: "Сообщение отправлено",
      403: "Потеряно",
      405: "Метод не разрешен",
      415: "Неподдерживаемый тип",
      500: "Ошибка отправки сообщения",
    },
      getResponse = (status) => new Response(message[status], { headers: { "Access-Control-Allow-Origin": allowedOrigin }, status });
    switch (request.method) {
      case "OPTIONS":
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      case "POST":
        let data;
        const contentType = request.headers.get("Content-Type");
        switch (true) {
          case request.headers.get("Origin") !== allowedOrigin:
            return getResponse(403);
          case contentType.includes("application/json"):
            data = await request.json();
            break;
          case contentType.includes("application/x-www-form-urlencoded"):
            data = Object.fromEntries(await request.formData());
            break;
          default:
            return getResponse(415);
        }
        const { pageTitle, pageUrl, ...rest } = data;
        try {
          const { ok } = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: request.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: [
                `*New contact form submission from ${pageTitle}*`,
                `*Page URL:* [${pageTitle}](${pageUrl})`,
                ...Object.entries(rest).map(([key, value]) => `*${key}:*\n\`\`\`\n${value}\n\`\`\``),
              ].join("\n"),
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: [[{ text: `Visit ${pageTitle}`, url: pageUrl }]] }
            })
          });
          if (ok) return getResponse(200);
          else return getResponse(500);
        } catch (error) {
          return getResponse(500);
        }
      default:
        return getResponse(405);
    }
  }
}
