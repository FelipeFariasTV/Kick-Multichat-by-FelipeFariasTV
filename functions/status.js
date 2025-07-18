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
        console.error(`Worker: Erro ao verificar ${channelName}:`, error);
      }
    }
    return new Response(JSON.stringify(onlineChannels), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response('Erro ao processar a requisição: ' + e.message, { status: 500 });
  }
}

export async function onRequest(context) {
    return new Response('Método não permitido. Use POST.', { status: 405 });
}
