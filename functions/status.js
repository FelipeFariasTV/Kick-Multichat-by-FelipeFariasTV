// Esta função é o nosso "despachante". Ela recebe a lista de canais,
// verifica o status de cada um na Kick e retorna apenas os que estão online.
export async function onRequestPost(context) {
  try {
    const allChannels = await context.request.json();
    if (!Array.isArray(allChannels)) {
      return new Response('Requisição inválida. Esperando um array de canais.', { status: 400 });
    }

    let onlineChannels = [];

    for (const channelName of allChannels) {
      try {
        const kickApiUrl = `https://kick.com/api/v2/channels/${channelName}`;
        // O fetch acontece no servidor da Cloudflare, então não há erro CORS.
        const response = await fetch(kickApiUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'KickChannelChecker/1.0' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.livestream) {
            onlineChannels.push(channelName);
          }
        }
      } catch (error) {
        // Ignora erros de canais individuais para não parar o processo todo.
        console.error(`Worker: Erro ao verificar ${channelName}:`, error);
      }
    }

    // Retorna a lista final e limpa de canais online.
    return new Response(JSON.stringify(onlineChannels), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response('Erro fatal ao processar a requisição: ' + e.message, { status: 500 });
  }
}

// Qualquer outro método (como GET) vai retornar um erro.
export async function onRequest(context) {
    return new Response('Método não permitido. Use POST.', { status: 405 });
}
