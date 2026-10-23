# G4T0XX Modmenu 2

Gerenciador autoral de jogos e mods locais para Windows, com identidade preta e vermelha G4T0XX. A implementação ativa está em `app/`.

## Usar

Baixe o instalador ou executável portátil em [Releases](https://github.com/GABRIELMSORENSEN/G4T0XX-MODMENU/releases).

1. **Adicionar jogo:** selecione o executável `.exe`.
2. **Importar mod:** selecione a pasta com os arquivos na mesma estrutura relativa da pasta do jogo.
3. Confira a lista de arquivos e feche o jogo antes de ativar.
4. **Ativar mod** guarda cópias dos arquivos originais antes de substituí-los.
5. **Desativar e restaurar** restaura os originais e remove arquivos adicionados pelo mod.

O aplicativo bloqueia mods que se sobrepõem a outro ativo, links simbólicos e substituição do executável cadastrado. Se um jogo ou outro programa alterar um arquivo instalado, a restauração é bloqueada para preservar a alteração. Operações interrompidas têm um registro de recuperação; mantenha os backups até resolver qualquer conflito.

Biblioteca, mods importados e backups ficam na pasta de dados do aplicativo no perfil do Windows. Remover um item da biblioteca não apaga a pasta de origem do mod nem a instalação do jogo.

## Desenvolvimento

```powershell
npm install
npm test
npm run start
npm run dist:win
```

Node.js 22+. O código não depende de catálogos privados, desbloqueio de assinatura ou binários de outro aplicativo. A antiga distribuição binária foi retirada do índice atual do Git; os arquivos locais e tags antigas foram preservados. As novas releases incluem somente o código autoral e o runtime Electron distribuível.
