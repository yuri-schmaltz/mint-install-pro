// Test runner para validar o catálogo de aplicativos e integridade dos assets
import fs from 'fs';
import path from 'path';
import { initialApps, categoriesList } from '../src/data/initialApps.js';
import { searchFlathub, getPopularFlathub } from '../src/services/flathubApi.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('🧪 Executando Gauntlet Tests: app_manager\n');

// Test 1: Verificar se os 21 aplicativos da captura de tela oficial estão presentes
console.log('1. Verificação dos 21 aplicativos da captura de tela oficial:');
const expectedAccessories = [
  'Synapse', 'Dconf-editor', 'Grep', 'Mediainfo-gui', 'Artha', 'Doublecmd-gtk',
  'Htop', 'P7zip-full', 'Unzip', 'Fdupes', 'Gtkhash', 'Keepassxc',
  'Mc', 'P7zip', 'Sshfs', 'Devede', 'Kupfer', 'Unrar',
  'Goldendict', 'Hplip-gui', 'Krename'
];

expectedAccessories.forEach(name => {
  const found = initialApps.find(a => a.name.toLowerCase() === name.toLowerCase());
  assert(!!found, `Aplicativo "${name}" está presente no catálogo`);
});

// Test 2: Verificar ratings e integridade de dados numéricos
console.log('\n2. Verificação de integridade dos ratings e campos:');
const synapse = initialApps.find(a => a.name === 'Synapse');
assert(synapse && synapse.rating === 4.9, 'Synapse tem nota 4.9');

const grep = initialApps.find(a => a.name === 'Grep');
assert(grep && grep.installed === true, 'Grep está marcado como instalado');

const htop = initialApps.find(a => a.name === 'Htop');
assert(htop && htop.rating === 4.7, 'Htop tem nota 4.7');

// Test 3: Verificar se os arquivos de ícones locais existem no disco
console.log('\n3. Verificação de existência dos arquivos de ícones locais em public/:');
let missingIcons = 0;
initialApps.forEach(app => {
  if (app.icon && !app.icon.startsWith('http')) {
    const localPath = path.join(process.cwd(), 'public', app.icon.replace(/^\//, ''));
    if (!fs.existsSync(localPath)) {
      missingIcons++;
      console.warn(`    Aviso: Ícone não encontrado: ${localPath}`);
    }
  }
});
assert(missingIcons === 0, `Todos os ícones locais existem no disco (ausentes: ${missingIcons})`);

// Test 4: Lógica de Busca
console.log('\n4. Verificação da Lógica de Busca:');
const searchGrep = initialApps.filter(a => a.name.toLowerCase().includes('grep') || a.summary.toLowerCase().includes('grep'));
assert(searchGrep.length >= 1 && searchGrep.some(a => a.name === 'Grep'), 'Busca por "grep" encontra o aplicativo Grep');

const searchZip = initialApps.filter(a => a.name.toLowerCase().includes('zip') || a.summary.toLowerCase().includes('zip'));
assert(searchZip.length >= 3, `Busca por "zip" retorna múltiplos compactadores (encontrados: ${searchZip.length})`);

// Test 5: Categorias e Acessórios
console.log('\n5. Verificação das Categorias do Linux Mint:');
assert(categoriesList.length >= 8, `Pelo menos 8 categorias configuradas (configuradas: ${categoriesList.length})`);
const accessoriesApps = initialApps.filter(a => a.category === 'accessories');
assert(accessoriesApps.length >= 21, `Categoria Acessórios contém pelo menos os 21 aplicativos esperados (total: ${accessoriesApps.length})`);

// Test 6: Verificação de Operações em Lote
console.log('\n6. Verificação da Lógica de Instalação/Desinstalação em Lote:');
const testBatchIds = ['synapse', 'dconf-editor', 'grep'];
const selectedApps = initialApps.filter(a => testBatchIds.includes(a.id));
assert(selectedApps.length === 3, 'Seleção de 3 aplicativos para lote');

const toInstall = selectedApps.filter(a => !a.installed);
const toUninstall = selectedApps.filter(a => a.installed);
assert(toInstall.length >= 1, 'Cálculo correto de aplicativos não-instalados a instalar');
assert(toUninstall.length >= 1, 'Cálculo correto de aplicativos instalados a desinstalar');

// Test 7: Guia "Todos os Aplicativos"
console.log('\n7. Verificação da Guia "Todos os Aplicativos" da Plataforma:');
assert(initialApps.length >= 100, `Catálogo consolidado apresenta mais de 100 aplicativos (total: ${initialApps.length})`);
const aptApps = initialApps.filter(a => !a.flathub);
const flatpakApps = initialApps.filter(a => a.flathub || a.packageType?.includes('Flatpak'));
assert(aptApps.length > 50, `Subconjunto de pacotes nativos do sistema APT expressivo (${aptApps.length} pacotes)`);
assert(flatpakApps.length >= 20, `Subconjunto de pacotes Flatpak do Flathub disponível (${flatpakApps.length} pacotes)`);

// Test 8: Aba e Categoria "Flatpak"
console.log('\n8. Verificação da Aba e Suporte Flathub:');
const flatpakCategory = categoriesList.find(c => c.id === 'flatpak');
assert(!!flatpakCategory, 'Aba "flatpak" está registrada em categoriesList');
assert(typeof searchFlathub === 'function', 'Função de busca ao vivo no Flathub (searchFlathub) disponível');
assert(typeof getPopularFlathub === 'function', 'Função de catálogo popular Flathub (getPopularFlathub) disponível');

console.log(`\n========================================`);
console.log(`Resultado dos Testes: ${passed} passaram, ${failed} falharam.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 Todos os testes de conformidade foram aprovados com sucesso!');
}
