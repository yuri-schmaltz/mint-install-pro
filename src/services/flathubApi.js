// Fallback único para ícones do Flathub quando a API não retorna `icon`
const FALLBACK_FLATPAK_ICON = '/icons/software-manager.png';

export async function searchFlathub(query) {
  if (!query || !query.trim()) return [];
  
  try {
    const response = await fetch('https://flathub.org/api/v2/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: query.trim() })
    });

    if (!response.ok) {
      throw new Error(`Flathub API status: ${response.status}`);
    }

    const data = await response.json();
    const hits = data.hits || [];

    return hits.map(hit => {
      const appId = hit.app_id || hit.id;
      const cleanDesc = (hit.description || hit.summary || '')
        .replace(/<[^>]+>/g, '')
        .slice(0, 350);

      return {
        id: appId,
        name: hit.name || appId,
        summary: (hit.summary || 'Aplicativo Flatpak no Flathub').slice(0, 65),
        fullSummary: hit.summary || 'Aplicativo Flatpak no Flathub',
        description: cleanDesc,
        category: 'flatpak',
        categoryLabel: 'Flatpak',
        rating: 4.8,
        installed: false,
        version: 'stable',
        size: '50 MB',
        packageType: 'Flatpak (Flathub)',
        icon: hit.icon || FALLBACK_FLATPAK_ICON,
        fallbackIcon: '📦',
        developer: hit.developer_name || 'Flathub Publisher',
        license: hit.project_license || 'Open Source',
        flathub: true
      };
    });
  } catch (err) {
    console.error('Erro na busca ao vivo do Flathub:', err);
    return [];
  }
}

export async function getPopularFlathub(page = 1, perPage = 100) {
  try {
    const page1Req = fetch(`https://flathub.org/api/v2/collection/popular?page=1&per_page=100`);
    const page2Req = fetch(`https://flathub.org/api/v2/collection/popular?page=2&per_page=100`);
    const [res1, res2] = await Promise.all([page1Req, page2Req]);
    
    const hits1 = res1.ok ? (await res1.json()).hits || [] : [];
    const hits2 = res2.ok ? (await res2.json()).hits || [] : [];
    const allHits = [...hits1, ...hits2].slice(0, 200);

    return allHits.map(hit => {
      const appId = hit.app_id || hit.id;
      const downloads = hit.installs_last_month 
        ? `${Number(hit.installs_last_month).toLocaleString('pt-BR')} downloads/mês` 
        : '120 MB';
      const favs = hit.favorites_count || 0;
      const rating = roundRating(favs);

      return {
        id: appId,
        name: hit.name,
        summary: (hit.summary || '').slice(0, 65),
        fullSummary: hit.summary,
        description: (hit.description || '').replace(/<[^>]+>/g, '').slice(0, 350),
        category: 'flatpak',
        categoryLabel: 'Flatpak',
        rating: rating,
        installed: false,
        version: 'latest',
        size: downloads,
        packageType: 'Flatpak (Flathub)',
        icon: hit.icon || FALLBACK_FLATPAK_ICON,
        fallbackIcon: '📦',
        developer: hit.developer_name || 'Comunidade Flathub',
        license: hit.project_license || 'Open Source',
        flathub: true,
        downloads: hit.installs_last_month || 0
      };
    });
  } catch (err) {
    console.error('Erro ao buscar populares do Flathub:', err);
    return [];
  }
}

function roundRating(favs) {
  return +(Math.min(5.0, Math.max(4.5, 4.6 + (favs % 5) * 0.1))).toFixed(1);
}
