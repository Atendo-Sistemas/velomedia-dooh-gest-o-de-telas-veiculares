import React, { useState } from 'react';
import { 
  Radio, 
  Cpu, 
  Wifi, 
  HardDrive, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Server, 
  Layers, 
  Share2, 
  Smartphone, 
  Eye, 
  Lock, 
  RefreshCw,
  TrendingUp,
  Award,
  X
} from 'lucide-react';

export const ArchitectureDoc: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'iot_comm' | 'offline_edge' | 'kiosk_security' | 'future_innovations' | 'live_execution'>('live_execution');
  
  // Interactive PoP Auditor State
  const [testEventId, setTestEventId] = useState('pop_live_sample_01');
  const [testDeviceId, setTestDeviceId] = useState('dev_01');
  const [testCampaignId, setTestCampaignId] = useState('camp_01');
  const [testSignature, setTestSignature] = useState('');
  const [auditResult, setAuditResult] = useState<{ checked: boolean; valid?: boolean; message?: string } | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const handleRunPoPAudit = async () => {
    setIsAuditing(true);
    try {
      // If signature is empty, generate test hash
      const sigToTest = testSignature || '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b';
      const res = await fetch('/api/v1/proof-of-play/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: testEventId,
          deviceId: testDeviceId,
          campaignId: testCampaignId,
          startedAt: '2026-09-17T12:00:00Z',
          endedAt: '2026-09-17T12:00:15Z',
          durationMs: 15000,
          nonce: `nonce_${testEventId}`,
          signature: sigToTest,
        }),
      });
      const data = await res.json();
      setAuditResult({
        checked: true,
        valid: data.verified,
        message: data.verified 
          ? 'Assinatura HMAC-SHA256 íntegra e confirmada pelo servidor!' 
          : 'Falha na verificação: assinatura não corresponde ao segredo e aos parâmetros.',
      });
    } catch (err: any) {
      setAuditResult({ checked: true, valid: false, message: `Erro na auditoria: ${err.message}` });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Arquitetura de Produção & Execução do Sistema VeloMedia DOOH
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Backend Express + API REST v1 unificada, persistência estruturada em disco/banco, Proof-of-Play criptográfico HMAC-SHA256 e resiliência offline.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'live_execution', label: '★ Execução em Produção & Auditor PoP', icon: Server },
          { id: 'iot_comm', label: '1. Otimização Nuvem ↔ TV (IoT)', icon: Zap },
          { id: 'offline_edge', label: '2. Arquitetura Offline-First & Edge', icon: HardDrive },
          { id: 'kiosk_security', label: '3. Modo Kiosk & Proteção do Hardware', icon: ShieldCheck },
          { id: 'future_innovations', label: '4. O Que Podemos Criar (Expansão)', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: LIVE EXECUTION */}
      {activeTab === 'live_execution' && (
        <div className="space-y-6">
          
          {/* Production Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Servidor Node.js + Express</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-lg font-black text-emerald-400 mt-2">API v1 Operacional</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Porta 3000 • Ingress Cloud Run</p>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/30 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Algoritmo de Auditoria PoP</span>
                <Lock className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-lg font-black text-cyan-400 mt-2">HMAC-SHA256</p>
              <p className="text-[11px] text-slate-400 mt-1">Anti-replay • Chave Secreta/Dispositivo</p>
            </div>

            <div className="bg-slate-900/90 border border-indigo-500/30 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Isolamento Multi-Tenant</span>
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-lg font-black text-indigo-400 mt-2">Tenant Scoped</p>
              <p className="text-[11px] text-slate-400 mt-1">RBAC Server-side • Sem vazamento</p>
            </div>

            <div className="bg-slate-900/90 border border-purple-500/30 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Armazenamento</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-lg font-black text-purple-400 mt-2">Persistente em Disco</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">/data/velomedia_store.json</p>
            </div>
          </div>

          {/* Interactive PoP Auditor Section */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Auditor Interativo de Assinatura Criptográfica PoP</h3>
                <p className="text-xs text-slate-400">
                  Teste em tempo real o endpoint <code className="bg-slate-800 text-cyan-300 px-1 py-0.5 rounded">POST /api/v1/proof-of-play/verify</code> para auditar uma impressão veicular.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">ID do Evento de Exibição</label>
                <input 
                  type="text" 
                  value={testEventId} 
                  onChange={e => setTestEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">ID do Dispositivo (Tablet)</label>
                <input 
                  type="text" 
                  value={testDeviceId} 
                  onChange={e => setTestDeviceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">ID da Campanha Publicitária</label>
                <input 
                  type="text" 
                  value={testCampaignId} 
                  onChange={e => setTestCampaignId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:border-cyan-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-semibold block mb-1">Assinatura HMAC-SHA256 (Deixe em branco para testar hash de referência)</label>
              <input 
                type="text" 
                value={testSignature} 
                onChange={e => setTestSignature(e.target.value)}
                placeholder="Ex: 8f3c7a... (hash hexadecimal de 64 caracteres)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:border-cyan-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleRunPoPAudit}
                disabled={isAuditing}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-md flex items-center space-x-2"
              >
                {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verificar Assinatura no Servidor</span>
              </button>

              {auditResult && (
                <div className={`px-3 py-2 rounded-xl text-xs flex items-center space-x-2 border ${
                  auditResult.valid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {auditResult.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                  <span>{auditResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Endpoints Registry */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Catálogo de Endpoints da API REST v1 em Execução</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px]">POST</span>
                  <span className="font-mono text-slate-200">/api/v1/auth/login</span>
                </div>
                <p className="text-[11px] text-slate-400">Login com senha hash PBKDF2 e cookie seguro HttpOnly.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">GET</span>
                  <span className="font-mono text-slate-200">/api/v1/devices</span>
                </div>
                <p className="text-[11px] text-slate-400">Listagem de monitores com isolamento por organização.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px]">POST</span>
                  <span className="font-mono text-slate-200">/api/v1/devices/pair-token</span>
                </div>
                <p className="text-[11px] text-slate-400">Geração de código de pareamento de 6 dígitos com expiração de 15min.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px]">POST</span>
                  <span className="font-mono text-slate-200">/api/v1/proof-of-play/log</span>
                </div>
                <p className="text-[11px] text-slate-400">Ingestão de impressões auditadas com assinatura HMAC.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono font-bold text-[10px]">POST</span>
                  <span className="font-mono text-slate-200">/api/v1/billing/invoices/:id/generate-pix</span>
                </div>
                <p className="text-[11px] text-slate-400">Emissão de QR Code PIX padrão EMV com chave do franqueado.</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-bold text-[10px]">POST</span>
                  <span className="font-mono text-slate-200">/api/v1/drivers/:id/payout</span>
                </div>
                <p className="text-[11px] text-slate-400">Processamento de repasse e liquidação financeira do motorista.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Content Section 1: IoT Communication */}
      {activeTab === 'iot_comm' && (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">MQTT com QoS 1 (Broker Central)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilize o protocolo <strong>MQTT (Message Queuing Telemetry Transport)</strong> para telemetria leve. Cada ping de batimento cardíaco (tensão da bateria, temperatura, 4G, GPS) consome menos de <strong>120 bytes</strong>.
              </p>
              <div className="p-2 bg-slate-800/60 rounded-lg text-[11px] text-cyan-300 font-mono">
                Consumo 4G: ~8 MB / mês por carro
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Delta Sync de Vídeos (HTTP/3 Chunked)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nunca transmita vídeos em tempo real (streaming). Os vídeos e criativos são <strong>pré-baixados na memória flash local</strong> via CDN quando o carro está conectado ao Wi-Fi da garagem ou 4G estável, com suporte a retomada após túneis.
              </p>
              <div className="p-2 bg-slate-800/60 rounded-lg text-[11px] text-indigo-300 font-mono">
                Zero travamentos ou bufferings
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Comandos Remotos Instantâneos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O painel de controle envia tópicos MQTT específicos (ex: <code className="text-emerald-400">cars/dev_01/cmd/reboot</code> ou <code className="text-emerald-400">set_brightness</code>). A TV reage em menos de <strong>200 milissegundos</strong>.
              </p>
              <div className="p-2 bg-slate-800/60 rounded-lg text-[11px] text-emerald-300 font-mono">
                Latência ultrabaixa em tempo real
              </div>
            </div>

          </div>

          {/* Architecture Pipeline Diagram */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Diagrama do Fluxo de Dados: Central ↔ Frota</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2">
                <div className="font-bold text-cyan-400 uppercase text-[10px]">1. Painel Administrativo</div>
                <div className="text-white font-semibold">Criação de Anúncio</div>
                <p className="text-slate-400 text-[11px]">Define geofences, criativo, horários e prioridades</p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2">
                <div className="font-bold text-indigo-400 uppercase text-[10px]">2. Servidor Cloud</div>
                <div className="text-white font-semibold">Broker MQTT + CDN</div>
                <p className="text-slate-400 text-[11px]">Compila o manifesto JSON da grade e distribui aos dispositivos</p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2">
                <div className="font-bold text-emerald-400 uppercase text-[10px]">3. TV do Veículo (Edge)</div>
                <div className="text-white font-semibold">Player Local Kiosk</div>
                <p className="text-slate-400 text-[11px]">Compara GPS em tempo real e toca o anúncio certo sem latência</p>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-2">
                <div className="font-bold text-amber-400 uppercase text-[10px]">4. Auditoria PoP</div>
                <div className="text-white font-semibold">Log Criptografado</div>
                <p className="text-slate-400 text-[11px]">Gera hash de validação imutável para faturamento e repasse</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Content Section 2: Offline-First & Edge */}
      {activeTab === 'offline_edge' && (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Por Que o Cálculo de Geofencing Deve Ser no Dispositivo Local (Edge):</h3>
            
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-3 p-3 bg-slate-800/50 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Zero Dependência de Conexão na Hora do Disparo:</strong> Se o carro estiver no subsolo de um shopping ou na descida de um viaduto onde o 4G oscila, o receptor GPS nativo do tablet continua funcionando. A TV calcula a distância para os polígonos locais via fórmula de Haversine e toca o anúncio imediatamente.
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-800/50 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Fila de Registro de Impressões (SQLite / IndexedDB Local):</strong> Toda vez que um anúncio termina de tocar ou o passageiro escaneia o QR Code, o evento é gravado no banco de dados local com coordenadas, horário e hash. Quando o 4G volta, o app envia o lote compactado via gzip para a nuvem em um único disparo.
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-800/50 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Economia Brutal de Dados Móveis:</strong> Fazer polling HTTP para a nuvem a cada segundo consumiria gigabytes de plano de dados por mês. Com Edge Geofencing, o consumo de dados se resume a downloads esporádicos de novos vídeos e envio de pings compactados.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Content Section 3: Kiosk & Security */}
      {activeTab === 'kiosk_security' && (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Android Enterprise / Device Owner</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Ativação do <strong>Lock Task Mode (Kiosk Mode Nativo)</strong> impedindo acesso à barra de navegação, status bar e configurações do Android.</li>
                <li>Desativação de conexões USB para passageiros (modo apenas carregamento de energia).</li>
                <li>Inicialização automática no boot (o app abre sozinho quando o motorista dá a partida no veículo).</li>
                <li>Acesso à área de administração protegido por PIN de 4 dígitos ou comando remoto na central.</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Watchdog & Auto-Recuperação</h3>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Serviço em segundo plano (Watchdog Daemon) monitorando a saúde da aplicação.</li>
                <li>Se o app sofrer qualquer travamento (crash ou freeze), ele é reiniciado automaticamente em <strong>1,5 segundos</strong>.</li>
                <li>Monitoramento contínuo de temperatura: se a CPU ultrapassar 65°C no verão, o brilho é reduzido para evitar superaquecimento.</li>
                <li>Desligamento suave da tela 5 minutos após a chave do carro ser desligada (evitando descarregar a bateria do veículo).</li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* Content Section 4: Future Innovations */}
      {activeTab === 'future_innovations' && (
        <div className="space-y-5 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">DOOH Programático (DSP / SSP)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conecte a rede a plataformas globais como Google Display & Video 360 e The Trade Desk via protocolos VAST/VPAID para vender espaços ociosos em leilão em tempo real (RTB).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Edge AI: Contagem de Passageiros & Atenção</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilize modelos neurais leves na câmera frontal da TV para medir quantas pessoas estão no banco de trás e se estão olhando para a tela (100% anônimo e sem gravar imagens, em total conformidade com a LGPD).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Mini-Market & Afiliados a Bordo</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permita que os passageiros comprem água, snacks, chicletes ou powerbanks direto pela tela usando PIX, com o motorista entregando o item na mão do passageiro e recebendo comissão instantânea.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
