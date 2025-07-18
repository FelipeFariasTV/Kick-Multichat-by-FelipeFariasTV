// Este é o manipulador específico para requisições POST. É mais explícito e seguro.
export async function onRequestPost(context) {
  try {
    const savedChannels = await context.request.json();
    if (!Array.isArray(savedChannels)) {
      return new Response('Corpo da requisição inválido.', { status: 400 });
    }

    let onlineChannels = [];

    // Itera sobre cada canal para verificar o status
    for (const channelName of savedChannels) {
      try {
        const kickApiUrl = `https://kick.com/api/v2/channels/${channelName}`;
        const response = await fetch(kickApiUrl, {
          headers: { 
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0' // Adicionado para simular um navegador
          }
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

    // Retorna a lista de canais online
    return new Response(JSON.stringify(onlineChannels), {
      headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' // Permite que seu site acesse a resposta
      },
    });
  } catch (e) {
    return new Response('Erro ao processar a requisição: ' + e.message, { status: 500 });
  }
}

// Manipulador para outros métodos (GET, etc.), retorna erro.
export async function onRequest(context) {
    return new Response('Método não permitido. Use POST.', { status: 405 });
}
