# Sprint 11: Pagamentos - Implementação
## 💳 Stripe & MercadoPago Integration

---

## ✅ **Implementações Concluídas**

### 1. Database Schema
**Arquivo:** `prisma/schema.prisma`

**Novos Enums:**
```prisma
enum PaymentProvider {
  STRIPE
  MERCADO_PAGO
}

enum PaymentStatus {
  PENDENTE
  PROCESSANDO
  PAGO
  FALHOU
  REEMBOLSADO
}

enum BillingCycle {
  MENSAL
  ANUAL
}
```

**Novos Modelos:**

#### `Plan` - Planos de Assinatura
- `id`, `name`, `description`
- `priceMonthly`, `priceYearly` (com desconto)
- `features[]`, `limits` (JSON)
- `stripePriceId`, `mpPriceId`
- `active`, `sortOrder`

#### `Subscription` - Assinaturas dos Tenants
- Relação 1:1 com Tenant
- `planId`, `startDate`, `endDate`
- `billingCycle`, `status`
- `stripeCustomerId`, `stripeSubscriptionId`
- `trialEndsAt`, `canceledAt`
- Histórico de pagamentos

#### `Payment` - Pagamentos Individuais
- `subscriptionId`, `tenantId`
- `amount`, `currency`, `provider`
- `status`, `periodStart`, `periodEnd`
- `paidAt`, `failedAt`, `refundedAt`
- `invoiceUrl`, `receiptUrl`

---

### 2. APIs Criadas

#### `GET /api/plans`
**Arquivo:** `app/api/plans/route.ts`

Lista planos disponíveis público.
Retorna planos com cálculo automático de desconto anual.

**Exemplo de retorno:**
```json
{
  "plans": [
    {
      "id": "...",
      "name": "Professional",
      "priceMonthly": 199.0,
      "priceYearly": 1999.0,
      "yearlyDiscount": {
        "amount": 389.0,
        "percent": 16
      }
    }
  ]
}
```

#### `POST /api/stripe/checkout`
**Arquivo:** `app/api/stripe/checkout/route.ts`

Cria sessão de checkout Stripe.

**Fluxo:**
1. Valida usuário e tenant
2. Busca/cria assinatura
3. Cria cliente Stripe se não existir
4. Cria sessão de checkout com trial
5. Retorna URL para redirecionamento

#### `POST /api/stripe/webhook`
**Arquivo:** `app/api/stripe/webhook/route.ts`

Processa webhooks do Stripe.

**Eventos tratados:**
- `checkout.session.completed` → Ativa assinatura
- `invoice.payment_succeeded` → Registra pagamento
- `invoice.payment_failed` → Suspende após 3 falhas
- `customer.subscription.canceled` → Cancela assinatura
- `customer.subscription.updated` → Atualiza status

---

### 3. Seed de Planos
**Arquivo:** `scripts/seed-plans.ts`

**Planos pré-configurados:**

| Plano | Mensal | Anual | Colaboradores | POPs |
|-------|--------|-------|-----------------|------|
| **Starter** | R$ 99 | R$ 999 | 5 | 50 |
| **Professional** | R$ 199 | R$ 1999 | 20 | Ilimitado |
| **Enterprise** | R$ 499 | R$ 4999 | Ilimitado | Ilimitado |

**Features por plano:**
- Starter: Básico + email support
- Professional: + IA Quiz + Auditoria + Prioritário
- Enterprise: + API + White-label + 24/7 + Custom

**Para executar:**
```bash
npx ts-node scripts/seed-plans.ts
```

---

### 4. Integração com Tenant

O status do tenant é automaticamente sincronizado com a assinatura:

```
Tenant Status ← → Subscription Status
     ↓                    ↓
   ATIVO ← ─ ─ ─ →   ATIVO
   SUSPENSO ← ─ ─ →  SUSPENSO (pagamento falhou)
   CANCELADO ← ─ ─ → CANCELADO
```

**Automatizações:**
- Trial de 14 dias ao criar assinatura
- Suspensão automática após 3 falhas de pagamento
- Ativação automática após pagamento bem-sucedido

---

### 5. Audit Log

**Novas ações adicionadas:**
```typescript
SUBSCRIPTION_ACTIVATED  // Checkout completado
SUBSCRIPTION_CANCELED   // Cancelamento
SUBSCRIPTION_SUSPENDED  // Pagamento falhou
SUBSCRIPTION_UPDATED    // Alteração de plano
PAYMENT_SUCCEEDED       // Pagamento confirmado
PAYMENT_FAILED          // Falha no pagamento
```

---

### 6. Variáveis de Ambiente Necessárias

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mercado Pago (futuro)
MP_ACCESS_TOKEN=TEST-...
MP_PUBLIC_KEY=TEST-...
```

---

## 📊 **Status do Sprint 11**

| Componente | Status | Arquivo |
|------------|--------|---------|
| Schema Prisma | ✅ | `prisma/schema.prisma` |
| API Listar Planos | ✅ | `app/api/plans/route.ts` |
| API Stripe Checkout | ✅ | `app/api/stripe/checkout/route.ts` |
| Webhook Stripe | ✅ | `app/api/stripe/webhook/route.ts` |
| Seed de Planos | ✅ | `scripts/seed-plans.ts` |
| Audit Actions | ✅ | `lib/audit.ts` |
| UI de Planos | 🔄 | Próximo passo |
| Dashboard Admin | 🔄 | Pendente |

---

## 🚀 **Como Configurar**

### 1. Configurar Stripe
```bash
# Criar conta em https://stripe.com
# Obter chaves de API
# Configurar webhook endpoint: /api/stripe/webhook
```

### 2. Criar Produtos no Stripe
```bash
# Criar produtos com preços mensais e anuais
# Copiar os price IDs para o seed
```

### 3. Seed dos Planos
```bash
npx prisma migrate dev  # Aplicar schema
npx ts-node scripts/seed-plans.ts  # Criar planos
```

### 4. Configurar Webhook
```bash
# Stripe CLI para desenvolvimento:
stripe listen --forward-to localhost:3003/api/stripe/webhook
```

---

## 🎯 **Próximos Passos**

### Sprint 11.1 (UI):
- [ ] Página de planos para seleção
- [ ] Componente de checkout integrado
- [ ] Página de gestão de assinatura
- [ ] Histórico de pagamentos

### Sprint 11.2 (Admin):
- [ ] Dashboard de assinaturas ativas
- [ ] Gestão de planos (CRUD)
- [ ] Relatórios de MRR/Churn

### Sprint 11.3 (MercadoPago):
- [ ] Implementar checkout MP
- [ ] Webhooks MP
- [ ] Pix como método de pagamento

---

## 📈 **Visão Geral do Projeto**

```
FASE 1: Blueprint Compliance ✅
FASE 2: Documentação & Branding ✅
FASE 3: Integridade & Segurança ✅
FASE 4: Monetização 🔄
  ├── Sprint 11: Backend Pagamentos ✅
  ├── Sprint 11.1: UI Checkout 🔄
  └── Sprint 11.2: Dashboard Admin 📋
```

**VISADOCS pronto para geração de receita!** 💰

---

*Implementado por Engenheiro Sênior - VISADOCS 2026*

**Nota:** Os erros de TypeScript (`Property 'plan' does not exist...`) são esperados até rodar `npx prisma generate` para atualizar o Prisma Client com os novos modelos.
