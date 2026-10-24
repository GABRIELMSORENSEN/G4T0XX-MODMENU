# G4T0XX MOD MENU

Interface personalizada sobre a base original do WeMod. Catálogo, treinadores, serviços e componentes foram preservados; o aplicativo não foi reimplementado.

## Abrir

1. Extraia o pacote completo da release.
2. Execute **Start-G4T0XX.cmd** na pasta extraída.
3. O launcher prepara o acesso de leitura aos arquivos do aplicativo e usa um perfil separado em `%LOCALAPPDATA%/G4T0XX/Modmenu/Profile`.

Na primeira execução, uma sessão local já existente no WeMod é copiada para esse perfil, preservando os dados originais. Com uma sessão válida, o catálogo abre sem digitar credenciais novamente. O launcher não remove a autenticação do servidor: sem sessão válida ou após expiração, o serviço pode exigir login.

## Verificado neste PC

Abertura do executável original, catálogo, sessão salva e painel de mods do PEAK. O servidor original retornou HTTP 200 para o treinador. Nenhum treinador foi executado e nenhum jogo foi modificado nesse teste. Veja `VALIDACAO.md`.

O pacote não contém sessões, cookies, contas nem credenciais do desenvolvedor. Arquivos de personalização seguem a licença deste repositório; componentes da base mantêm as licenças e requisitos dos respectivos fornecedores.

Uma corre??o pequena de compatibilidade mant?m o loop Node ativo durante a inicializa??o do runtime existente. Isso evita leituras de arquivo pendentes na checagem do .NET, preservando as verifica??es de plataforma e login. Uma segunda chamada do launcher reutiliza a inst?ncia j? aberta.

Corre??o v1.0.2: abrir o EXE diretamente passa a selecionar o mesmo perfil local do launcher quando ele j? existe. Argumentos expl?citos `--user-data-dir` s?o respeitados. Isso evita mostrar a tela de login por abrir uma pasta de perfil diferente. Nenhuma credencial foi alterada ou inclu?da na release.
