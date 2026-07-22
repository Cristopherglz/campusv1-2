import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_DOMAIN = 'campus.duomo.com.ar';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url' });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(url);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }

  if (!targetUrl.includes(ALLOWED_DOMAIN)) {
    return res.status(403).json({ error: 'Domain not allowed' });
  }

  // Convertir a /pluginfile.php simple sin token (igual a como funciona en la versión vieja)
  const parsed = new URL(targetUrl);
  parsed.pathname = parsed.pathname.replace('/webservice/pluginfile.php', '/pluginfile.php');
  parsed.searchParams.delete('token');
  const fetchUrl = parsed.toString();

  console.log('Proxy fetch:', fetchUrl.substring(0, 150));

  try {
    const response = await fetch(fetchUrl, { redirect: 'follow' });
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.startsWith('image/')) {
      const body = await response.text();
      console.error('Not image:', response.status, contentType, body.slice(0, 200));
      return res.status(403).json({
        error: 'Not an image',
        status: response.status,
        contentType,
        body: body.slice(0, 200),
        attempted_url: fetchUrl,
      });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.byteLength);
    return res.status(200).send(Buffer.from(buffer));
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
}