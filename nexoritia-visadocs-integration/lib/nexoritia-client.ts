/**
 * Nexoritia OS Client for Visadocs 360 MVP Integration
 * Cliente TypeScript para comunicação com Nexoritia OS API
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ValidationRequest {
  content: string;
  domain?: string;
  axioms_required?: string[];
  strict_mode?: boolean;
}

export interface ValidationResponse {
  valid: boolean;
  coherent: boolean;
  axioms_found: string[];
  axioms_missing: string[];
  violations: string[];
  confidence_score: number;
  validated_at: string;
}

export interface AuthRequest {
  artifact_id: string;
  content: string;
  artifact_type: string;
  title?: string;
  include_tsa?: boolean;
}

export interface AuthProof {
  id: string;
  artifact_id: string;
  artifact_type: string;
  content_hash: string;
  author_signature: string;
  public_key_pem: string;
  tsa_timestamp?: string;
  created_at: string;
  valid_until?: string;
}

export interface AuthVerification {
  valid: boolean;
  coherent: boolean;
  reason: string;
  proof?: AuthProof;
  verified_at: string;
}

export interface LLMRequest {
  prompt: string;
  context?: Record<string, any>;
  axioms?: string[];
  validate_output?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  axioms_used: string[];
  validation_passed: boolean;
  validation_details?: Record<string, any>;
  model_used: string;
  tokens_used: number;
  response_time_ms: number;
}

export interface CommandRequest {
  command: string;
  args?: string[];
  cwd?: string;
  context?: string;
  validation_required?: boolean;
  timeout?: number;
}

export interface CommandResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  validated: boolean;
  validation_details?: Record<string, any>;
}

export class NexoritiaClient {
  private client: AxiosInstance;
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Visadocs-360-MVP/1.0'
      }
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔍 Nexoritia API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Nexoritia API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para responses
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Nexoritia API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Nexoritia API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.get('/');
    return response.data;
  }

  async getStats(): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.get('/stats');
    return response.data;
  }

  async getVersion(): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.get('/version');
    return response.data;
  }

  // ============================================================================
  // CANON ENDPOINTS
  // ============================================================================

  async getCanonInfo(): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.get('/canon/info');
    return response.data;
  }

  async listAxioms(filters?: {
    monte?: string;
    priority?: string;
    category?: string;
    domain?: string;
  }): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.get('/canon/axioms', {
      params: filters
    });
    return response.data;
  }

  async validateText(request: ValidationRequest): Promise<ValidationResponse> {
    const response: AxiosResponse = await this.client.post('/canon/validate', request);
    return response.data;
  }

  async createArtifact(artifact: {
    title: string;
    type: string;
    content: string;
    ontology_refs?: string[];
    axioms?: string[];
    sources?: Array<{
      source_type: string;
      source_id: string;
      range?: string;
      url?: string;
      title?: string;
      author?: string;
    }>;
  }): Promise<Record<string, string>> {
    const response: AxiosResponse = await this.client.post('/canon/artifact', artifact);
    return response.data;
  }

  async getArtifact(artifactId: string): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.get(`/canon/artifact/${artifactId}`);
    return response.data;
  }

  async searchArtifacts(query: string, options?: {
    limit?: number;
    offset?: number;
    type?: string;
    status?: string;
  }): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.post('/canon/search', {
      query,
      ...options
    });
    return response.data;
  }

  // ============================================================================
  // AUTH-AI ENDPOINTS
  // ============================================================================

  async authenticateArtifact(request: AuthRequest): Promise<{
    success: boolean;
    proof: AuthProof;
    message: string;
  }> {
    const response: AxiosResponse = await this.client.post('/auth/authenticate', request);
    return response.data;
  }

  async verifyProof(content: string, proof: AuthProof): Promise<AuthVerification> {
    const response: AxiosResponse = await this.client.post('/auth/verify', {
      content,
      proof
    });
    return response.data;
  }

  async getPublicKey(): Promise<Record<string, string>> {
    const response: AxiosResponse = await this.client.get('/auth/public-key');
    return response.data;
  }

  async batchAuthenticate(artifacts: Array<{
    artifact_id: string;
    content: string;
    artifact_type: string;
    title?: string;
    include_tsa?: boolean;
  }>): Promise<{
    success: boolean;
    total_processed: number;
    proofs: AuthProof[];
    message: string;
  }> {
    const response: AxiosResponse = await this.client.post('/auth/batch', artifacts);
    return response.data;
  }

  // ============================================================================
  // OS-RADAR ENDPOINTS
  // ============================================================================

  async getDomains(): Promise<{
    domains: string[];
    total: number;
    default_domain: string;
  }> {
    const response: AxiosResponse = await this.client.get('/radar/domains');
    return response.data;
  }

  async getDomainStats(domain: string): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.get(`/radar/stats/${domain}`);
    return response.data;
  }

  async validateWithRadar(request: ValidationRequest): Promise<{
    validation: ValidationResponse;
    fail_closed_action: {
      action: string;
      reason: string;
      violations: string[];
      suggestions?: string[];
    };
    timestamp: string;
  }> {
    const response: AxiosResponse = await this.client.post('/radar/validate', request);
    return response.data;
  }

  // ============================================================================
  // OS-AGENT ENDPOINTS (Placeholder)
  // ============================================================================

  async executeCommand(request: CommandRequest): Promise<CommandResponse> {
    const response: AxiosResponse = await this.client.post('/agent/execute', request);
    return response.data;
  }

  async getAgentStatus(): Promise<Record<string, any>> {
    const response: AxiosResponse = await this.client.get('/agent/status');
    return response.data;
  }

  // ============================================================================
  // MÉTODOS DE CONVENIÊNCIA PARA VISADOCS
  // ============================================================================

  /**
   * Valida conteúdo de POP contra RDC 67/2007
   */
  async validatePOPContent(content: string, popData?: {
    setor?: string;
    titulo?: string;
  }): Promise<{
    valid: boolean;
    violations: string[];
    axioms_used: string[];
    compliance_score: number;
  }> {
    try {
      const validation = await this.validateText({
        content,
        domain: "farmacia_manipulacao",
        axioms_required: ["lei_casa_viva", "lei_fenda_fundadora"],
        strict_mode: true
      });

      return {
        valid: validation.valid,
        violations: validation.violations,
        axioms_used: validation.axioms_found,
        compliance_score: validation.confidence_score
      };
    } catch (error) {
      console.error('❌ Erro na validação do POP:', error);
      return {
        valid: false,
        violations: ['Erro na validação do conteúdo'],
        axioms_used: [],
        compliance_score: 0
      };
    }
  }

  /**
   * Gera prova criptográfica para POP
   */
  async authenticatePOP(popId: string, content: string, title: string): Promise<{
    success: boolean;
    proof?: AuthProof;
    error?: string;
  }> {
    try {
      const result = await this.authenticateArtifact({
        artifact_id: popId,
        content,
        artifact_type: "pop",
        title,
        include_tsa: true
      });

      return {
        success: result.success,
        proof: result.proof,
        error: result.success ? undefined : 'Falha na autenticação'
      };
    } catch (error) {
      console.error('❌ Erro na autenticação do POP:', error);
      return {
        success: false,
        error: 'Erro na autenticação do conteúdo'
      };
    }
  }

  /**
   * Gera prova criptográfica para certificado
   */
  async authenticateCertificate(
    certificateId: string, 
    content: string, 
    trainingData: any
  ): Promise<{
    success: boolean;
    proof?: AuthProof;
    error?: string;
  }> {
    try {
      const certificateContent = this.generateCertificateContent(content, trainingData);
      
      const result = await this.authenticateArtifact({
        artifact_id: certificateId,
        content: certificateContent,
        artifact_type: "certificate",
        title: `Certificado - ${trainingData.colaborador?.nome || 'Desconhecido'}`,
        include_tsa: true
      });

      return {
        success: result.success,
        proof: result.proof,
        error: result.success ? undefined : 'Falha na autenticação'
      };
    } catch (error) {
      console.error('❌ Erro na autenticação do certificado:', error);
      return {
        success: false,
        error: 'Erro na autenticação do certificado'
      };
    }
  }

  /**
   * Envia prompt ao chatbot VISA com validação
   */
  async askVisaAssistant(
    question: string,
    context?: {
      colaborador?: any;
      farmacia?: any;
      pop?: any;
    }
  ): Promise<{
    success: boolean;
    response?: string;
    axioms_used?: string[];
    is_compliant?: boolean;
    error?: string;
  }> {
    try {
      const llmResponse = await this.promptLLM({
        prompt: question,
        context: {
          domain: "farmacia_manipulacao",
          regulations: ["RDC_67_2007", "BPM"],
          axioms: ["lei_casa_viva", "lei_intersecao", "lei_fenda_fundadora"],
          ...context
        },
        validate_output: true,
        strict_mode: true,
        temperature: 0.0  // Determinístico
      });

      if (!llmResponse.validation_passed) {
        return {
          success: false,
          error: 'Resposta bloqueada por violação de conformidade',
          response: llmResponse.content,
          axioms_used: llmResponse.axioms_used,
          is_compliant: false
        };
      }

      return {
        success: true,
        response: llmResponse.content,
        axioms_used: llmResponse.axioms_used,
        is_compliant: true
      };
    } catch (error) {
      console.error('❌ Erro na comunicação com assistente VISA:', error);
      return {
        success: false,
        error: 'Erro na comunicação com o assistente'
      };
    }
  }

  /**
   * Prompt LLM com validação (método privado)
   */
  private async promptLLM(request: LLMRequest): Promise<LLMResponse> {
    // Este método seria implementado quando o LLM Gateway estiver disponível
    // Por enquanto, simula resposta
    return {
      content: "LLM Gateway não implementado na versão atual",
      axioms_used: [],
      validation_passed: false,
      validation_details: { error: "LLM Gateway not implemented" },
      model_used: "placeholder",
      tokens_used: 0,
      response_time_ms: 0
    };
  }

  /**
   * Gera conteúdo do certificado
   */
  private generateCertificateContent(content: string, trainingData: any): string {
    return `
CERTIFICADO DE TREINAMENTO - VISADOCS 360

Dados do Treinamento:
- Colaborador: ${trainingData.colaborador?.nome || 'N/A'}
- Função: ${trainingData.colaborador?.funcao || 'N/A'}
- POP: ${trainingData.pop?.titulo || 'N/A'} (${trainingData.pop?.codigo || 'N/A'})
- Data do Treinamento: ${trainingData.dataTreinamento || 'N/A'}
- Instrutor: ${trainingData.instrutor || 'N/A'}
- Nota: ${trainingData.notaQuiz || 'N/A'}
- Status: ${trainingData.aprovadoQuiz ? 'APROVADO' : 'REPROVADO'}

Conteúdo do Certificado:
${content}

---
Este certificado é protegido por Nexoritia OS com prova criptográfica.
Validação: https://visadocs.com/verify/[CÓDIGO]
    `.trim();
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Verifica se o serviço está disponível
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('❌ Nexoritia OS não está disponível:', error);
      return false;
    }
  }

  /**
   * Obtém informações de diagnóstico
   */
  async getDiagnostics(): Promise<Record<string, any>> {
    try {
      const [health, stats, version] = await Promise.all([
        this.healthCheck(),
        this.getStats(),
        this.getVersion()
      ]);

      return {
        status: 'operational',
        connectivity: true,
        health,
        stats,
        version,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        connectivity: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Instância default para uso no Visadocs
export const nexoritiaClient = new NexoritiaClient(
  process.env.NEXORITIA_OS_URL || 'http://localhost:8000',
  process.env.NEXORITIA_OS_API_KEY || 'dev-api-key'
);

export default NexoritiaClient;
