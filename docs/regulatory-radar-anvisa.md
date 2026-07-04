# Radar ANVISA

O Radar ANVISA executa uma triagem automatizada de fontes oficiais para localizar candidatos regulatorios relevantes a farmacias e farmacias de manipulacao.

## Fluxo operacional

1. Coleta candidatos em fontes oficiais da ANVISA e do Diario Oficial da Uniao.
2. Classifica o candidato por tipo, categoria regulatoria e termos de impacto.
3. Procura POPs do tenant que possam estar relacionados ao tema.
4. Registra a norma em `Norma` com codigo `RADAR-ANVISA-*`.
5. Cria `AlertaNorma` para triagem do RT/administrador.

## Limite de responsabilidade

O radar nao altera POPs, treinamentos ou documentos automaticamente. Ele gera uma sugestao de triagem regulatoria. A decisao de atualizar POPs, exigir treinamento ou abrir plano de acao deve ser revisada e aprovada pelo RT ou administrador responsavel.

## Cron

Endpoint:

```txt
/api/cron/anvisa-radar
```

Autorizacao em producao:

```txt
Authorization: Bearer <CRON_SECRET>
```

Agenda Vercel inicial:

```txt
0 8 * * *
```

