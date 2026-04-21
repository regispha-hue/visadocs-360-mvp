/** Nexoritia OS Client for Visadocs 360 MVP | Otimizado */
import axios from 'axios';

export interface ValidationRequest { content: string; domain?: string; axioms_required?: string[]; strict_mode?: boolean; }
export interface AuthRequest { artifact_id: string; content: string; artifact_type: string; title?: string; include_tsa?: boolean; }

export class NexoritiaClient {
  private client;
  constructor(baseURL: string, apiKey: string) {
    this.client = axios.create({ baseURL, timeout: 30000,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }});
  }

  async health() { return (await this.client.get('/')).data; }
  async stats() { return (await this.client.get('/stats')).data; }
  async canonInfo() { return (await this.client.get('/canon/info')).data; }
  async validate(request: ValidationRequest) { return (await this.client.post('/canon/validate', request)).data; }
  async authenticate(request: AuthRequest) { return (await this.client.post('/auth/authenticate', request)).data; }
  async verify(content: string, proof: any) { return (await this.client.post('/auth/verify', { content, proof })).data; }

  async validatePOP(content: string) {
    try { return await this.validate({ content, domain: "farmacia_manipulacao", strict_mode: true }); }
    catch (e) { return { valid: false, violations: ['Validation error'], confidence_score: 0 }; }
  }

  async authenticatePOP(popId: string, content: string, title: string) {
    try { return await this.authenticate({ artifact_id: popId, content, artifact_type: "pop", title, include_tsa: true }); }
    catch (e) { return { success: false, error: 'Authentication failed' }; }
  }
}

export const nexoritiaClient = new NexoritiaClient(
  process.env.NEXORITIA_OS_URL || 'http://localhost:8000',
  process.env.NEXORITIA_OS_API_KEY || 'dev-key'
);
