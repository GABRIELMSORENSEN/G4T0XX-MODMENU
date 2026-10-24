# v1.0.2

Corrige a aparente perda de login ao abrir o EXE diretamente: ele agora usa o mesmo perfil persistente do launcher, quando esse perfil j? existe. Uma pasta de perfil diferente era aberta pelo execut?vel; a sess?o salva n?o havia sido apagada.

- Mantidos interface preta/vermelha, layout, servidores e autentica??o existentes.
- Preservados perfis e credenciais locais; nenhuma sess?o pessoal integra o pacote.
- Respeitado `--user-data-dir` expl?cito para perfis isolados.
- Verificados cat?logo e conta salva na abertura direta. Validade do login continua sujeita ao servidor.
