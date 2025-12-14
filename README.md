# Sena & Caetano – Landing + Obrigado

Fluxo de captura configurado para enviar leads ao Apps Script (Google Sheets) com redirecionamento controlado pelo front-end e integração downstream (Zapier → HubSpot → WhatsApp).

## Estrutura de pastas
- `/index.html`: landing com Leadster, Pixel Meta (1168676065407223) e GTM (GTM-5MJSWJBM). O formulário envia via `fetch` para o Apps Script e faz o redirect para `/obrigado` com base no JSON de resposta.
- `/obrigado/index.html`: página de obrigado sem Leadster/WhatsApp, disparando `CompleteRegistration` no carregamento.
- `/assets/img`: imagens usadas na landing.
- `/apps-script/Code.gs`: código a ser publicado como Web App no Apps Script.
- `vercel.json`: garante que `/obrigado` e `/obrigado/` carreguem `obrigado/index.html` sem precisar da extensão.

## Deploy na Vercel
1. Conecte o repositório à Vercel e publique como projeto estático.
2. Certifique-se de que a raiz do projeto é `/` (não use subpasta).
3. O arquivo `vercel.json` já trata a rota `/obrigado`.
4. Após deploy, valide no Tag Assistant que o GTM (GTM-5MJSWJBM) está disparando e que o Pixel recebe `PageView`.

## Fluxo do formulário
- **Endpoint:** `https://script.google.com/macros/s/AKfycby9jNVfUTBcKMb_zkJ01mfbWN2ku-_YnCXxPSkv5kqrV3JOo_JaWSV-7E2As8qs7icHTQ/exec`.
- **Formato:** `fetch` com `application/json`; o Apps Script aceita JSON e `application/x-www-form-urlencoded`.
- **Campos enviados:** `nome`, `whatsapp` (apenas dígitos), `email`, `audience`, `page`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `referrer`, `user_agent`.
- **UX:** botão desabilita e mostra “Enviando…”; em sucesso, o front redireciona para `/obrigado` usando o `redirect` retornado no JSON. Em erro, o botão é reativado e uma mensagem de falha é exibida.
- **Tracking:** `PageView` na carga; `Lead` somente em submit válido. Os dados do lead são armazenados em `localStorage` (`sc_lead_noivos`) para personalizar a página de obrigado.

## Apps Script (Web App)
1. Abra `apps-script/Code.gs` e substitua `PASTE_GOOGLE_SHEET_ID_HERE` pelo ID real da planilha. Ajuste `SHEET_NAME` se a aba tiver outro nome.
2. Publique como **Web App** (Deploy > New deployment) com acesso **Anyone** (ou Anyone with link) e copie o URL da execução (deve bater com o endpoint do formulário).
3. O script aceita `POST` JSON ou formulário, normaliza telefone, cria header se não existir e grava colunas fixas: `TIMESTAMP, NOME, EMAIL, WHATSAPP, UTM_SOURCE, UTM_MEDIUM, UTM_CAMPAIGN, UTM_CONTENT, UTM_TERM, REFERRER, USER_AGENT, AUDIENCE, PAGE, DEBUG_STATUS`.
4. Resposta JSON: `{ ok: true, redirect: "https://www.senaecaetano.com.br/obrigado" }` com CORS liberado para `fetch`.

## Testes manuais (checklist)
- Abrir a landing (`/index.html`), preencher nome, e-mail e WhatsApp válidos, enviar e confirmar redirect para `/obrigado` sem Leadster/WhatsApp.
- Conferir no Google Sheets se a nova linha contém nome, e-mail, WhatsApp (apenas dígitos) e UTMs/referrer/UA preenchidos.
- Validar no log do Apps Script (Executions) que `Normalized payload` aparece e `Row appended` foi registrado.
- Garantir que o botão volta ao estado original em caso de erro (alerta exibido).

## Teste automatizável (curl)
Use o endpoint publicado do Apps Script (ajuste se o deployment gerar URL diferente):

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste QA",
    "email": "qa@example.com",
    "whatsapp": "+55 (11) 99999-9999",
    "utm_source": "curl",
    "utm_medium": "manual",
    "utm_campaign": "qa",
    "utm_content": "post",
    "utm_term": "zap",
    "referrer": "https://www.senaecaetano.com.br",
    "user_agent": "curl",
    "audience": "noivos",
    "page": "lp_noivos"
  }' \
  "https://script.google.com/macros/s/AKfycby9jNVfUTBcKMb_zkJ01mfbWN2ku-_YnCXxPSkv5kqrV3JOo_JaWSV-7E2As8qs7icHTQ/exec"
```

Resultado esperado: resposta JSON `{ "ok": true, "redirect": "https://www.senaecaetano.com.br/obrigado", ... }` e linha criada na planilha.

## Integração Zapier → HubSpot → WhatsApp
1. **Trigger:** *Google Sheets – New Spreadsheet Row* na planilha usada pelo Apps Script (aba definida em `SHEET_NAME`).
2. **Ação 1:** *HubSpot – Create/Update Contact*. Mapear `email` como identificador principal; preencher `firstname`/`lastname` a partir de `nome` (ou `Full name`), e `phone` com `whatsapp`. Mapeie UTMs/referrer se desejar acompanhar origem.
3. **Filtro opcional:** Adicione um filtro para ignorar linhas cujo `whatsapp` seja um número interno de teste (ex.: o número do Bruno) ou quando `ok`/`DEBUG_STATUS` indicarem falha.
4. **Ação 2:** *WhatsApp via provedor Zapier* (Twilio/360dialog/MessageBird). Enviar mensagem usando `whatsapp` (apenas dígitos) e personalize com `nome`/`campaign`.
5. Publique o Zap e valide criando uma linha de teste via `curl` ou pelo formulário. Confirme no histórico do Zapier que o trigger dispara, HubSpot recebe/atualiza o contato e a etapa de WhatsApp é executada.

## Página /obrigado
- Sem Leadster e sem qualquer botão/link de WhatsApp.
- Pixel Meta e GTM instalados com os mesmos IDs da landing.
- Dispara `fbq('track', 'CompleteRegistration')` ao carregar.
- Lê `localStorage` apenas para exibir “Obrigado, [Nome]” (sem reenvio).

## Checklist de QA
- Landing abre sem downloads indevidos; GTM e Pixel recebem `PageView`.
- Submit com campos válidos: Pixel dispara `Lead` uma única vez, Apps Script grava linha no Sheets com UTMs/referrer/UA e o front redireciona para `/obrigado` (sem Leadster/WhatsApp).
- `/obrigado` exibe mensagem simples e dispara `PageView` + `CompleteRegistration`.

## Integração Zapier → HubSpot → WhatsApp (documentação)
1. **Trigger:** *New Spreadsheet Row in Google Sheets* (planilha alimentada pelo Apps Script acima).
2. **Ação 1:** *Create/Update Contact in HubSpot* usando e-mail/WhatsApp como identificador. Mapear também UTMs, referrer e audience/page.
3. **Filtro opcional:** pular execuções quando `whatsapp` for o seu número pessoal para testes internos.
4. **Ação 2:** enviar mensagem de WhatsApp via provedor disponível no Zapier (ex.: Twilio/360dialog/MessageBird), usando o número capturado. Incluir no template nome e contexto do lead.

> Observação: todo o tracking (GTM + Pixel) já está instalado no código. Zapier/HubSpot ficam apenas na automação externa, consumindo a linha criada no Sheets.
