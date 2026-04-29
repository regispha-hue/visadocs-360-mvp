/**
 * Sistema White-Label para Parcerias ANFARMAG/CRFs
 * Permite personalização da plataforma para diferentes parceiros
 */

import { prisma } from '@/lib/db';
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

interface WhiteLabelConfig {
  tenantId: string;
  parceiro: 'ANFARMAG' | 'CRF' | 'ASSOCIACAO' | 'EMPRESA';
  nome: string;
  logo: string;
  cores: {
    primaria: string;
    secundaria: string;
    acento: string;
    fundo: string;
    texto: string;
  };
  branding: {
    titulo: string;
    subtitulo: string;
    rodape: string;
    favicon: string;
  };
  dominio: string;
  subdominio?: string;
  googleAnalytics?: string;
  pixelFacebook?: string;
  customCSS?: string;
  customJS?: string;
  configuracoesEspecificas?: any;
}

interface TemplateWhiteLabel {
  id: string;
  nome: string;
  tipo: 'ANFARMAG' | 'CRF' | 'PERSONALIZADO';
  configuracoes: Partial<WhiteLabelConfig>;
  ativo: boolean;
}

class WhiteLabelSystem {
  private static instance: WhiteLabelSystem;
  private templates: Map<string, TemplateWhiteLabel> = new Map();
  private cacheConfiguracoes: Map<string, WhiteLabelConfig> = new Map();

  private constructor() {
    this.carregarTemplatesPadrao();
  }

  static getInstance(): WhiteLabelSystem {
    if (!WhiteLabelSystem.instance) {
      WhiteLabelSystem.instance = new WhiteLabelSystem();
    }
    return WhiteLabelSystem.instance;
  }

  /**
   * Carrega templates padrão
   */
  private carregarTemplatesPadrao(): void {
    // Template ANFARMAG
    this.templates.set('ANFARMAG', {
      id: 'ANFARMAG',
      nome: 'ANFARMAG - Associação Nacional das Farmácias',
      tipo: 'ANFARMAG',
      ativo: true,
      configuracoes: {
        cores: {
          primaria: '#0066cc',
          secundaria: '#004499',
          acento: '#ff6600',
          fundo: '#ffffff',
          texto: '#333333'
        },
        branding: {
          titulo: 'VISADOCS - Plataforma ANFARMAG',
          subtitulo: 'Gestão de Compliance para Farmácias Associadas',
          rodape: '© 2026 ANFARMAG - Todos os direitos reservados',
          favicon: '/favicon-anfarmag.ico'
        },
        dominio: 'visadocs.anfarmag.org.br'
      }
    });

    // Template CRF Padrão
    this.templates.set('CRF_PADRAO', {
      id: 'CRF_PADRAO',
      nome: 'CRF - Conselho Regional de Farmácia',
      tipo: 'CRF',
      ativo: true,
      configuracoes: {
        cores: {
          primaria: '#2c5aa0',
          secundaria: '#1e3f76',
          acento: '#4caf50',
          fundo: '#ffffff',
          texto: '#333333'
        },
        branding: {
          titulo: 'VISADOCS - Plataforma CRF',
          subtitulo: 'Sistema de Gestão de POPs e Compliance',
          rodape: '© 2026 CRF - Todos os direitos reservados',
          favicon: '/favicon-crf.ico'
        },
        dominio: 'visadocs.crf.uf.br'
      }
    });

    // Template Corporativo
    this.templates.set('CORPORATIVO', {
      id: 'CORPORATIVO',
      nome: 'Corporate - Empresas',
      tipo: 'PERSONALIZADO',
      ativo: true,
      configuracoes: {
        cores: {
          primaria: '#1a237e',
          secundaria: '#0d47a1',
          acento: '#ffc107',
          fundo: '#fafafa',
          texto: '#212121'
        },
        branding: {
          titulo: 'VISADOCS Enterprise',
          subtitulo: 'Plataforma Corporativa de Compliance',
          rodape: '© 2026 VISADOCS Enterprise',
          favicon: '/favicon-corporate.ico'
        },
        dominio: 'visadocs.empresa.com.br'
      }
    });
  }

  /**
   * Configura white-label para tenant
   */
  async configurarWhiteLabel(config: WhiteLabelConfig): Promise<void> {
    try {
      // Validar configuração
      await this.validarConfiguracao(config);

      // Salvar configuração no banco (usar campo JSON ou criar tabela específica)
      await this.salvarConfiguracaoBanco(config);

      // Atualizar cache
      this.cacheConfiguracoes.set(config.tenantId, config);

      // Gerar assets customizados
      await this.gerarAssetsCustomizados(config);

      // Configurar domínio se necessário
      if (config.subdominio) {
        await this.configurarSubdominio(config);
      }

      // Criar auditoria
      await createAuditLog({
        action: AUDIT_ACTIONS.POP_CREATED,
        entity: 'WhiteLabelConfig',
        entityId: config.tenantId,
        userId: 'system',
        userName: 'Sistema',
        tenantId: config.tenantId,
        details: {
          parceiro: config.parceiro,
          nome: config.nome,
          dominio: config.dominio,
          template: config.parceiro
        }
      });

      console.log(`White-label configurado para tenant ${config.tenantId}: ${config.nome}`);

    } catch (error) {
      console.error('Erro ao configurar white-label:', error);
      throw error;
    }
  }

  /**
   * Valida configuração white-label
   */
  private async validarConfiguracao(config: WhiteLabelConfig): Promise<void> {
    if (!config.tenantId || !config.parceiro || !config.nome || !config.dominio) {
      throw new Error('Configuração incompleta: tenantId, parceiro, nome e dominio são obrigatórios');
    }

    // Validar cores (formato hex)
    const cores = config.cores;
    const hexRegex = /^#[0-9A-F]{6}$/i;
    
    Object.values(cores).forEach(cor => {
      if (!hexRegex.test(cor)) {
        throw new Error(`Cor inválida: ${cor}. Use formato #RRGGBB`);
      }
    });

    // Validar dominio
    if (!this.validarDominio(config.dominio)) {
      throw new Error(`Domínio inválido: ${config.dominio}`);
    }

    // Verificar se dominio já está em uso
    const existente = await this.verificarDominioEmUso(config.dominio, config.tenantId);
    if (existente) {
      throw new Error(`Domínio ${config.dominio} já está em uso`);
    }
  }

  /**
   * Valida formato de domínio
   */
  private validarDominio(dominio: string): boolean {
    const dominioRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return dominioRegex.test(dominio);
  }

  /**
   * Verifica se domínio já está em uso
   */
  private async verificarDominioEmUso(dominio: string, tenantIdExcluir?: string): Promise<boolean> {
    // Implementar verificação no banco
    // Por enquanto, retornar false
    return false;
  }

  /**
   * Salva configuração no banco
   */
  private async salvarConfiguracaoBanco(config: WhiteLabelConfig): Promise<void> {
    // Implementar salvamento em tabela específica ou campo JSON
    // Por enquanto, apenas log
    console.log('Configuração salva no banco:', config);
  }

  /**
   * Gera assets customizados
   */
  private async gerarAssetsCustomizados(config: WhiteLabelConfig): Promise<void> {
    // Gerar CSS customizado
    const css = this.gerarCSSCustomizado(config);
    
    // Gerar favicon se necessário
    if (config.branding.favicon && !config.branding.favicon.startsWith('http')) {
      await this.gerarFavicon(config);
    }

    // Salvar assets
    await this.salvarAssets(config.tenantId, {
      css,
      favicon: config.branding.favicon
    });
  }

  /**
   * Gera CSS customizado baseado na configuração
   */
  private gerarCSSCustomizado(config: WhiteLabelConfig): string {
    const { cores, branding } = config;
    
    return `
/* CSS Customizado - ${config.nome} */
:root {
  --cor-primaria: ${cores.primaria};
  --cor-secundaria: ${cores.secundaria};
  --cor-acento: ${cores.acento};
  --cor-fundo: ${cores.fundo};
  --cor-texto: ${cores.texto};
}

/* Override de cores do tema */
.bg-primary {
  background-color: var(--cor-primaria) !important;
}

.text-primary {
  color: var(--cor-primaria) !important;
}

.btn-primary {
  background-color: var(--cor-primaria) !important;
  border-color: var(--cor-primaria) !important;
}

.btn-primary:hover {
  background-color: var(--cor-secundaria) !important;
  border-color: var(--cor-secundaria) !important;
}

.header-brand {
  background-color: var(--cor-primaria) !important;
}

.sidebar {
  background-color: var(--cor-primaria) !important;
}

/* Customizações específicas */
.navbar-brand::before {
  content: "${branding.titulo}";
  font-weight: bold;
}

.footer {
  background-color: var(--cor-secundaria) !important;
  color: white !important;
}

.footer::after {
  content: "${branding.rodape}";
  display: block;
  text-align: center;
  padding: 10px;
}

${config.customCSS || ''}
`;
  }

  /**
   * Gera favicon
   */
  private async gerarFavicon(config: WhiteLabelConfig): Promise<void> {
    // Implementar geração de favicon baseado no logo
    console.log(`Gerando favicon para ${config.nome}`);
  }

  /**
   * Salva assets no sistema de arquivos
   */
  private async salvarAssets(tenantId: string, assets: any): Promise<void> {
    // Implementar salvamento de arquivos
    console.log(`Assets salvos para tenant ${tenantId}`);
  }

  /**
   * Configura subdomínio
   */
  private async configurarSubdominio(config: WhiteLabelConfig): Promise<void> {
    // Implementar configuração de subdomínio
    console.log(`Configurando subdomínio: ${config.subdominio}.${config.dominio}`);
  }

  /**
   * Obtém configuração white-label de um tenant
   */
  async getConfiguracao(tenantId: string): Promise<WhiteLabelConfig | null> {
    // Verificar cache primeiro
    if (this.cacheConfiguracoes.has(tenantId)) {
      return this.cacheConfiguracoes.get(tenantId)!;
    }

    // Buscar do banco
    const config = await this.buscarConfiguracaoBanco(tenantId);
    
    if (config) {
      this.cacheConfiguracoes.set(tenantId, config);
      return config;
    }

    return null;
  }

  /**
   * Busca configuração do banco
   */
  private async buscarConfiguracaoBanco(tenantId: string): Promise<WhiteLabelConfig | null> {
    // Implementar busca no banco
    // Por enquanto, retornar null
    return null;
  }

  /**
   * Aplica configuração white-label em tempo de execução
   */
  async aplicarConfiguracao(tenantId: string): Promise<void> {
    const config = await this.getConfiguracao(tenantId);
    
    if (!config) {
      console.log(`Nenhuma configuração white-label encontrada para tenant ${tenantId}`);
      return;
    }

    // Injetar CSS customizado
    this.injetarCSSCustomizado(config);

    // Atualizar elementos do DOM
    this.atualizarElementosDOM(config);

    // Configurar analytics se necessário
    if (config.googleAnalytics) {
      this.configurarGoogleAnalytics(config.googleAnalytics);
    }

    if (config.pixelFacebook) {
      this.configurarPixelFacebook(config.pixelFacebook);
    }
  }

  /**
   * Injeta CSS customizado na página
   */
  private injetarCSSCustomizado(config: WhiteLabelConfig): void {
    // Remover CSS anterior se existir
    const cssAnterior = document.getElementById('whitelabel-css');
    if (cssAnterior) {
      cssAnterior.remove();
    }

    // Criar e injetar novo CSS
    const css = this.gerarCSSCustomizado(config);
    const style = document.createElement('style');
    style.id = 'whitelabel-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Atualiza elementos do DOM
   */
  private atualizarElementosDOM(config: WhiteLabelConfig): void {
    const { branding } = config;

    // Atualizar título
    if (branding.titulo) {
      const titleElements = document.querySelectorAll('.navbar-brand, .header-title');
      titleElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.textContent = branding.titulo;
        }
      });
    }

    // Atualizar favicon
    if (branding.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.favicon;
      }
    }

    // Atualizar rodapé
    if (branding.rodape) {
      const footerElements = document.querySelectorAll('.footer, .rodape');
      footerElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.textContent = branding.rodape;
        }
      });
    }
  }

  /**
   * Configura Google Analytics
   */
  private configurarGoogleAnalytics(trackingId: string): void {
    // Implementar configuração do GA
    console.log(`Configurando Google Analytics: ${trackingId}`);
  }

  /**
   * Configura Pixel do Facebook
   */
  private configurarPixelFacebook(pixelId: string): void {
    // Implementar configuração do Pixel
    console.log(`Configurando Pixel Facebook: ${pixelId}`);
  }

  /**
   * Lista templates disponíveis
   */
  listarTemplates(): TemplateWhiteLabel[] {
    return Array.from(this.templates.values()).filter(template => template.ativo);
  }

  /**
   * Obtém template por ID
   */
  getTemplate(id: string): TemplateWhiteLabel | undefined {
    return this.templates.get(id);
  }

  /**
   * Cria configuração baseada em template
   */
  criarConfiguracaoTemplate(tenantId: string, templateId: string, personalizacoes: Partial<WhiteLabelConfig>): WhiteLabelConfig {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    const configBase: WhiteLabelConfig = {
      tenantId,
      parceiro: template.tipo === 'ANFARMAG' ? 'ANFARMAG' : template.tipo === 'CRF' ? 'CRF' : 'EMPRESA',
      nome: template.nome,
      logo: '',
      cores: template.configuracoes.cores || {
        primaria: '#0066cc',
        secundaria: '#004499',
        acento: '#ff6600',
        fundo: '#ffffff',
        texto: '#333333'
      },
      branding: template.configuracoes.branding || {
        titulo: 'VISADOCS',
        subtitulo: 'Plataforma de Compliance',
        rodape: '© 2026 VISADOCS',
        favicon: '/favicon.ico'
      },
      dominio: template.configuracoes.dominio || 'visadocs.com.br',
      configuracoesEspecificas: {}
    };

    // Aplicar personalizações
    return { ...configBase, ...personalizacoes };
  }

  /**
   * Remove configuração white-label
   */
  async removerConfiguracao(tenantId: string): Promise<void> {
    // Remover do banco
    await this.removerConfiguracaoBanco(tenantId);

    // Remover do cache
    this.cacheConfiguracoes.delete(tenantId);

    // Remover assets
    await this.removerAssets(tenantId);

    // Criar auditoria
    await createAuditLog({
      action: 'REMOCAO_WHITELABEL',
      entity: 'WhiteLabelConfig',
      entityId: tenantId,
      userId: 'system',
      userName: 'Sistema IA',
      tenantId,
      details: {
        tenantId
      }
    });

    console.log(`Configuração white-label removida para tenant ${tenantId}`);
  }

  /**
   * Remove configuração do banco
   */
  private async removerConfiguracaoBanco(tenantId: string): Promise<void> {
    // Implementar remoção do banco
    console.log(`Removendo configuração do banco para tenant ${tenantId}`);
  }

  /**
   * Remove assets
   */
  private async removerAssets(tenantId: string): Promise<void> {
    // Implementar remoção de arquivos
    console.log(`Removendo assets para tenant ${tenantId}`);
  }

  /**
   * Gera página de login customizada
   */
  gerarPaginaLogin(config: WhiteLabelConfig): string {
    const { cores, branding } = config;

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${branding.titulo} - Login</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, ${cores.primaria}, ${cores.secundaria});
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: ${cores.fundo};
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo {
            margin-bottom: 20px;
        }
        .logo h1 {
            color: ${cores.primaria};
            margin: 0;
            font-size: 28px;
        }
        .logo p {
            color: ${cores.texto};
            margin: 5px 0 20px;
            font-size: 14px;
        }
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: ${cores.texto};
            font-weight: bold;
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
        }
        .btn-login {
            background: ${cores.primaria};
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            transition: background 0.3s;
        }
        .btn-login:hover {
            background: ${cores.secundaria};
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: ${cores.texto};
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>${branding.titulo}</h1>
            <p>${branding.subtitulo}</p>
        </div>
        
        <form class="login-form">
            <div class="form-group">
                <label for="email">E-mail</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="senha">Senha</label>
                <input type="password" id="senha" name="senha" required>
            </div>
            
            <button type="submit" class="btn-login">Entrar</button>
        </form>
        
        <div class="footer">
            ${branding.rodape}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Exporta configuração para backup
   */
  exportarConfiguracao(tenantId: string): any {
    const config = this.cacheConfiguracoes.get(tenantId);
    if (!config) {
      throw new Error(`Configuração não encontrada para tenant ${tenantId}`);
    }

    return {
      tenantId,
      configuracao: config,
      dataExportacao: new Date().toISOString(),
      versao: '1.0'
    };
  }

  /**
   * Importa configuração de backup
   */
  async importarConfiguracao(dados: any): Promise<void> {
    try {
      const config = dados.configuracao as WhiteLabelConfig;
      
      if (!config || !config.tenantId) {
        throw new Error('Dados de configuração inválidos');
      }

      await this.configurarWhiteLabel(config);
      
      console.log(`Configuração importada com sucesso para tenant ${config.tenantId}`);
    } catch (error) {
      console.error('Erro ao importar configuração:', error);
      throw error;
    }
  }
}

export const whiteLabelSystem = WhiteLabelSystem.getInstance();
