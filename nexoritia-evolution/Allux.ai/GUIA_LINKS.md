# 📋 GUIA — Como Enviar Links para Claude Code

Criei **2 arquivos** para facilitar a comunicação com Claude Code:

---

## ARQUIVO 1: `MENSAGEM_CLAUDE_CODE.txt` 

**USO:** Copiar e colar DIRETO na conversa com Claude Code

### Passo-a-passo:

1. **Abra** o arquivo `MENSAGEM_CLAUDE_CODE.txt`

2. **Edite** apenas 2 linhas:
   ```
   📂 REPOSITÓRIO GITHUB
   [COLE A URL DO SEU REPOSITÓRIO AQUI]
   ```
   Substitua por: `https://github.com/seu-usuario/seu-repo`
   
   ```
   Link direto:
   [COLE O LINK AQUI]
   ```
   Substitua por: `https://github.com/seu-usuario/seu-repo/blob/main/START_HERE.md`

3. **Copie** TODO o conteúdo do arquivo

4. **Cole** na conversa do Claude Code

5. **Envie** a mensagem

---

## ARQUIVO 2: `LINKS_CLAUDE_CODE.md`

**USO:** Referência completa de todos os links do projeto

### Passo-a-passo:

1. **Abra** o arquivo `LINKS_CLAUDE_CODE.md`

2. **Substitua** em TODO o arquivo:
   - `[USUARIO]` → seu usuário GitHub (ex: `regis`)
   - `[REPO]` → nome do repositório (ex: `allux-ai`)

3. **Opcional:** Pode subir este arquivo no repo também para referência

---

## EXEMPLO PRÁTICO

Se seu repositório é: `https://github.com/regis/allux-ai`

### No arquivo MENSAGEM_CLAUDE_CODE.txt, mude:

**Antes:**
```
📂 REPOSITÓRIO GITHUB
[COLE A URL DO SEU REPOSITÓRIO AQUI]
```

**Depois:**
```
📂 REPOSITÓRIO GITHUB
https://github.com/regis/allux-ai
```

**Antes:**
```
Link direto:
[COLE O LINK AQUI]
Formato: https://github.com/[USUARIO]/[REPO]/blob/main/START_HERE.md
```

**Depois:**
```
Link direto:
https://github.com/regis/allux-ai/blob/main/START_HERE.md
```

### No arquivo LINKS_CLAUDE_CODE.md, substitua:

**Todos os lugares** onde aparece:
- `[USUARIO]` → `regis`
- `[REPO]` → `allux-ai`

Resultado:
```
https://github.com/regis/allux-ai/blob/main/START_HERE.md
https://github.com/regis/allux-ai/blob/main/CLAUDE_CODE_INSTRUCTIONS.md
https://github.com/regis/allux-ai/blob/main/CANON_V1.0.json
...
```

---

## ALTERNATIVA: Comando Find & Replace

Se preferir, use substituição automática:

### macOS/Linux:
```bash
# Editar MENSAGEM_CLAUDE_CODE.txt
sed -i 's|\[USUARIO\]|regis|g' MENSAGEM_CLAUDE_CODE.txt
sed -i 's|\[REPO\]|allux-ai|g' MENSAGEM_CLAUDE_CODE.txt

# Editar LINKS_CLAUDE_CODE.md
sed -i 's|\[USUARIO\]|regis|g' LINKS_CLAUDE_CODE.md
sed -i 's|\[REPO\]|allux-ai|g' LINKS_CLAUDE_CODE.md
```

### Windows (PowerShell):
```powershell
# Editar MENSAGEM_CLAUDE_CODE.txt
(Get-Content MENSAGEM_CLAUDE_CODE.txt) -replace '\[USUARIO\]', 'regis' -replace '\[REPO\]', 'allux-ai' | Set-Content MENSAGEM_CLAUDE_CODE.txt

# Editar LINKS_CLAUDE_CODE.md
(Get-Content LINKS_CLAUDE_CODE.md) -replace '\[USUARIO\]', 'regis' -replace '\[REPO\]', 'allux-ai' | Set-Content LINKS_CLAUDE_CODE.md
```

---

## O QUE ACONTECE DEPOIS

Após enviar a mensagem para Claude Code:

1. **Claude Code lê** o contexto completo
2. **Claude Code abre** START_HERE.md
3. **Claude Code escolhe**: validação rápida ou roteiro completo
4. **Claude Code segue** CLAUDE_CODE_INSTRUCTIONS.md
5. **Claude Code executa** AÇÃO 1-4 (deploy em ~40 min)
6. **Claude Code reporta** status após cada ação

---

## FORMATO DE RESPOSTA ESPERADO DO CLAUDE CODE

Você deve receber algo assim:

```
AÇÃO 1: COMPLETA
- Duração: 4 minutos
- Resultado: Demo executou com sucesso, 6 testes passaram
- Problemas: nenhum
- Próximo passo: AÇÃO 2

AÇÃO 2: COMPLETA
- Duração: 8 minutos
- Resultado: Estrutura de diretórios criada, imports ajustados
- Problemas: nenhum
- Próximo passo: AÇÃO 3
```

---

## TROUBLESHOOTING

**Q: Claude Code não encontrou os arquivos**
- Confirme que todos os 15 arquivos estão no repositório
- Verifique se o branch é `main` (não `master`)
- Confirme URLs com `blob/main/` no caminho

**Q: Claude Code não sabe o que fazer**
- Reenvie a mensagem apontando especificamente para START_HERE.md
- Peça para "ler o arquivo START_HERE.md e seguir as instruções"

**Q: Links quebrados no GitHub**
- Verifique se fez commit e push de todos os arquivos
- Aguarde ~30 segundos após push para GitHub atualizar

---

## RESUMO ULTRA-RÁPIDO

1. **Edite** MENSAGEM_CLAUDE_CODE.txt com seu repo
2. **Copie** todo o conteúdo
3. **Cole** na conversa do Claude Code
4. **Aguarde** Claude Code executar AÇÃO 1-4
5. **Pronto** — sistema em produção em ~40 minutos

---

**Boa sorte com o deploy!** 🚀
