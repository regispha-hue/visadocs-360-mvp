export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
  senderAlias?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<void> {
    console.info("[EMAIL_PROVIDER:console]", {
      to: input.to,
      subject: input.subject,
      from: input.from ?? null,
      senderAlias: input.senderAlias ?? null,
      htmlLength: input.html.length,
      metadata: input.metadata ?? {},
      status: "not_sent_external_provider_not_configured",
    });
  }
}

export const emailProvider: EmailProvider = new ConsoleEmailProvider();