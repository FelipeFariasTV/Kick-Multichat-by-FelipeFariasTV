// Este é o nosso "funcionário especialista".
// Ele recebe um nome de canal e responde se está online.
export async function onRequestPost(context) {
  try {
    const { channel } = await context.request.json();
    if (!channel) {
      return new Response(JSON.stringify({ error: 'Nenhum canal fornecido.' }), { status: 400 });
    }

    const response = await fetch(`https://kick.com/api/v2/channels/${channel}`, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'KickChannelChecker/1.0' }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ channel: channel, is_live: false }), { status: 200 });
    }

    const data = await response.json();
    const isLive = !!data.livestream; // Converte para true ou false

    return new Response(JSON.stringify({ channel: channel, is_live: isLive }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
