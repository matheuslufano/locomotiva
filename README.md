# Campanha de inauguração — Restaurante Locomotiva

Página pública em HTML/CSS/JavaScript, servida pelo Express do **afiliados-backend**, e módulo administrativo Next.js em **afiliados_netbox**. PostgreSQL é a fonte oficial; nenhum cadastro é persistido no navegador. Não há banco paralelo para a página.

## Execução local

A página usa Express e PostgreSQL do projeto irmão `afiliados-backend`. O frontend é executado pelo Next.js, com React instalado. As páginas existentes continuam em HTML, CSS e JavaScript, servidas pelo Route Handler em `app/campanha-locomotiva/[[...file]]/route.js`. As dependências do backend devem estar instaladas com `npm.cmd ci` na pasta do backend.

Inicie `npm.cmd run dev` em `afiliados-backend` na porta 3001. Em `locomotiva-reseva`, execute `npm.cmd run dev` e acesse **http://127.0.0.1:3002/campanha-locomotiva/**. O inicializador verifica a saúde do banco e a configuração da campanha antes de iniciar o Next.js. Para testar com o build de produção, execute `npm.cmd run build` e depois `npm.cmd start`.

O Live Server na porta 5500 também é suportado para prévia: `scripts/shared/campaign-api.js` direciona suas chamadas locais ao mesmo serviço em 127.0.0.1:3001. Em produção, a API é relativa ao endereço da página, preservando inclusive o prefixo `/api-backend/` do painel. Para uma porta diferente, ajuste `LOCOMOTIVA_BACKEND_URL` em `.env.local` e execute pelo Next.js. A prévia pelo Live Server continua usando o padrão 3001.

`npm.cmd run check` verifica a sintaxe dos scripts. O projeto público é HTML/CSS/JavaScript sem etapa de build.

## Organização dos arquivos

```text
locomotiva-reseva/
├── index.html
├── condicoes.html
├── seus-dados.html
├── sua-visita.html
├── components/
│   └── registration-form.html
├── styles/
│   ├── campaign.css
│   ├── landing.css
│   ├── registration.css
│   └── dish-carousel.css
├── scripts/
│   ├── dev-server.cjs
│   ├── shared/campaign-api.js
│   ├── landing/
│   │   ├── landing-navigation.js
│   │   ├── landing-documents.js
│   │   └── dish-carousel.js
│   └── registration/
│       ├── registration-loader.js
│       └── campaign.js
├── assets/
│   └── pratos/
├── profile-placeholder.svg
├── package.json
└── README.md
```

As páginas são entradas públicas. `components/` guarda o formulário compartilhado. `styles/` reúne folhas separadas por componente. `scripts/shared/` centraliza a comunicação com a API, com erros de rede, HTTP e resposta incompatível tratados explicitamente.

## Backend, banco e publicação

- API pública de configuração: `/locomotiva/config`.
- Administração no painel: `/campanha-locomotiva`.
- Autenticação e permissões usam o backend existente.
- A migração `20261117120000_locomotiva_campaign` deve estar aplicada no banco. A ausência de tabelas retorna HTTP 503 com código `CAMPAIGN_SCHEMA_UNAVAILABLE`.
- O comando de migração geral e o servidor de produção podem aplicar outras migrações pendentes. Revisar antes da execução.
- Publicar as quatro páginas, `components/`, `styles/`, `scripts/shared/`, `scripts/landing/`, `scripts/registration/`, `assets/` e `profile-placeholder.svg` mantendo os caminhos.
- Em Docker, montar a pasta pública e configurar `LOCOMOTIVA_PUBLIC_DIR`, conforme a rota Express existente.

As variáveis `DATABASE_URL`, `JWT_SECRET`, `LOCOMOTIVA_DATA_KEY`, `LOCOMOTIVA_SMTP_URL` e `LOCOMOTIVA_MAIL_FROM` pertencem ao ambiente do backend. Não publicar `.env` nem credenciais na pasta pública.

## Antes de abrir as inscrições

Abrir **Campanha Locomotiva → Configurações**. A campanha inicia fechada e os campos comerciais/contratuais começam vazios. Preencher:

1. Datas oferecidas dentro de 21–30/11/2026, horários de chegada no almoço e/ou jantar e antecedência mínima. Chegadas às 15h ou às 23h são rejeitadas. Fuso da campanha: UTC−03:00, correspondente a America/Araguaina nas datas da campanha.
2. Endereço, contato, regras do voucher de R$ 200, acompanhantes, excedente e saldo restante.
3. Prazo/procedimento de cancelamento e ausência, prazo/orientações de publicação e perfis a marcar.
4. Condições completas, termo de imagem e aviso de privacidade aprovados, identificando o responsável pela aprovação.
5. Alcance do termo: imagem, voz e nome quando aplicáveis, canais, finalidade, prazo, edição e impulsionamento. O sistema não fornece uma cessão permanente padrão.

Marcar **Abrir inscrições** somente após aprovação. O servidor impede abertura com campos obrigatórios vazios, sem horários, sem chave de proteção ou sem variáveis SMTP. A presença de variáveis não comprova funcionamento do provedor: testar o envio real e a configuração de remetente/DNS antes de divulgar. A validação de conteúdo jurídico/comercial é responsabilidade dos responsáveis pela campanha; o software valida preenchimento e versionamento.

## Fluxo público

Apresentação e aviso de aprovação precedem o formulário. Ordem fixa:

1. Documentos completos em controles expansíveis e três aceites separados, inicialmente desmarcados.
2. Dados e perfil. CPF com dígitos verificadores, e-mails iguais, WhatsApp com DDD, UF e link de perfil do Instagram. O nome do participante é independente do perfil. O usuário do Instagram é extraído do link.
3. Disponibilidade real, período, chegada, modalidade e revisão. Datas ocupadas ficam desabilitadas, sem revelar o participante.

A disponibilidade é atualizada ao entrar na terceira etapa e a cada 30 segundos enquanto ela estiver aberta. O envio sempre verifica novamente no servidor. Ao mudar a versão dos documentos, os três aceites são desmarcados e o fluxo volta à primeira etapa. Cada inscrição guarda o documento completo, versão, controles e horário de aceite registrado no servidor no envio definitivo.

Duplo clique é bloqueado no cliente. A chave aleatória de idempotência e o hash da requisição impedem duplicação por repetição. Em conflito, os campos permanecem na memória da página; nada vai para `localStorage`, `sessionStorage` ou IndexedDB. Recarregar/fechar a página descarta o preenchimento.

## Reservas, convites e conteúdo

- A transação grava inscrição, reserva, aceites, auditoria e e-mail em fila. O índice parcial único impede dois registros ativos na mesma data. A mesma pessoa pode enviar novas solicitações em datas diferentes usando o mesmo CPF, Instagram e e-mail. A migração `20261119160000_locomotiva_repeat_participation` remove os índices antigos de unicidade por participante.
- Ativas: `PENDING`, `CONFIRMED`, `ATTENDED`, `ABSENT`. Recusa e cancelamento liberam a data, desde que ainda esteja configurada e dentro da antecedência permitida.
- Transições: em análise → confirmada/recusada/cancelada; confirmada → cancelada/compareceu/não compareceu. Registros encerrados não são reativados. Presença/ausência somente após o horário da visita.
- Troca de data/horário é permitida em análise ou confirmada, verifica conflitos e cria comunicação atualizada. Edição concorrente dos detalhes usa a revisão do cadastro.
- Convites têm estado próprio: registrado ou envio marcado manualmente. Tokens de 32 bytes aleatórios são armazenados somente como HMAC; o link é mostrado uma vez. O token fica no fragmento da URL e é removido da barra ao abrir. Expiração: fim da campanha, em 01/12/2026 às 00h UTC−03. Não há envio automático de mensagens pelo Instagram nem comprovação de recebimento.
- Conteúdo é independente da reserva: links HTTPS do Instagram, observações e conferência com autor/horário. Exige pelo menos quatro links para Stories ou um para Reels ao marcar conferido; duração, qualidade e demais condições são conferidas pela equipe.
- Busca por nome/perfil e filtros por cidade, data, período e situação; calendário possui textos além das cores.

## Fotos e proteção de dados

Ao sair do campo do link do Instagram, a etapa 2 consulta o perfil e abre o diálogo de confirmação. Quando o backend encontra uma foto, ela aparece no diálogo e no cartão do perfil na segunda coluna. Confirmar mantém a foto até o envio da solicitação. Fechar sem confirmar restaura a imagem anterior. O participante pode substituir a foto manualmente. Se a foto estiver indisponível, o link ainda pode ser confirmado.

O backend pode consultar os metadados da página pública do Instagram sem login. A consulta retorna indisponível quando o Instagram não entrega metadados de perfil ou bloqueia a requisição. Para desabilitar a consulta direta, use `LOCOMOTIVA_INSTAGRAM_PUBLIC_LOOKUP=false`. Quando configurado, o Meta Business Discovery tem prioridade. As variáveis `LOCOMOTIVA_INSTAGRAM_ACCOUNT_ID`, `LOCOMOTIVA_INSTAGRAM_GRAPH_VERSION` e `LOCOMOTIVA_INSTAGRAM_TOKEN` ficam no backend. A busca não comprova titularidade.

A foto opcional manual aceita PNG/JPEG/WebP até 500 KB, verifica assinatura e registra origem `PARTICIPANT_UPLOAD` / estado `MANUAL`. Fica no PostgreSQL como imagem fornecida pelo participante, acessível pelo painel autorizado. Sem foto, usa placeholder. Uma integração automática futura exige provedor autorizado e avaliação das permissões de uso/armazenamento; nenhuma credencial ou API fictícia foi presumida.

CPF criptografado com AES-256-GCM, com HMAC separado. Listagens e detalhes padrão recebem somente máscara. CPF não é enviado em e-mails, URLs, logs de erro ou armazenamento persistente do navegador. Os outros dados pessoais ficam no PostgreSQL protegido pelos controles de acesso existentes. Backups, retenção e atendimento aos titulares devem seguir o aviso aprovado. Rotas da campanha usam `no-store`; nunca configure CDN para armazenar respostas pessoais.

Antisspam: honeypot e limite persistido de 30 submissões por endereço de conexão a cada 15 minutos. Não se confia no `X-Forwarded-For` arbitrário, dado o `trust proxy` global existente. Se houver proxy reverso, conexões podem compartilhar o mesmo limite; configurar regras adicionais de borda e uma cadeia de proxy confiável antes de ampliar tráfego. Não há CAPTCHA fictício.

## E-mail e confirmação

Outbox persistente no banco, processada após o commit e a cada 30 segundos. Falha do provedor não remove inscrição nem reserva. Tentativas e resultados são registrados na auditoria; os detalhes mostram fila, tentativas, falha e envio ao serviço. `SENT` significa aceite pelo SMTP, **não entrega na caixa de entrada**.

A aprovação administrativa gera o e-mail de confirmação com data, horário, endereço, benefício, condições, conteúdo, publicação e cancelamento. Se falhar, a equipe deve reenviar: não considerar o participante avisado apenas pela situação “Confirmada” no painel. Mensagens antigas pendentes/falhas são substituídas quando há uma comunicação mais recente. O painel só permite reenviar a comunicação mais recente.

Após interrupção do processo durante SMTP, o estado pode permanecer `SENDING` (resultado incerto). O painel permite reenvio depois da janela de cinco minutos, com auditoria. Como SMTP não garante exatamente uma entrega, esse reenvio pode duplicar uma mensagem previamente aceita; conferir o provedor quando houver dúvida. Não há webhook de entrega implementado.

Referência do transporte: [documentação oficial do Nodemailer](https://nodemailer.com/smtp).

## Arquitetura e arquivos

```text
locomotiva-reseva/
  index.html                  apresentação e formulário
  campaign.css                estilos exclusivos da página pública
  campaign.js                 etapas, validação, disponibilidade e envio
  profile-placeholder.svg     imagem padrão
  README.md                   instalação, regras e limitações
afiliados-backend/
  prisma/schema.prisma        modelos do módulo
  prisma/migrations/20261117120000_locomotiva_campaign/migration.sql
  src/routes/locomotivaRoutes.js
  src/services/locomotivaValidation.js
  src/services/locomotivaRepository.js
  src/services/locomotivaMail.js
  test/locomotiva.test.js
afiliados_netbox/src/app/campanha-locomotiva/
  page.tsx                    visão geral, lista, calendário e convites
  CampaignSettings.tsx        configuração e publicação
  RegistrationDetails.tsx     reserva, conteúdo, aceites, auditoria e e-mails
  types.ts                    contrato tipado e rótulos
  campaign.module.css         estilos locais com tokens --nb-* do painel
```

Integrações existentes alteradas: `src/app.js` registra as rotas, `src/server.js` inicia a outbox e `Sidebar.tsx` inclui o módulo. `package.json`/lock do backend incluem Nodemailer. As mudanças preexistentes do Blog foram preservadas.

## Endpoints implementados

| Método e rota | Acesso / finalidade |
| --- | --- |
| GET `/locomotiva/config` | Público; configuração publicada e datas, sem dados dos ocupantes |
| POST `/locomotiva/profile` | Público; normalização e estado da foto |
| POST `/locomotiva/registrations` | Público; inscrição atômica/idempotente |
| GET `/admin/locomotiva` | Gestor/admin; painel e configurações |
| PUT `/admin/locomotiva/config` | Gestor/admin; nova versão e abertura/fechamento |
| GET/PUT `/admin/locomotiva/registrations/:id` | Gestor/admin; detalhes e mudanças auditadas |
| GET `/admin/locomotiva/registrations/:id/cpf` | Somente admin; consulta auditada |
| POST `/admin/locomotiva/invites` | Gestor/admin; registrar convidado e gerar token |
| POST `/admin/locomotiva/invites/:id/sent` | Gestor/admin; registrar envio manual |
| POST `/admin/locomotiva/mail/:id/retry` | Gestor/admin; reenvio autorizado |

## Verificações

Backend: `node --test test/locomotiva.test.js` executa validações unitárias. Para a suíte PostgreSQL, usar somente um banco local descartável chamado `locomotiva_test` em `127.0.0.1:55439` e definir `LOCOMOTIVA_TEST_DATABASE_URL`; a suíte limpa **somente as tabelas Locomotiva desse banco de teste** e recusa outro destino. SMTP é simulado; não envia mensagens reais.

A su?te PostgreSQL terminou com 13 testes aprovados, sem falhas. Foram verificados: concorrência pela mesma data, índice único no banco, replay idempotente, duplicidade de identidade, termo desatualizado, liberação por recusa/cancelamento, troca de data com conflito/comunicação, foto indisponível, máscara do CPF, falha/recuperação de SMTP, ausência de autenticação e restrições de papel. O build Next.js e a validação Prisma passaram. Consultar o relatório da entrega para os resultados finais após revisões.

**Não verificados ao vivo:** fluxo visual em celular/tablet/desktop e painel autenticado, envio/entrega pelo provedor real, integração automática de foto e produção. A ferramenta de navegação interrompeu a revisão por não conseguir determinar a URL ativa do Chrome com segurança.

## Apresentação do restaurante e convite

A rota pública `/campanha-locomotiva/` reúne apresentação, três fotografias em destaque, cartões da campanha, guia em três passos e acesso às páginas do cadastro. A versão para celular compartilha o HTML e usa menu recolhível, seções empilhadas e fotos com enquadramento adequado.

`styles/landing.css` define as seções da apresentação, os cartões reutilizados e as superfícies em grafite, cobre e marfim. A arte de inspiração compõe o cabeçalho, a chamada final e o rodapé. O carrossel anterior permanece em **Ver mais fotos dos pratos**, com estilos em `styles/dish-carousel.css` e controles em `scripts/landing/dish-carousel.js`. [Referência de controles discretos](https://freefrontend.com/css-tabs/).

As chamadas de participação levam a `condicoes.html`. O rodapé usa `scripts/landing/landing-documents.js` para consultar os documentos disponíveis e direcionar ao termo correspondente na primeira etapa.

O refinamento visual utiliza títulos em Georgia, logo branca sobre grafite, cobre nas ações e cartões com ícones em superfícies suaves. As fotos recebem legendas sobre degradê para leitura. As classes existentes foram revistas em sua origem, com tokens de borda e raio em `styles/landing.css`.


## Páginas do cadastro

- `condicoes.html` — Antes de participar, termos completos e aceites.
- `seus-dados.html` — Vamos conhecer você, dados pessoais, perfil e foto opcional.
- `sua-visita.html` — Escolha sua visita, datas/horários da API, modalidade e revisão.

As três entradas usam o mesmo fragmento `components/registration-form.html`, carregado por `scripts/registration/registration-loader.js`, os estilos de `styles/registration.css` e a lógica de `scripts/registration/campaign.js`. O avanço atualiza o endereço com History API, preservando os campos somente na memória da página. Recarregar ou acessar diretamente uma etapa posterior retorna às condições e exige novos aceites. Convites recebidos no fragmento da URL continuam sendo enviados ao backend.

A navegação anterior/próxima utiliza as validações existentes. A configuração, os termos e a disponibilidade vêm de `/locomotiva/config`. Não há horários nem perfis demonstrativos persistidos no site.

Verificação local das etapas em 360, 390, 768, 1024 e 1440 px aprovada com API simulada. Foram conferidos bloqueio sem aceite, avanço, retorno com campos preservados, horários da configuração, acesso direto à etapa posterior e ausência de rolagem horizontal. Envio real e entrega de e-mail não foram exercitados nesta revisão.

## Valida??o do ambiente local em 18/11/2026

Com autoriza??o, foi aplicado somente o SQL de `20261117120000_locomotiva_campaign`, em transa??o, com registro e checksum na tabela de migra??es Prisma. Backup completo local em formato custom foi gerado e seu cat?logo validado antes da altera??o. A API real respondeu HTTP 200 com campanha fechada (`published: false`). A abertura das inscri??es depende das configura??es e termos aprovados no painel.


## Next.js

- `npm.cmd install`: instala as dependências do frontend.
- `npm.cmd run dev`: inicia Next.js em http://127.0.0.1:3002 com o backend local já em execução.
- `npm.cmd run build`: compila o Next.js.
- `npm.cmd start`: serve o build de produção e consulta a API local já em execução.
- `npm.cmd run dev:api`: inicia apenas a API pública local.

O App Router está em `app/`, a configuração em `next.config.mjs` e a inicialização conjunta em `scripts/run-next.cjs`. O Route Handler aceita somente arquivos públicos com extensões permitidas. A API usa rewrite para o Express, configurável por `LOCOMOTIVA_BACKEND_URL` no ambiente do Next.js. A instalação acrescenta Next.js, React e React DOM ao `package.json` e fixa as versões resolvidas em `package-lock.json`. A conversão dos formulários para componentes React não faz parte desta instalação.

Se a porta 3002 estiver ocupada, o comando informa o endereço existente e encerra antes de iniciar novos processos. Encerre a instância anterior com Ctrl+C. Para usar outra porta no Git Bash: `LOCOMOTIVA_WEB_PORT=3003 npm run dev`.


## Publicação na Vercel

O projeto Vercel existente usa Root Directory `.` porque este repositório contém somente o site da campanha. Mantenha o install command `npm ci` e o build command `npm run vercel-build` (também definidos em `vercel.json`). Configure `LOCOMOTIVA_BACKEND_URL` nos ambientes Preview e Production com `https://afiliado.netboxfibra.com.br/api-backend`, sem acrescentar `/locomotiva`. O build falha com uma mensagem explícita se a variável estiver ausente, evitando publicar uma página cuja API aponta para localhost.

Compartilhe o alias estável de Production `https://locomotiva-six.vercel.app`. URLs individuais de deployments Vercel podem exigir login mesmo quando o alias de produção é público; não desative a proteção geral do projeto para contornar isso.

O frontend Vercel reescreve `/locomotiva/*` para o backend existente. O backend precisa estar implantado, acessível por HTTPS e configurado com as variáveis próprias, a migração da campanha e os arquivos públicos necessários. A Vercel não hospeda o PostgreSQL nem inicia o servidor Express por esta configuração.

## Variáveis de ambiente do site

O arquivo local `.env.local` configura `LOCOMOTIVA_BACKEND_URL=http://127.0.0.1:3001` e `LOCOMOTIVA_WEB_PORT=3002`. O modelo versionável é `.env.example`. Os inicializadores usam `@next/env` para carregar o mesmo ambiente do Next.js antes de escolher portas ou consultar a API.

As chamadas do navegador usam `/locomotiva/*` na origem do Next.js e o rewrite encaminha para o backend configurado. O endereço da API permanece no servidor. As credenciais de PostgreSQL e SMTP continuam exclusivamente no ambiente do backend. Reinicie `npm run dev` após editar o ambiente; para produção, refaça o build antes de iniciar.

O padrão local é `LOCOMOTIVA_LOCAL_PREVIEW=false`. Assim a página respeita o estado de inscrições do PostgreSQL local, do mesmo modo que a Vercel respeita o estado do backend de produção. O servidor auxiliar `dev:api` é destinado à prévia via Live Server e deve usar uma porta livre quando o backend completo estiver ativo.

O aviso de inscrições fechadas corresponde a `published: false` retornado pela API. Nesse estado a apresentação da primeira etapa continua visível, com aceites e avanço desabilitados. Configure os termos e demais campos obrigatórios no painel antes de abrir a campanha. O script de cadastro utiliza UTF-8 para preservar os acentos nas mensagens.


## Regulamento baseado no book Locomotiva Creators

As minutas estão em `docs/campanha/regulamento.txt`, `aviso-de-privacidade.txt` e `autorizacao-de-imagem.txt`. O arquivo `configuracao-rascunho.json` contém somente regras extraídas do material enviado, também salvas como revisão 1 no PostgreSQL local, com auditoria e inscrições fechadas. Datas/horários, identificação e contato do responsável, limites de imagem e privacidade, cancelamento e prazos ainda exigem confirmação. SMTP e remetente reais estão pendentes.

A entrega inclui 2 Stories antes da visita, adicionais à escolha presencial entre 4 Stories ou 1 Reels de 60 segundos. A apresentação e a revisão do cadastro explicam essa diferença. Nenhum prazo de permanência ou direito geral de imagem foi presumido. O book descreve área de criador, emissão/baixa de voucher e comprovantes, que não são implementados por esta atualização dos termos.

A revisão 2 do rascunho incorpora as regras aprovadas na conversa: alimentos e bebidas na visita confirmada; cancelamento/reagendamento com 24h; ausência invalida o voucher; Stories por 24h, Reels por 30 dias e comprovações em 48h. A autorização aprovada limita-se ao Instagram orgânico até 30/11/2026, com crédito e sem anúncios ou alteração de sentido. A minuta de privacidade registra retenção operacional de 12 meses após a campanha, mas permanece fora da configuração publicada até identificação e contato do controlador. Não foi encontrado SMTP configurado; o modelo de ambiente do backend contém os campos a preencher.


## Recebimento da solicitação e controles de visita

As três etapas usam o diálogo de erro do formulário compartilhado. Erros de campos obrigatórios, validação, foto ou envio exibem o detalhe em vermelho. O botão Fechar mensagem e a tecla Esc fecham o diálogo. Para erros de campo, o foco retorna ao controle correspondente.

`solicitacao-recebida.html` é a quarta tela. O resumo com data, período, modalidade, e-mail e protocolo é preenchido por `scripts/registration/receipt.js` somente após resposta de sucesso da API. Os dados ficam na memória da página. Abrir diretamente ou recarregar essa URL apresenta uma orientação para concluir o cadastro, sem inventar uma confirmação ou persistir dados pessoais no histórico da URL.

`scripts/registration/visit-controls.js` adiciona controles de período, horário e modalidade, vinculados aos selects nativos existentes. Os horários são derivados das opções retornadas pela configuração da API. A preferência por movimento reduzido é respeitada e os estados selecionados usam `aria-pressed`.

O botão de participação da apresentação segue para `condicoes.html`; a confirmação mantém a situação **Em análise**, sem afirmar visita confirmada ou voucher liberado.

Verificação das quatro telas em 360, 390, 768, 1024 e 1440 px com API de teste local, sem gravar inscrições reais nem enviar e-mails. Foram conferidos aceites, avanço, controles de horários da API, resumo recebido, IDs únicos e ausência de rolagem horizontal. Capturas móveis foram inspecionadas. O estado real de abertura da campanha continua sendo definido no backend.

A primeira etapa não é mais substituída por um aviso de inscrições fechadas. A página mostra a proposta e o voucher mesmo com `published: false`. Documentos não publicados recebem uma indicação de indisponibilidade, sem exibir campos vazios ou rascunhos. O backend continua recusando inscrições até a abertura real.


## Prévia local das etapas

`LOCOMOTIVA_LOCAL_PREVIEW=true` habilita navegação por Condições, Seus dados e Sua visita somente no Next.js em modo development e acessado por loopback. As páginas recebem um marcador de prévia gerado no servidor. O endpoint local `preview-config.json` lê o rascunho e a minuta de privacidade de `docs/campanha/`, identificados como simulação, sem publicar a campanha. Em produção o endpoint retorna 404.

O backend mantém `published: false` e o envio permanece bloqueado. Não são criados horários fictícios. A seleção da visita depende dos horários reais configurados no painel. Para desativar, use `LOCOMOTIVA_LOCAL_PREVIEW=false` e reinicie o desenvolvimento.

Na prévia local, o botão **Escolher visita (prévia)** permite avançar sem preencher dados pessoais ou validar o Instagram. A campanha publicada exige os campos obrigatórios, e-mails coincidentes e um link válido de perfil. O envio real permanece bloqueado na prévia.

Na prévia local, abrir diretamente ou recarregar `seus-dados.html` e `sua-visita.html` mantém a etapa solicitada. Os campos pessoais não são persistidos ao recarregar. No cadastro real, o acesso direto continua iniciando pelas condições.

## Layout da sele??o da visita

A etapa 3 segue a refer?ncia fornecida: grade com dez datas em duas linhas, seletor Almo?o/Jantar, grade de hor?rios em tr?s colunas, modalidades exclusivas e resumo com foto. Os estilos est?o em `styles/visit-step.css`. A sele??o mant?m os selects nativos para valida??o e acessibilidade. O resumo detalhado fica em um painel expans?vel.

Somente na pr?via local, quando n?o h? disponibilidade real, s?o exibidas as datas e seis hor?rios de almo?o da refer?ncia. Os dias 21 e 22 aparecem indispon?veis e o dia 24 ?s 12h ? selecionado inicialmente para demonstrar o layout. N?o s?o hor?rios publicados, n?o s?o persistidos no banco e n?o habilitam envio real. O jantar permanece sem hor?rios at? configura??o.

A tela de recebimento utiliza `styles/receipt.css` e os dados retornados pela API. O status real permanece **Em análise**. Na prévia local, o botão **Simular envio (prévia)** permite visualizar a composição com a visita selecionada, identificado como **Simulação local**, sem requisição de cadastro, envio de e-mail ou protocolo fictício. Os estilos antigos dessa tela foram retirados de `registration.css` e centralizados em `receipt.css`.

A composição do recebimento foi validada em 360, 390, 768, 1024 e 1440 px, com IDs únicos e sem rolagem horizontal. A simulação usa os dados selecionados e não gera protocolo. A renderização do estado real foi exercitada com uma resposta de teste, sem envio de inscrição ou e-mail.

A composição final do recebimento segue as proporções da referência: placa da logo no cabeçalho, cartão marfim com borda cobre, quatro linhas com ícone e divisória, contato/protocolo na mesma linha e foto gastronômica abaixo do cartão. A prévia mantém o mesmo título e status da composição, com faixa externa identificando a simulação e protocolo explicitamente não gerado.


## Layout dos dados pessoais

Na etapa 2, o CPF recebe a máscara `000.000.000-00` durante a digitação. Os dígitos verificadores são conferidos quando o número está completo. Um CPF incompleto ou inválido bloqueia o avanço e abre o modal de erro ao tentar continuar. A API confirma a validade novamente no envio.

A etapa 2 utiliza `styles/personal-step.css`, isolada por `data-registration-step="2"`, para reproduzir a referência: placa da marca, cartão marfim com borda interna, campos em uma coluna, Cidade/UF na mesma linha, nome e foto no cartão de perfil, upload opcional e botões Voltar/Escolher visita lado a lado.

O nome do cartão acompanha a digitação. A foto continua sendo opcional e fornecida pelo usuário; o ícone é exibido quando não há imagem. **Conferir perfil** valida o usuário/link e apresenta um link externo para o perfil informado. Nenhum nome, CPF, e-mail ou retrato ilustrativo foi inserido como dado inicial.

Verificações em 360, 390, 768, 1024 e 1440 px aprovaram alinhamento Cidade/UF, nome dinâmico, navegação, preservação de dados ao voltar, IDs únicos e ausência de rolagem horizontal. A captura móvel foi revisada. O envio real da campanha não foi exercitado.


## Layout das condições

A primeira etapa usa `styles/conditions-step.css`: fundo escuro, indicador circular de três etapas, fotografia com voucher sobreposto, três blocos expansíveis e aceites agrupados em cartão marfim. Os textos mantêm os 2 Stories de aquecimento aprovados, além da modalidade presencial.

**Ler termo completo** abre um diálogo nativo com os documentos carregados pela API ou pelo rascunho identificado da prévia local. O diálogo suporta Escape e botão de retorno. O aviso de aprovação acompanha o cartão de aceites na etapa 1 e volta à área de ações nas demais etapas.

Verificações em 360, 390, 768, 1024 e 1440 px aprovaram abertura/fechamento dos documentos, bloqueio sem aceites, avanço para dados pessoais, IDs únicos e ausência de rolagem horizontal. Captura móvel revisada. Nenhum cadastro real foi enviado.


## Composições para computador

### Refinamento visual do desktop

O arquivo `styles/desktop-campaign.css` concentra os ajustes a partir de 1000 px: conteúdo centralizado até 1200 px, fundos marfim, cartões com bordas suaves e sombras discretas, campos com altura mínima de 48 px e textos auxiliares legíveis. Os tokens `--desktop-*` padronizam as superfícies, bordas, cobre e sombras. As classes existentes são reaproveitadas; o fluxo, os IDs e as integrações permanecem compartilhados com o mobile.

O cabeçalho mantém a textura oficial, mas a faixa decorativa fixa foi removida no desktop para liberar espaço útil. A fotografia circular decorativa da etapa 3 fica restrita ao layout menor, evitando sobreposição com os benefícios no cabeçalho de PC. O resumo das condições acompanha a própria altura, sem esticar para preencher a coluna.

As referências de PC são aplicadas a partir de 1000 px em `styles/desktop-campaign.css`. As mesmas páginas e os mesmos campos são usados em todas as larguras. As composições incluem convite com foto ampla, condições com cartão lateral, dados pessoais em duas colunas com perfil à direita, seleção de visita com resumo lateral e recebimento com quatro cartões na horizontal e duas fotos.

`scripts/registration/desktop-layout.js` reposiciona o único conjunto de ações e o aviso de aprovação entre as colunas e o fluxo móvel ao mudar de etapa ou largura. Os valores, os aceites e os eventos são preservados. As referências não alteram as regras aprovadas dos 2 Stories de aquecimento nem a ordem real de solicitar visita e aguardar aprovação. A foto do perfil depende de envio pelo participante; não são preenchidos dados ilustrativos.

Verificação nas larguras 360, 390, 768, 1024 e 1440 px passou pelas quatro telas, modal dos documentos, avanço e simulação do recebimento, com IDs únicos e sem rolagem horizontal. Capturas das composições de PC foram inspecionadas. O envio real da campanha não foi exercitado.
