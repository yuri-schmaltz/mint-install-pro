// Serviço para integração direta com a API v2 pública do Flathub
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
        icon: hit.icon || '/flatpak-icon.svg',
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

export async function getPopularFlathub(page = 1, perPage = 30) {
  try {
    const response = await fetch(`https://flathub.org/api/v2/collection/popular?page=${page}&per_page=${perPage}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return (data.hits || []).map(hit => {
      const appId = hit.app_id || hit.id;
      return {
        id: appId,
        name: hit.name,
        summary: (hit.summary || '').slice(0, 65),
        fullSummary: hit.summary,
        description: (hit.description || '').replace(/<[^>]+>/g, '').slice(0, 350),
        category: 'flatpak',
        categoryLabel: 'Flatpak',
        rating: 4.8,
        installed: false,
        version: 'stable',
        size: '50 MB',
        packageType: 'Flatpak (Flathub)',
        icon: hit.icon || '/flatpak-icon.svg',
        fallbackIcon: '📦',
        developer: hit.developer_name || 'Flathub Publisher',
        license: hit.project_license || 'Open Source',
        flathub: true
      };
    });
  } catch (err) {
    console.error('Erro ao buscar populares do Flathub:', err);
    return [];
  }
}
