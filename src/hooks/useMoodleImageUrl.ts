import { useMemo } from 'react';

export function useMoodleImageUrl(imageUrl: string | undefined): string | undefined {
  return useMemo(() => {
    if (!imageUrl) return undefined;

    // Limpiar: quitar /webservice/ y el token — dejar solo /pluginfile.php/path
    if (imageUrl.includes('campus.duomo.com.ar') && imageUrl.includes('pluginfile.php')) {
      try {
        const parsed = new URL(imageUrl);
        parsed.pathname = parsed.pathname.replace('/webservice/pluginfile.php', '/pluginfile.php');
        parsed.searchParams.delete('token');
        return parsed.toString();
      } catch {
        return imageUrl;
      }
    }

    return imageUrl;
  }, [imageUrl]);
}

export default useMoodleImageUrl;