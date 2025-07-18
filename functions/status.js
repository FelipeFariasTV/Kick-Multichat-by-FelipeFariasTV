export async function onRequest(context) {
  // A função só aceita requisições POST
  if (context.request.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  try {
    const savedChannels = await context.request.json();
    let onlineChannels = [];

    for (const channelName of savedChannels) {
      try {
        const kickApiUrl = `https://kick.com/api/v2/channels/${channelName}`;
        const response = await fetch(kickApiUrl, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.livestream) {
            onlineChannels.push(channelName);
          }
        }
      } catch (error) {
        console.error(`Erro no worker ao verificar ${channelName}:`, error);
      }
    }

    // Retorna a lista de canais online
    return new Response(JSON.stringify(onlineChannels), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response('Erro ao processar a requisição: ' + e.message, { status: 400 });
  }
}
