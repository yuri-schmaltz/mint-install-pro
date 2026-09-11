import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import LandingPage from './LandingPage';

describe('LandingPage component tests', () => {
  const mockApps = [
    { id: 'vlc', name: 'VLC', summary: 'Media player', rating: 4.9, icon: '' },
    { id: 'gimp', name: 'GIMP', summary: 'Image editor', rating: 4.8, icon: '' },
    { id: 'firefox', name: 'Firefox', summary: 'Browser', rating: 4.7, icon: '' }
  ];

  it('renderiza carrossel de destaques e permite navegar', () => {
    const { container } = render(
      <LandingPage
        apps={mockApps}
        onSelectCategory={() => {}}
        onSelectApp={() => {}}
      />
    );

    expect(screen.getByText('VLC Media Player')).toBeInTheDocument();

    const chevronRight = container.querySelector('.lucide-chevron-right');
    expect(chevronRight).toBeInTheDocument();
    fireEvent.click(chevronRight.parentElement);

    expect(screen.getByText('Blender')).toBeInTheDocument();
  });

  it('permite selecionar categorias através dos tiles', () => {
    const onSelectCat = vi.fn();
    render(
      <LandingPage
        apps={mockApps}
        onSelectCategory={onSelectCat}
        onSelectApp={() => {}}
      />
    );

    const internetTile = screen.getByText('Internet');
    fireEvent.click(internetTile);
    expect(onSelectCat).toHaveBeenCalledWith('internet');
  });

  it('renderiza os aplicativos mais bem avaliados', () => {
    const onSelectApp = vi.fn();
    render(
      <LandingPage
        apps={mockApps}
        onSelectCategory={() => {}}
        onSelectApp={onSelectApp}
      />
    );

    expect(screen.getByText('Mais Bem Avaliados')).toBeInTheDocument();
    expect(screen.getByText('VLC')).toBeInTheDocument();
    expect(screen.getByText('GIMP')).toBeInTheDocument();

    fireEvent.click(screen.getByText('VLC'));
    expect(onSelectApp).toHaveBeenCalledWith(expect.objectContaining({ id: 'vlc' }));
  });

  it('permite paginar o carrossel de aplicativos mais bem avaliados quando há mais de 6 itens', () => {
    const manyApps = Array.from({ length: 12 }, (_, i) => ({
      id: `app-${i}`,
      name: `App ${i}`,
      summary: `Resumo ${i}`,
      rating: 4.8 - i * 0.01,
      icon: ''
    }));

    render(
      <LandingPage
        apps={manyApps}
        onSelectCategory={() => {}}
        onSelectApp={() => {}}
      />
    );

    // Página 1 deve conter App 0 e não conter App 6
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('App 0')).toBeInTheDocument();
    expect(screen.queryByText('App 6')).not.toBeInTheDocument();

    // Clica no botão de próxima página
    const nextBtn = screen.getByTitle('Próxima página');
    fireEvent.click(nextBtn);

    // Página 2 agora exibe App 6 e indicador 2 / 2
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('App 6')).toBeInTheDocument();
  });

  it('exibe esqueleto durante estado de loading', () => {
    render(
      <LandingPage
        apps={[]}
        isLoading={true}
        onSelectCategory={() => {}}
        onSelectApp={() => {}}
      />
    );

    expect(screen.getByText('Carregando destaques...')).toBeInTheDocument();
  });
});
