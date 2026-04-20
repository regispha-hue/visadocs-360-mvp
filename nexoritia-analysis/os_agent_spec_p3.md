# Especificação Técnica: OS-Agent - Integração de Mensageria

## 1. Introdução
A integração de mensageria transforma o Allux em um assistente acessível de qualquer lugar, 24/7. O **Gateway de Mensageria** é o componente que recebe comandos de plataformas como Telegram e WhatsApp e os roteia para o Allux Core.

## 2. Arquitetura do Gateway de Mensageria

O Gateway deve ser um processo leve, rodando no ambiente de *self-hosting* do Allux, agindo como um *proxy* seguro.

### 2.1. Funções do Gateway

| Função | Descrição |
| :--- | :--- |
| **Recebimento** | Recebe mensagens via *webhooks* ou APIs das plataformas (Telegram Bot API, WhatsApp Cloud API). |
| **Autenticação** | Verifica o `User ID` e o `Work ID` para garantir que apenas usuários autorizados enviem comandos. |
| **Roteamento** | Encaminha a mensagem para o Allux Core (API interna). |
| **Resposta** | Recebe a resposta do Allux Core e a envia de volta ao usuário na plataforma de origem. |

### 2.2. Fluxo de Comando (End-to-End)

1. **Usuário:** Envia `Organize downloads` via Telegram.
2. **Gateway:** Recebe, autentica e envia para o Allux Core.
3. **Allux Core:** Processa (OS-Memory, OS-RADAR, OS-Agent).
4. **OS-Agent:** Executa a Skill `file_organizer`.
5. **Allux Core:** Gera a resposta final (`Downloads organizados de acordo com o Axioma X`).
6. **Gateway:** Envia a resposta de volta ao Telegram.

## 3. Interface de Comando (Mensageria)

A interface deve ser simples e focada em comandos de alto nível.

| Tipo de Comando | Exemplo | Módulo Allux Envolvido |
| :--- | :--- | :--- |
| **Comando de Execução** | `Organize downloads` | OS-Agent |
| **Comando de Consulta** | `FRAG-ALL Mãe dos Sete` | FRAG |
| **Comando de Estado** | `Qual o status da Obra A?` | OS-Memory |
| **Comando de Governança** | `Aprovar novo axioma` | OS-RADAR |

## 4. Posicionamento Estratégico
A integração de mensageria garante que o Allux seja um **Assistente Pessoal Ubíquo**. Ele permite que o usuário governe seu universo ontológico e execute tarefas de qualquer lugar, a qualquer momento, transformando o celular em um **Terminal de Comando Canônico**. O Allux se torna o **Terminal Ubíquo** da Nexoritmologia.
