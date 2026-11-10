# Schesman Advocacia — site institucional

Site institucional para escritório de advocacia, com página pública, agendamento online e painel administrativo para o próprio escritório editar o conteúdo.

O projeto foi feito apenas com **HTML, CSS e JavaScript**, sem back-end e sem banco de dados. Todo o conteúdo, as configurações e os agendamentos ficam salvos no **localStorage** do navegador.

> **Importante:** o site não usa fotos de pessoas. A identidade visual é composta por monograma, ícones em SVG e formas gráficas. A logo definitiva pode ser enviada pelo painel.

---

## Site online

- **Site publicado:** https://gabsdelo.github.io/schesman-advocacia/
- **Repositório:** https://github.com/GabsDelo/schesman-advocacia
- **Origem da publicação:** branch `main`, pasta `docs/`

A pasta `docs/` contém apenas a versão pública do site. O painel administrativo (`admin.html`) **não é publicado**, para não expor a área restrita. O painel continua disponível localmente pelo `iniciar-site.bat`.

> A versão online é estática: o agendamento é salvo no navegador do visitante e não chega ao escritório. Para receber agendamentos de verdade, é necessário um back-end.

---

## 1. Como abrir o site

### Opção recomendada — Windows

Dê um duplo clique em **`iniciar-site.bat`**.

O atalho:

1. inicia um servidor local (porta `8080` ou a próxima porta livre);
2. abre o navegador automaticamente;
3. mantém o site e o painel compartilhando os mesmos dados.

A janela do atalho mostra a URL exata usada. Para encerrar, feche a janela preta do servidor.

### Opção manual

No terminal, dentro desta pasta:

```bash
python -m http.server 8080
```

Depois abra:

- Site: `http://localhost:8080`
- Painel: `http://localhost:8080/admin.html`

### Por que não abrir com duplo clique no `index.html`?

Ao abrir diretamente como arquivo (`file://`), alguns navegadores bloqueiam ou isolam o `localStorage`. O site pode até aparecer, mas o painel e a página pública podem não compartilhar os dados. Use sempre o servidor local — ou um endereço de hospedagem.

---

## 2. Acesso ao painel

1. Abra `http://localhost:8080/admin.html`.
2. Digite a senha padrão: **`admin123`**.
3. Altere a senha em **Configurações → Senha do painel**.

O link **“Área do administrador”** aparece no rodapé do site local. Na versão publicada no GitHub Pages, ele é removido de propósito.

> A senha é verificada no próprio navegador. Ela serve para evitar acesso casual, mas **não é uma proteção de servidor**. Para uso profissional com dados reais, é necessário um back-end com autenticação.

---

## 3. O que pode ser editado no painel

| Seção | O que altera |
| --- | --- |
| **Visão geral** | Resumo dos agendamentos e atalhos |
| **Agendamentos** | Confirmar, cancelar, excluir, buscar, filtrar e exportar CSV |
| **Identidade** | Nome, nome curto, monograma, assinatura, OAB, logo e cores |
| **Contato & redes** | Telefone, WhatsApp, e-mail, endereço, horário e Instagram |
| **Página inicial** | Textos do topo, seção “O escritório” e faixa de compromissos |
| **Áreas de atuação** | Cartões do site e opções do formulário de agendamento |
| **Perguntas frequentes** | Perguntas e respostas |
| **Horários** | Dias de atendimento, início, fim, duração, pausa e antecedência |
| **Configurações** | Senha, backup, restauração e limpeza dos dados |

As alterações de conteúdo só são aplicadas ao site depois de clicar em **Salvar alterações**.

### Logo

- Formatos aceitos: PNG, JPG, WEBP ou SVG.
- Tamanho máximo: **400 KB**.
- Se nenhuma logo for enviada, o site usa o monograma configurado (por padrão, “S”).

### Instagram

Cole o link completo do perfil, por exemplo:

```text
https://www.instagram.com/schesmanadvocacia
```

Também é aceito apenas `@schesmanadvocacia` ou `instagram.com/schesmanadvocacia` — o site normaliza o endereço. Se o campo ficar vazio, os botões e o cartão do Instagram são ocultados.

### Cores

As cores usam o formato hexadecimal (`#RRGGBB`). A prévia no painel mostra como o site ficará antes de salvar.

---

## 4. Como funciona o agendamento

O visitante escolhe:

1. nome, e-mail e telefone;
2. área de interesse;
3. data disponível;
4. formato: presencial ou online;
5. horário livre;
6. mensagem opcional.

Ao enviar, o pedido recebe um protocolo (ex.: `AG-261110-1234`) e fica com status **Pendente** no painel. O escritório pode **confirmar** ou **cancelar** o horário.

Regras configuráveis em **Horários**:

- dias da semana com atendimento;
- horário de início e fim;
- duração de cada consulta (30, 45, 60 ou 90 minutos);
- pausa de almoço;
- antecedência máxima em dias;
- ativação ou desativação do agendamento online.

Horários já ocupados por agendamentos pendentes ou confirmados ficam bloqueados automaticamente. Agendamentos cancelados liberam o horário.

O visitante também pode baixar um arquivo `.ics` para adicionar a consulta ao calendário.

### Limitação importante

Como os dados ficam no `localStorage`:

- os agendamentos são vistos **apenas no mesmo navegador e no mesmo computador**;
- limpar os dados do navegador apaga conteúdo e agendamentos;
- o painel não recebe notificações por e-mail ou WhatsApp;
- não há envio automático de confirmação ao cliente.

Para uso real com vários dispositivos, clientes agendando de qualquer lugar e edição segura, será necessário conectar um back-end (Node.js, Supabase, Firebase ou equivalente) e um banco de dados.

---

## 5. Backup e restauração

Em **Configurações → Backup e restauração**:

- **Exportar backup** gera um arquivo JSON com o conteúdo do site, as configurações e os agendamentos;
- **Importar backup** restaura o arquivo (a senha atual do painel é mantida);
- o backup **não inclui a senha**.

Recomenda-se exportar um backup antes de:

- trocar de computador ou navegador;
- limpar os dados do navegador;
- restaurar o conteúdo padrão;
- apagar todos os agendamentos.

---

## 6. Estrutura do projeto

```text
site juridico/
├── index.html          # Página pública (versão local)
├── admin.html          # Painel administrativo (não publicado)
├── iniciar-site.bat    # Atalho para servidor local no Windows
├── README.md
├── .gitignore
├── docs/               # Versão publicada no GitHub Pages
│   ├── index.html
│   ├── .nojekyll
│   ├── css/style.css
│   └── js/             # icons.js, data.js e main.js
├── css/
│   ├── style.css       # Estilos do site
│   └── admin.css       # Estilos do painel
└── js/
    ├── icons.js        # Ícones SVG
    ├── data.js         # Conteúdo padrão e localStorage
    ├── main.js         # Renderização do site e agendamento
    └── admin.js        # Login, editores, agendamentos e backup
```

Chaves usadas no navegador:

- `schesman_site_v1` — conteúdo e configurações do site;
- `schesman_appointments_v1` — agendamentos;
- `schesman_admin_session` — sessão do painel (sessionStorage).

---

## 7. Publicação

O site está publicado no **GitHub Pages**:

- **URL:** https://gabsdelo.github.io/schesman-advocacia/
- **Repositório:** https://github.com/GabsDelo/schesman-advocacia
- **Configuração:** branch `main`, pasta `/docs`

Para atualizar o site publicado:

1. edite os arquivos da pasta `docs/` (ou copie a versão atualizada de `index.html`, `css/` e `js/`);
2. execute:

```bash
git add .
git commit -m "Atualiza o site"
git push
```

O GitHub Pages reconstrói a página automaticamente em alguns minutos.

Pontos de atenção:

1. **O painel não é publicado** e não deve ser exposto como está, porque a senha fica no JavaScript do navegador. Use-o apenas localmente ou proteja o acesso por um back-end.
2. **Os dados não são compartilhados entre dispositivos** enquanto não houver banco de dados. O agendamento feito no site online fica apenas no navegador do visitante.
3. A versão publicada em `docs/` contém somente o site público, com os links de administrador removidos.
4. Para publicar em outro serviço (Netlify, Vercel etc.), envie a pasta `docs/` ou a raiz do projeto, mantendo a estrutura de `css/` e `js/`.

Se o objetivo for um site profissional com agendamentos reais, o próximo passo é criar uma API com banco de dados e autenticação. A interface atual já serve como base visual e funcional.

---

## 8. Checklist do que o cliente ainda deve enviar

- [ ] Logo do escritório (PNG, JPG, WEBP ou SVG, até 400 KB)
- [ ] Link do Instagram
- [ ] Cores oficiais da marca (principal, destaque e fundo)
- [ ] Nome completo do escritório
- [ ] Número da OAB
- [ ] Telefone e WhatsApp com DDD
- [ ] E-mail profissional
- [ ] Endereço completo (ou indicação de atendimento apenas online)
- [ ] Horário real de atendimento
- [ ] Áreas de atuação confirmadas
- [ ] Textos institucionais revisados
- [ ] Perguntas frequentes revisadas
- [ ] Confirmar que o site deve continuar **sem fotos de pessoas** (conforme definido)
- [ ] Senha definitiva do painel

---

## 9. Personalização rápida sem o painel

O conteúdo padrão fica em `js/data.js`, no objeto `DEFAULT_DATA`. Ele é usado quando ainda não há dados salvos no navegador. Depois que o painel salva algo, o `localStorage` passa a ter prioridade.

Para voltar ao conteúdo padrão:

1. abra o painel;
2. vá em **Configurações → Zona de risco**;
3. clique em **Restaurar** no item “Restaurar conteúdo padrão”.

Ou, no console do navegador:

```js
localStorage.removeItem("schesman_site_v1");
location.reload();
```

---

## 10. Solução de problemas

**O site abre, mas o painel não mostra os agendamentos.**
Confirme que os dois estão no mesmo endereço (`http://localhost:8080`) e no mesmo navegador.

**As alterações não aparecem no site.**
Clique em **Salvar alterações** no painel e recarregue o site com `Ctrl + F5`.

**O `iniciar-site.bat` fecha sozinho.**
Verifique se o Python está instalado e disponível no PATH. Teste no terminal:

```bash
python --version
```

**A porta 8080 está em uso.**
Feche o outro servidor ou execute manualmente em outra porta:

```bash
python -m http.server 8081
```

E acesse `http://localhost:8081`.

**A logo não carrega.**
Confira se o arquivo tem até 400 KB e está em PNG, JPG, WEBP ou SVG.

**Esqueci a senha do painel.**
Como os dados ficam no navegador, será necessário limpar a chave do site ou importar um backup. Em último caso, no console do navegador:

```js
localStorage.removeItem("schesman_site_v1");
location.reload();
```

Isso restaura o conteúdo padrão e a senha `admin123`, mas apaga as personalizações (os agendamentos permanecem).

---

## 11. Aviso profissional

Este site tem caráter informativo, em conformidade com o Código de Ética e Disciplina da OAB. Não há promessa de resultado, captação de clientela ou divulgação de casos concretos.

Os textos padrão são genéricos e devem ser revisados pelo responsável do escritório antes da publicação.
