import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AppGrid from './AppGrid';

describe('AppGrid component tests', () => {
  const mockApps = [
    { id: 'vlc', name: 'VLC Media Player', summary: 'Media Player', packageType: 'APT (Debian)', flathub: false, installed: false },
    { id: 'firefox', name: 'Firefox', summary: 'Web Browser', packageType: 'APT (Debian)', flathub: false, installed: true },
    { id: 'org.blender.Blender', name: 'Blender', summary: '3D Suite', packageType: 'Flatpak (Flathub)', flathub: true, installed: false }
  ];

  it('renderiza título da categoria e lista de apps', () => {
    render(
      <AppGrid
        apps={mockApps}
        categoryTitle="Multimídia"
        onSelectApp={() => {}}
      />
    );

    expect(screen.getByText('Multimídia')).toBeInTheDocument();
    expect(screen.getByText('VLC Media Player')).toBeInTheDocument();
    expect(screen.getByText('Firefox')).toBeInTheDocument();
    expect(screen.getByText('Blender')).toBeInTheDocument();
  });

  it('filtra por tipo de pacote na aba "all"', () => {
    render(
      <AppGrid
        apps={mockApps}
        categoryTitle="Todos os Aplicativos"
        selectedCategory="all"
        onSelectApp={() => {}}
      />
    );

    // Botões de filtro APT e Flatpak
    const aptBtn = screen.getByRole('button', { name: /APT/i });
    const flatpakBtn = screen.getByRole('button', { name: /Flatpak/i });

    fireEvent.click(aptBtn);
    expect(screen.getByText('VLC Media Player')).toBeInTheDocument();
    expect(screen.queryByText('Blender')).not.toBeInTheDocument();

    fireEvent.click(flatpakBtn);
    expect(screen.queryByText('VLC Media Player')).not.toBeInTheDocument();
    expect(screen.getByText('Blender')).toBeInTheDocument();
  });

  it('exibe banner especial do Flathub na aba "flatpak"', () => {
    render(
      <AppGrid
        apps={mockApps}
        categoryTitle="Flatpak"
        selectedCategory="flatpak"
        onSelectApp={() => {}}
      />
    );

    expect(screen.getByText(/Catálogo Oficial Flathub/i)).toBeInTheDocument();
    expect(screen.getByText(/Live API/i)).toBeInTheDocument();
  });

  it('exibe estado vazio quando nenhum app corresponde aos filtros', () => {
    render(
      <AppGrid
        apps={[]}
        categoryTitle="Vazio"
        onSelectApp={() => {}}
      />
    );

    expect(screen.getByText('Nenhum aplicativo encontrado')).toBeInTheDocument();
    expect(screen.getByText('Nenhum aplicativo disponível com os filtros atuais selecionados.')).toBeInTheDocument();
  });

  it('exibe skeletons em estado de carregamento', () => {
    const { container } = render(
      <AppGrid
        apps={mockApps}
        categoryTitle="Carregando"
        isLoading={true}
        onSelectApp={() => {}}
      />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
