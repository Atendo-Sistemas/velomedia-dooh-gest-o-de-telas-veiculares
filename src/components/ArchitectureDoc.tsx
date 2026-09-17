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
  Award
} from 'lucide-react';

export const ArchitectureDoc: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'iot_comm' | 'offline_edge' | 'kiosk_security' | 'future_innovations'>('iot_comm');

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
              Guia de Arquitetura Técnica & Otimização Edge/IoT
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Melhores práticas para comunicação ultra-leve entre a nuvem e os monitores veiculares, resiliência offline e oportunidades de monetização.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
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
