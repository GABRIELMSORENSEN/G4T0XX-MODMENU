# Valida??o ? 23/10/2026

- Execut?vel original preservado; 221 arquivos de c?digo e recursos do ASAR permanecem id?nticos. Entradas adicionadas: tema preto/vermelho e pequeno ajuste de compatibilidade do loop Node, vinculados em `index.html`. Verifica??o reproduz?vel em `verification/theme-integrity.json`.
- Mantidos layout, navega??o, imagens, tipografia, servidores e autentica??o existentes.
- Verificado que a checagem do .NET podia aguardar indefinidamente uma opera??o ass?ncrona de arquivo no renderer. Ativar um timer Node referenciado liberou as opera??es pendentes e a inicializa??o. A corre??o mant?m esse timer, com limpeza ao descarregar a p?gina; n?o ignora checagem do .NET ou login. H? relatos hist?ricos de sintoma semelhante no [Electron](https://github.com/electron/electron/issues/19554), mas o diagn?stico desta corre??o foi feito no execut?vel local.
- Sess?o v?lida j? existente copiada para perfil isolado; cat?logo aberto sem redigitar credenciais. Perfil original preservado.
- Painel PEAK carregado pelo aplicativo, com HTTP 200 em `api.wemod.com/v3/games/103144/trainer`.
- Launcher testado com perfil persistente e reutiliza??o de inst?ncia j? aberta.

Nenhum treinador foi executado nem jogo modificado. Login continua sujeito ? validade da sess?o no servidor. N?o h? cookies, sess?es pessoais ou credenciais dentro do pacote publicado.

Duas aberturas com o ajuste empacotado passaram; a segunda confirmou leitura ass?ncrona real do mscorlib.dll, sess?o persistente, cat?logo e resposta HTTPS 200 do treinador PEAK, com caches existentes preservados.

Recupera??o de login v1.0.2: confirmado que o launcher mantinha a conta salva e o EXE direto selecionava outro perfil. Adicionado ao in?cio do `index.js` apenas o carregamento de um seletor de perfil local; o conte?do original do arquivo permanece integral e id?ntico ap?s essa linha. Abertura direta verificada com cat?logo e conta salvos, sem argumento de perfil. A autentica??o e os servidores n?o foram alterados.
