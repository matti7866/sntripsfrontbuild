export async function onRequest(context: any) {
  try {
    // First, try to get the requested asset
    return await context.next();
  } catch (err) {
    // If the asset is not found, serve index.html for client-side routing
    try {
      const asset = await context.env.ASSETS.fetch(new URL('/index.html', context.request.url));
      return new Response(asset.body, {
        ...asset,
        status: 200,
        headers: asset.headers,
      });
    } catch {
      // If even index.html is not found, return a 404
      return new Response('Not found', { status: 404 });
    }
  }
}

