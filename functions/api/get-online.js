export async function onRequest(context) {
  try {
    // Acessa o banco de dados que conectamos como CHANNELS_KV
    const { CHANNELS_KV } = context.env;
    
    // Pega a lista de canais online que o robô já salvou
    const onlineChannels = await CHANNELS_KV.get('online_channels', 'json');

    // Se não houver nada, retorna uma lista vazia
    if (!onlineChannels) {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Retorna a lista pronta
    return new Response(JSON.stringify(onlineChannels), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response('Erro ao buscar a lista de canais online: ' + e.message, { status: 500 });
  }
}
