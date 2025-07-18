// Este é o nosso novo despachante "tudo em um"
export async function onRequest(context) {
  const { request, env } = context;
  const { CHANNELS_KV } = env; // Acessa nosso banco de dados

  // Verifica qual o "verbo" do pedido
  switch (request.method) {
    // Se a página estiver PEDINDO a lista de online (GET)
    case 'GET': {
      const onlineChannels = await CHANNELS_KV.get('online_channels', 'json') || [];
      return new Response(JSON.stringify(onlineChannels), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Se a página estiver ENVIANDO a lista de canais para salvar (POST)
    case 'POST': {
      const channelList = await request.json();
      await CHANNELS_KV.put('all_channels', JSON.stringify(channelList));
      // Inicia a verificação em segundo plano imediatamente após salvar a nova lista
      ctx.waitUntil(runScheduled(null, env, ctx));
      return new Response(JSON.stringify({ success: true, message: `${channelList.length} canais salvos.` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Se for qualquer outro método, retorna erro.
    default:
      return new Response('Método não permitido', { status: 405 });
  }
}

// Esta é a função do nosso "robô", agora dentro do mesmo arquivo
async function runScheduled(controller, env, ctx) {
    console.log("Iniciando verificação de canais...");
    const allChannels = await env.CHANNELS_KV.get('all_channels', 'json') || [];
    if (allChannels.length === 0) return;

    let onlineChannels = new Set();
    const batchSize = 25;
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
    await env.CHANNELS_KV.put('online_channels', JSON.stringify(onlineList));
    console.log(`Verificação concluída. ${onlineList.length} canais online encontrados.`);
}

// Este é o nosso robô que roda a cada 2 minutos
export default {
    async scheduled(controller, env, ctx) {
        ctx.waitUntil(runScheduled(controller, env, ctx));
    },
};
