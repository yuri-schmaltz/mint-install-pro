import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AppDetailsModal from './AppDetailsModal';
import SettingsModal from './SettingsModal';

vi.mock('../services/packageManager', () => ({
  executeInstall: vi.fn(async (app, onLog) => {
    onLog?.('[APT] Instalando teste...');
    return { success: true };
  }),
  executeUninstall: vi.fn(async (app, onLog) => {
    onLog?.('[APT] Removendo teste...');
    return { success: true };
  })
}));

describe('AppDetailsModal Component Tests', () => {
  const uninstalledApp = {
    id: 'gimp',
    name: 'GIMP Image Editor',
    summary: 'GNU Image Manipulation Program',
    description: 'Create and edit raster graphics.',
    version: '2.10.36',
    installed: false,
    rating: 4.8,
    category: 'graphics',
    packageType: 'APT (Debian)'
  };

  const installedApp = {
    ...uninstalledApp,
    installed: true
  };

  it('não renderiza se app for nulo', () => {
    const { container } = render(<AppDetailsModal app={null} onClose={() => {}} onToggleInstall={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza detalhes do app não instalado com botão Instalar', () => {
    render(<AppDetailsModal app={uninstalledApp} onClose={() => {}} onToggleInstall={() => {}} />);
    expect(screen.getByText('GIMP Image Editor')).toBeInTheDocument();
    expect(screen.getByText('GNU Image Manipulation Program')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Instalar/i })).toBeInTheDocument();
  });

  it('renderiza detalhes do app instalado com botão Remover', () => {
    render(<AppDetailsModal app={installedApp} onClose={() => {}} onToggleInstall={() => {}} />);
    expect(screen.getByRole('button', { name: /Remover/i })).toBeInTheDocument();
  });

  it('executa instalação e chama onToggleInstall', async () => {
    const onToggle = vi.fn();
    render(<AppDetailsModal app={uninstalledApp} onClose={() => {}} onToggleInstall={onToggle} />);
    const installBtn = screen.getByRole('button', { name: /Instalar/i });
    fireEvent.click(installBtn);

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledWith('gimp');
    });
  });
});

describe('SettingsModal Component Tests', () => {
  const mockSettings = {
    searchInSummary: true,
    searchInDescription: true,
    searchInCategoryOnly: false,
    enableFlathubLive: true,
    allowUnverifiedFlatpaks: false,
    packageTypePreference: 'all',
    confirmBatchAction: true,
    isDefaultPackageManager: true
  };

  it('não renderiza se isOpen === false', () => {
    const { container } = render(
      <SettingsModal
        isOpen={false}
        onClose={() => {}}
        settings={mockSettings}
        onSaveSettings={() => {}}
        onResetDefaults={() => {}}
        onClearCache={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza preferências e permite troca de abas', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={() => {}}
        settings={mockSettings}
        onSaveSettings={() => {}}
        onResetDefaults={() => {}}
        onClearCache={() => {}}
      />
    );
    expect(screen.getByText('Preferências do Gerenciador')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pesquisa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Flatpaks/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Flatpaks/i }));
    expect(screen.getByText(/Gerenciamento de Flatpaks & Flathub/i)).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão fechar', () => {
    const onClose = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        onClose={onClose}
        settings={mockSettings}
        onSaveSettings={() => {}}
        onResetDefaults={() => {}}
        onClearCache={() => {}}
      />
    );
    const closeBtn = screen.getByRole('button', { name: /Fechar/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
