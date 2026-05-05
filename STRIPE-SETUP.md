# Configuração Stripe - VISADOCS

## 🔑 Chave API Recebida

A chave Stripe foi recebida e deve ser configurada no arquivo `.env.local`.

**⚠️ IMPORTANTE:** Nunca commit a chave real no repositório!

---

## 📝 Configuração

### 1. Criar arquivo `.env.local`

Na raiz do projeto, crie/editar o arquivo `.env.local` e adicione:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=mk_1TJBMRLm4YSAuEZlyWrLheyk
STRIPE_PUBLISHABLE_KEY=pk_sua_publishable_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_webhook_secret_aqui
```

### 2. Obter Publishable Key

No [Stripe Dashboard](https://dashboard.stripe.com/apikeys):
- Copie a "Publishable key" (começa com `pk_test_` ou `pk_live_`)
- Cole em `STRIPE_PUBLISHABLE_KEY`

### 3. Configurar Webhook (Desenvolvimento)

```bash
# Instalar Stripe CLI (se ainda não tiver)
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Iniciar listener
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie o `webhook signing secret` exibido e cole em `STRIPE_WEBHOOK_SECRET`.

---

## 🚀 Próximos Passos

### 1. Criar Produtos no Stripe

```bash
# Ou use o Dashboard para criar manualmente:
# Products → Add Product

# Os preços devem ter:
# - Currency: BRL (Real Brasileiro)
# - Recurring: Monthly/Yearly
```

### 2. Seed dos Planos

```bash
# Após configurar o Stripe
npx prisma migrate dev  # Aplicar schema
npx ts-node scripts/seed-plans.ts  # Criar planos
```

### 3. Testar Checkout

1. Acesse o dashboard como SUPER_ADMIN
2. Vá para `/admin/plans`
3. Verifique se os planos estão sincronizados com Stripe
4. Teste o fluxo de checkout

---

## 🧪 Teste com Cartões de Teste

Use estes cartões no modo teste:

| Cartão | CVC | Data | Resultado |
|--------|-----|------|-----------|
| `4242 4242 4242 4242` | Qualquer | Futuro | Sucesso |
| `4000 0000 0000 0002` | Qualquer | Futuro | Recusado |

---

## 📊 Dashboard Stripe

Monitore pagamentos em:
- **Test:** https://dashboard.stripe.com/test/dashboard
- **Live:** https://dashboard.stripe.com/dashboard

---

## 🔒 Segurança

- ✅ `.env.local` está no `.gitignore` (não será commitado)
- ✅ Chave salva apenas localmente
- ✅ Webhook verifica assinatura
- ✅ Apenas SUPER_ADMIN acessa configurações

---

## 🆘 Suporte

Se precisar de ajuda:
- [Stripe Docs](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com)

---

**VISADOCS está pronto para processar pagamentos!** 💰🚀
