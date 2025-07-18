// Este é o nosso "Funcionário". Ele só sabe fazer uma coisa:
// receber um pequeno lote de canais e verificar quem está online.
export async function onRequestPost(context) {
  try {
    const batch = await context.request.json();
    if (!Array.isArray(batch)) {
      return new Response('Requisição inválida.', { status: 400 });
    }

    let onlineInBatch = new Set();
    const promises = batch.map(async (channelName) => {
      try {
        const response = await fetch(`https://kick.com/api/v2/channels/${channelName}`, { headers: { 'Accept': 'application/json', 'User-Agent': 'KickChannelChecker/1.0' } });
        if (response.ok) {
          const data = await response.json();
          if (data.livestream) {
            onlineInBatch.add(channelName);
          }
        }
      } catch (error) {
        console.error(`Worker: Erro ao verificar ${channelName}:`, error);
      }
    });

    await Promise.all(promises);
    
    return new Response(JSON.stringify(Array.from(onlineInBatch)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response('Erro no worker: ' + e.message, { status: 500 });
  }
}
