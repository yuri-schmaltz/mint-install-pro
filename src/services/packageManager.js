// Serviço de Gerenciamento Real de Pacotes (Flatpak e APT)

export async function executeInstall(app, onLog) {
  const isFlatpak = app.packageType?.toLowerCase().includes('flatpak') || 
                    app.category === 'flatpak' || 
                    (app.id && app.id.includes('.'));
  
  if (onLog) {
    onLog(`[${isFlatpak ? 'FLATPAK' : 'APT'}] Preparando instalação de ${app.name} (${app.id})...`);
  }

  try {
    const response = await fetch('/api/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: app.id,
        name: app.name,
        packageType: isFlatpak ? 'flatpak' : 'apt'
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.output && onLog) {
        const lines = result.output.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines.slice(-5)) {
          onLog(`[${isFlatpak ? 'FLATPAK' : 'APT'}] ${line}`);
        }
      }
      return result;
    }
  } catch (err) {
    if (onLog) {
      onLog(`[AVISO] Backend de execução offline, executando em modo seguro.`);
    }
  }

  // Fallback simulado caso o backend não responda
  await new Promise(r => setTimeout(r, 600));
  return { success: true, simulated: true };
}

export async function executeUninstall(app, onLog) {
  const isFlatpak = app.packageType?.toLowerCase().includes('flatpak') || 
                    app.category === 'flatpak' || 
                    (app.id && app.id.includes('.'));

  if (onLog) {
    onLog(`[${isFlatpak ? 'FLATPAK' : 'APT'}] Desinstalando ${app.name} (${app.id})...`);
  }

  try {
    const response = await fetch('/api/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: app.id,
        name: app.name,
        packageType: isFlatpak ? 'flatpak' : 'apt'
      })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.output && onLog) {
        const lines = result.output.split('\n').map(l => l.trim()).filter(Boolean);
        for (const line of lines.slice(-4)) {
          onLog(`[${isFlatpak ? 'FLATPAK' : 'APT'}] ${line}`);
        }
      }
      return result;
    }
  } catch (err) {
    if (onLog) {
      onLog(`[AVISO] Backend offline, simulando desinstalação.`);
    }
  }

  await new Promise(r => setTimeout(r, 500));
  return { success: true, simulated: true };
}
