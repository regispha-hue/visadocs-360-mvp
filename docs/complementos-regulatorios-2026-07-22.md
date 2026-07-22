# Complementos regulatorios - 2026-07-22

Este pacote fecha a primeira camada operacional dos complementos que ainda faltavam para o VISADOCS 360 MVP.

## Entregue

- Radar ANVISA/DOU com coleta HTTP em fontes oficiais, configuravel por `ANVISA_RADAR_SOURCES`.
- Diagnostico do cron do radar com modo de coleta, fontes configuradas, fontes consultadas e candidatos coletados.
- Inbox regulatorio em `/api/regulatorio/inbox`, com listagem de alertas de norma e mudanca de status por RT/admin.
- Scorecard de conformidade em `/api/conformidade/scorecard`, consolidando POPs, versoes aprovadas, treinamentos, certificados, nao conformidades, alertas regulatorios e acervo.
- Pacote inicial de tarefas recorrentes em `/api/conformidade/tarefas-recorrentes`, cobrindo temperatura, cadeia fria, limpeza, agua, calibracao, autoinspecao, treinamentos e triagem regulatoria.

## Limite intencional

Nao foi incluida migracao de banco nesta rodada. As tarefas recorrentes entram como templates operacionais calculados em tempo real. A persistencia de execucao, evidencias de medicao e alertas fora de faixa deve ser implementada na proxima migracao, depois de validar o fluxo em demo/producao restrita.

## Proxima migracao recomendada

Criar modelos `TarefaRecorrente`, `RegistroTarefaRecorrente` e `AlertaOperacional`, vinculados a tenant, setor, responsavel, faixa aceitavel, evidencia e trilha de auditoria.
