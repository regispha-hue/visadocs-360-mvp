# Mecanismo de Persistência Trans-Ambiente (Cross-Sandbox Persistence)

## 1. Introdução
A Persistência Trans-Ambiente é a capacidade do Allux de garantir que o IP e o conhecimento gerado em um ambiente de execução temporário (sandbox) sejam transferidos de forma segura e canônica para um novo ambiente, quebrando o isolamento físico.

## 2. O Ciclo de Vida do IP (OS-Notarius e OS-Recruiter)

O conhecimento gerado em um sandbox é tratado como um artefato de IP que deve ser persistido e recrutável.

### 2.1. Persistência de Saída (Sandbox -> Allux Core)
1. **Geração no Sandbox:** O LLM gera código, arquivos ou artefatos dentro do ambiente de execução (sandbox).
2. **Registro Automático:** O Allux Core (rodando fora do sandbox) monitora a saída. O **OS-Notarius** hashea, assina e ancora o artefato, registrando-o no `Canon Registry`.
3. **Persistência de Arquivo:** O arquivo físico é movido do sistema de arquivos temporário do sandbox para o armazenamento persistente do Allux (e.g., S3, IPFS).

**Resultado:** O IP gerado no sandbox é imediatamente persistido, assinado e ancorado, tornando-o imutável e rastreável.

### 2.2. Recrutamento de Entrada (Allux Core -> Novo Sandbox)
1. **Início do Novo Sandbox:** O usuário inicia um novo ambiente de execução (sandbox).
2. **Recrutamento:** O Allux Core usa o **OS-Recruiter** para "recrutar" o IP canônico da `Work` ativa.
3. **Download Verificado:** O Allux baixa os artefatos persistidos (código, arquivos) do armazenamento persistente.
4. **Verificação de Integridade:** O Allux verifica o hash do arquivo baixado contra o `AuthProof` ancorado pelo OS-Notarius.
5. **Injeção no Sandbox:** Apenas os arquivos verificados são injetados no novo ambiente de execução.

**Resultado:** O novo sandbox recebe uma cópia verificada e canônica do IP, garantindo que o trabalho continue a partir de uma base de conhecimento confiável.

## 3. Portabilidade de Kernel (OS-FactoringKernel)

A portabilidade do Allux em si é garantida pelo **OS-FactoringKernel**.

*   **Exportação:** O Allux Core (com todos os seus axiomas, memória e lógica) é empacotado em um **FKP (FactoringKernel Package)** assinado pelo OS-Notarius.
*   **Importação:** O FKP pode ser importado para qualquer servidor ou ambiente de execução (VPS, Mac Mini, Nuvem), criando uma nova instância do Allux com todo o conhecimento e determinismo.

**Conclusão:** O Allux trata o sandbox como um **processador descartável**. O conhecimento é persistido fora dele, e o novo ambiente de execução é "bootado" com o conhecimento canônico e verificado. O Allux vence o isolamento de ambiente ao externalizar a soberania do IP.
