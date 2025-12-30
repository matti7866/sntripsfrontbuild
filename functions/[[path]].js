export async function onRequest(context) {
  try {
    // Try to fetch the asset first
    const response = await context.env.ASSETS.fetch(context.request);
    
    // If it's a 404, serve index.html instead
    if (response.status === 404) {
      const indexResponse = await context.env.ASSETS.fetch(new URL('/index.html', context.request.url));
      return new Response(indexResponse.body, {
        ...indexResponse,
        status: 200,
        headers: indexResponse.headers
      });
    }
    
    return response;
  } catch (e) {
    // If anything fails, try to serve index.html
    try {
      const indexResponse = await context.env.ASSETS.fetch(new URL('/index.html', context.request.url));
      return new Response(indexResponse.body, {
        status: 200,
        headers: indexResponse.headers
      });
    } catch (err) {
      return new Response('Not found', { status: 404 });
    }
  }
}









