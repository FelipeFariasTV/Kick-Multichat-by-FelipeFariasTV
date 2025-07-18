// Despachante "tudo em um" - VERSÃO FINAL CORRIGIDA
async function handleRequest(context) {
  const { request, env, waitUntil } = context;
  const { CHANNELS_KV } = env;

  switch (request.method) {
    case 'GET': {
      const onlineChannels = await CHANNELS_KV.get('online_channels', 'json') || [];
      return new Response(JSON.stringify(onlineChannels), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    case 'POST': {
      const channelList = await request.json();
      await CHANNELS_KV.put('all_channels', JSON.stringify(channelList));
      waitUntil(runScheduled(env));
      return new Response(JSON.stringify({ success: true, message: `${channelList.length} canais salvos.` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    default:
      return new Response('Método não permitido', { status: 405 });
  }
}

async function runScheduled(env) {
    console.log("Iniciando verificação de canais agendada...");
    const allChannels = await env.CHANNELS_KV.get('all_channels', 'json') || [];
    if (allChannels.length === 0) {
      console.log("Nenhum canal na lista mestre para verificar.");
      return;
    }

    let onlineChannels = new Set();
    const batchSize = 30; // Aumentamos um pouco o lote para mais eficiência
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
    console.log(`Verificação concluída. ${onlineList.length} canais online encontrados e salvos.`);
}

export const onRequest = handleRequest;

export default {
    async scheduled(controller, env, ctx) {
        ctx.waitUntil(runScheduled(env));
    },
};
