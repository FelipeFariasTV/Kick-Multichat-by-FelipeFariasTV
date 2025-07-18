export async function onRequestPost(context) {
  try {
    const channelList = await context.request.json();
    if (!Array.isArray(channelList)) {
      return new Response('Requisição inválida.', { status: 400 });
    }
    
    const { CHANNELS_KV } = context.env;
    await CHANNELS_KV.put('all_channels', JSON.stringify(channelList));
    
    return new Response(JSON.stringify({ success: true, message: `${channelList.length} canais salvos.` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response('Erro ao salvar a lista: ' + e.message, { status: 500 });
  }
}
