# Sena & Caetano – Landing + Obrigado

Estrutura limpa para Vercel com fluxo de captura direto no Apps Script (Google Sheets) e thank you page dedicada.

## Estrutura de pastas
- `/index.html`: landing com Leadster, Pixel Meta (1168676065407223) e GTM (GTM-5MJSWJBM).
- `/obrigado/index.html`: página de obrigado sem Leadster/WhatsApp, disparando `CompleteRegistration` no carregamento.
- `/assets/img`: imagens usadas na landing.
- `vercel.json`: garante que `/obrigado` e `/obrigado/` carreguem `obrigado/index.html` sem precisar da extensão.

## Deploy na Vercel
1. Conecte o repositório à Vercel e publique como projeto estático.
2. Certifique-se de que a raiz do projeto é `/` (não use subpasta).
3. O arquivo `vercel.json` já trata a rota `/obrigado`.
4. Após deploy, valide no Tag Assistant que o GTM (GTM-5MJSWJBM) está disparando e que o Pixel recebe `PageView`.

## Fluxo do formulário
- **Método:** POST padrão para o Apps Script (`https://script.google.com/macros/s/AKfycby9jNVfUTBcKMb_zkJ01mfbWN2ku-_YnCXxPSkv5kqrV3JOo_JaWSV-7E2As8qs7icHTQ/exec`).
- **Formato:** `application/x-www-form-urlencoded` (nativo do form).
- **Campos enviados:** `nome`, `whatsapp` (apenas dígitos), `email`, `audience`, `page`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `referrer`, `user_agent`.
- **UX:** botão desabilita e mostra “Enviando…” durante o envio; sem preventDefault quando o form é válido, permitindo o redirect do Apps Script para `https://www.senaecaetano.com.br/obrigado`.
- **Tracking:** `PageView` na carga; `Lead` somente em submit válido. Os dados do lead são armazenados em `localStorage` (`sc_lead_noivos`) para personalizar a página de obrigado.

## Página /obrigado
- Sem Leadster e sem qualquer botão/link de WhatsApp.
- Pixel Meta e GTM instalados com os mesmos IDs da landing.
- Dispara `fbq('track', 'CompleteRegistration')` ao carregar.
- Lê `localStorage` apenas para exibir “Obrigado, [Nome]” (sem reenvio).

## Checklist de QA
- Landing abre sem downloads indevidos; GTM e Pixel recebem `PageView`.
- Submit com campos válidos: Pixel dispara `Lead` uma única vez, Apps Script grava linha no Sheets com UTMs/referrer/UA e redireciona para `/obrigado`.
- `/obrigado` exibe mensagem simples, sem Leadster/WhatsApp, e dispara `PageView` + `CompleteRegistration`.

## Integração Zapier → HubSpot → WhatsApp (documentação)
1. **Trigger:** *New Spreadsheet Row in Google Sheets* (planilha alimentada pelo Apps Script acima).
2. **Ação 1:** *Create/Update Contact in HubSpot* usando e-mail/WhatsApp como identificador. Mapear também UTMs, referrer e audience/page.
3. **Filtro opcional:** pular execuções quando `whatsapp` for o seu número pessoal para testes internos.
4. **Ação 2:** enviar mensagem de WhatsApp via provedor disponível no Zapier (ex.: Twilio/360dialog/MessageBird), usando o número capturado. Incluir no template nome e contexto do lead.

> Observação: todo o tracking (GTM + Pixel) já está instalado no código. Zapier/HubSpot ficam apenas na automação externa, consumindo a linha criada no Sheets.
