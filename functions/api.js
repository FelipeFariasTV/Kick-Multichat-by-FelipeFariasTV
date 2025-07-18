// Este é o nosso despachante "tudo em um" - VERSÃO FINAL
export async function onRequest(context) {
  const { request, env, waitUntil } = context;
  const { CHANNELS_KV } = env; // Acessa o banco de dados

  switch (request.method) {
    // Se a página estiver PEDINDO a lista de online (GET)
    case 'GET': {
      const allChannels = await CHANNELS_KV.get('all_channels', 'json') || [];
      if (allChannels.length === 0) {
        return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });
      }

      let onlineChannels = new Set();
      const batchSize = 30;
      for (let i = 0; i < allChannels.length; i += batchSize) {
          const batch = allChannels.slice(i, i + batchSize);
          const promises = batch.map(async (channelName) => {
              try {
                  const response = await fetch(`https://kick.com/api/v2/channels/${channelName}`, { headers: { 'Accept': 'application/json', 'User-Agent': 'KickChannelChecker/1.0' } });
                  if (response.ok) {
                      const data = await response.json();
                      if (data.livestream) onlineChannels.add(channelName);
                  }
              } catch (error) {
                  console.error(`Worker: Erro ao verificar ${channelName}:`, error);
              }
          });
          await Promise.all(promises);
      }
      const onlineList = Array.from(onlineChannels);
      console.log(`Verificação ao vivo concluída. ${onlineList.length} canais online encontrados.`);
      return new Response(JSON.stringify(onlineList), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Se a página estiver ENVIANDO a lista de canais para salvar (POST)
    case 'POST': {
      const channelList = await request.json();
      await CHANNELS_KV.put('all_channels', JSON.stringify(channelList));
      return new Response(JSON.stringify({ success: true, message: `${channelList.length} canais salvos.` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    default:
      return new Response('Método não permitido', { status: 405 });
  }
}
