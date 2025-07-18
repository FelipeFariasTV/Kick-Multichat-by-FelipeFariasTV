export default {
  // A função scheduled é ativada pelo gatilho que configuramos na Cloudflare
  async scheduled(controller, env, ctx) {
    console.log("Iniciando verificação agendada de canais...");

    // Pega a lista completa de canais do banco de dados
    const allChannels = await env.CHANNELS_KV.get('all_channels', 'json') || [];
    
    if (allChannels.length === 0) {
      console.log("Nenhum canal na lista para verificar. Encerrando.");
      return;
    }

    let onlineChannels = new Set(); // Usamos Set para evitar duplicatas

    // Processa em lotes para não sobrecarregar a API da Kick
    const batchSize = 25;
    for (let i = 0; i < allChannels.length; i += batchSize) {
      const batch = allChannels.slice(i, i + batchSize);
      const promises = batch.map(async (channelName) => {
        try {
          const kickApiUrl = `https://kick.com/api/v2/channels/${channelName}`;
          const response = await fetch(kickApiUrl, { headers: { 'Accept': 'application/json', 'User-Agent': 'KickChannelChecker/1.0' } });
          if (response.ok) {
            const data = await response.json();
            if (data.livestream) {
              onlineChannels.add(channelName);
            }
          }
        } catch (error) {
          console.error(`Robô: Erro ao verificar ${channelName}:`, error);
        }
      });
      await Promise.all(promises);
    }
    
    const onlineList = Array.from(onlineChannels);
    
    // Salva a nova lista de canais online no banco de dados
    await env.CHANNELS_KV.put('online_channels', JSON.stringify(onlineList));
    console.log(`Verificação concluída. ${onlineList.length} canais online encontrados.`);
  },
};
