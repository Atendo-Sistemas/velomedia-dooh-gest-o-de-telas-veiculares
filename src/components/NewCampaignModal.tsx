import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  MapPin, 
  Clock, 
  DollarSign, 
  Sparkles, 
  Image as ImageIcon, 
  QrCode, 
  Tag, 
  Layers,
  CheckCircle2,
  Calendar,
  Video,
  Upload,
  Play,
  Film,
  Volume2,
  VolumeX,
  FileVideo
} from 'lucide-react';
import { Campaign, CampaignCategory, GeoFence } from '../types';

interface NewCampaignModalProps {
  geoFences: GeoFence[];
  onClose: () => void;
  onSaveCampaign: (campaign: Campaign) => void;
}

const SAMPLE_15S_VIDEOS = [
  {
    name: 'Gastronomia & Delivery (15s)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Fome de Outback? Ganhe 1 Bloomin Onion grátis!',
    tagline: 'Faça seu pedido agora pelo aplicativo ou visite o restaurante mais próximo.',
    advertiser: 'Outback Steakhouse',
    badge: 'VÍDEO 15s • PROMOÇÃO EXCLUSIVA',
  },
  {
    name: 'Tecnologia & Fintech (15s)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'Nubank Ultravioleta: 200% do CDI e Sala VIP',
    tagline: 'O cartão de crédito para quem valoriza seu tempo e busca experiências exclusivas.',
    advertiser: 'Nubank PJ & Ultravioleta',
    badge: 'VÍDEO 15s • CONVITE VIP',
  },
  {
    name: 'Carros & Mobilidade (15s)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    title: 'Novo Volvo EX30 100% Elétrico',
    tagline: 'Agende seu test-drive VIP direto pelo QR Code da tela.',
    advertiser: 'Volvo Cars Brasil',
    badge: 'VÍDEO 15s • LANÇAMENTO 2026',
  }
];

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
  geoFences,
  onClose,
  onSaveCampaign,
}) => {
  const [name, setName] = useState('');
  const [advertiser, setAdvertiser] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('food_beverage');
  const [cpm, setCpm] = useState(22.00);
  const [budgetTotal, setBudgetTotal] = useState(15000);
  const [targetImpressions, setTargetImpressions] = useState(80000);
  const [priority, setPriority] = useState(8);

  // Creative fields
  const [creativeFormat, setCreativeFormat] = useState<'video' | 'image'>('video');
  const [durationSeconds, setDurationSeconds] = useState<number>(15);
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [ctaText, setCtaText] = useState('Escanear Cupom de Desconto');
  const [mediaUrl, setMediaUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [badgeText, setBadgeText] = useState('PROMOÇÃO EXCLUSIVA NO CARRO');
  const [couponCode, setCouponCode] = useState('DESCONTO2026');
  const [discountPercentage, setDiscountPercentage] = useState('20% OFF');
  const [qrCodeUrl, setQrCodeUrl] = useState('https://minhaempresa.com.br/promo?utm=dooh');
  const [audioEnabledByDefault, setAudioEnabledByDefault] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  // Targeting fields
  const [selectedGeoFences, setSelectedGeoFences] = useState<string[]>(['all']);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(22);
  const [selectedServices, setSelectedServices] = useState<string[]>(['Uber Black', 'Uber Comfort', 'UberX']);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFileName(file.name);
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
      if (isVideo) {
        setCreativeFormat('video');
        setDurationSeconds(15); // Standard DOOH 15s
      } else {
        setCreativeFormat('image');
      }

      // Create local object URL for instant preview and player
      const objectUrl = URL.createObjectURL(file);
      setMediaUrl(objectUrl);
    }
  };

  const handleSelectSampleVideo = (sample: typeof SAMPLE_15S_VIDEOS[0]) => {
    setCreativeFormat('video');
    setDurationSeconds(15);
    setMediaUrl(sample.url);
    if (!title) setTitle(sample.title);
    if (!tagline) setTagline(sample.tagline);
    if (!advertiser) setAdvertiser(sample.advertiser);
    if (!name) setName(`${sample.advertiser} - Spot 15s`);
    setBadgeText(sample.badge);
    setUploadFileName(null);
  };

  const handleToggleGeofence = (id: string) => {
    if (id === 'all') {
      setSelectedGeoFences(['all']);
      return;
    }
    let updated = selectedGeoFences.filter((g) => g !== 'all');
    if (updated.includes(id)) {
      updated = updated.filter((g) => g !== id);
    } else {
      updated.push(id);
    }
    if (updated.length === 0) updated = ['all'];
    setSelectedGeoFences(updated);
  };

  const handleToggleService = (svc: string) => {
    if (selectedServices.includes(svc)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== svc));
      }
    } else {
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !advertiser || !title) {
      alert('Por favor preencha o nome da campanha, anunciante e título do anúncio.');
      return;
    }

    const newCampaign: Campaign = {
      id: `cmp_${Date.now()}`,
      name,
      advertiser,
      logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&auto=format&fit=crop&q=80',
      category,
      budgetTotal,
      budgetSpent: 0,
      cpm,
      status: 'active',
      priority,
      targetGeoFences: selectedGeoFences,
      schedule: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        timeSlots: [{ startHour, endHour }],
        serviceTypeFilter: selectedServices,
      },
      creative: {
        id: `crt_${Date.now()}`,
        title,
        tagline,
        type: creativeFormat === 'video' ? 'video' : 'qr_coupon',
        mediaUrl,
        badgeText,
        ctaText,
        qrCodeUrl,
        couponCode,
        discountPercentage,
        audioEnabledByDefault,
        durationSeconds,
        fullInfoHtml: tagline,
      },
      totalImpressions: 0,
      totalInteractions: 0,
      totalScans: 0,
      targetImpressions,
    };

    onSaveCampaign(newCampaign);
    onClose();
  };

  const isCurrentMediaVideo = creativeFormat === 'video' || mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.startsWith('blob:');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Criar Nova Campanha Publicitária</h2>
              <p className="text-xs text-slate-400">Suporte completo a Vídeos de 15 segundos (Padrão DOOH Veicular), Banners HD e Geofencing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Section 1: Campaign General Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4" />
              <span>1. Informações do Anunciante & Orçamento</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Nome da Campanha</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Outback Steakhouse - Horário Noturno"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Nome do Anunciante / Marca</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Outback Brasil"
                  value={advertiser}
                  onChange={(e) => setAdvertiser(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Categoria de Mercado</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="food_beverage">Alimentação, Bares & Delivery</option>
                  <option value="tech_finance">Tecnologia, Bancos & Fintechs</option>
                  <option value="automotive">Automotivo, Seguros & Frotas</option>
                  <option value="retail">Varejo, Shoppings & E-commerce</option>
                  <option value="entertainment">Entretenimento, Cinema & Eventos</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Orçamento Total (R$)</label>
                <input
                  type="number"
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">CPM (Custo por Mil Impressões - R$)</label>
                <input
                  type="number"
                  step="0.50"
                  value={cpm}
                  onChange={(e) => setCpm(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Prioridade de Exibição (1 a 10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Creative Format, Duration & Media Upload */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Video className="w-4 h-4" />
                <span>2. Formato de Mídia (Vídeo de até 15s ou Imagem) & Criativo</span>
              </h3>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-md flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Vídeos de até 15 segundos Habilitados</span>
                </span>
              </div>
            </div>

            {/* Format & Duration Selector Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              
              {/* Media Type Toggle */}
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-2">Tipo de Mídia do Anúncio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreativeFormat('video');
                      setDurationSeconds(15);
                    }}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-bold transition ${
                      creativeFormat === 'video'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileVideo className="w-4 h-4" />
                    <span>Vídeo Comercial (MP4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreativeFormat('image');
                      if (mediaUrl.includes('sample/ForBigger')) {
                        setMediaUrl('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80');
                      }
                    }}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-bold transition ${
                      creativeFormat === 'image'
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30 ring-2 ring-cyan-400/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Banner / Imagem HD</span>
                  </button>
                </div>
              </div>

              {/* Slot Duration Selector */}
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-2">
                  Tempo de Exibição na TV (Slot do Vídeo/Banner)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { sec: 10, label: '10s' },
                    { sec: 15, label: '15s (DOOH)', recommended: true },
                    { sec: 20, label: '20s' },
                    { sec: 30, label: '30s' }
                  ].map((item) => (
                    <button
                      key={item.sec}
                      type="button"
                      onClick={() => setDurationSeconds(item.sec)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition text-center flex flex-col items-center justify-center ${
                        durationSeconds === item.sec
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-400/30'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.recommended && (
                        <span className="text-[9px] text-cyan-300 font-normal">Recomendado</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Video File Upload & Samples */}
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-medium flex items-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Enviar Arquivo de Vídeo ou Imagem (MP4 / WebM / JPG / PNG)</span>
                </label>

                {uploadFileName && (
                  <span className="text-[11px] text-emerald-400 font-mono truncate max-w-[200px]">
                    Arquivo Carregado: {uploadFileName}
                  </span>
                )}
              </div>

              {/* Upload Drop Zone & Preset Buttons */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                
                <div className="lg:col-span-6">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="video/mp4,video/webm,video/ogg,image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/80 hover:bg-slate-900 text-slate-300 hover:text-white transition text-xs font-semibold"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Selecionar Vídeo de até 15s do seu Computador</span>
                  </button>
                </div>

                {/* Preset 15s sample buttons */}
                <div className="lg:col-span-6 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block w-full">
                    Ou teste um vídeo modelo de 15 segundos:
                  </span>
                  {SAMPLE_15S_VIDEOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSampleVideo(sample)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 hover:text-white font-medium transition flex items-center space-x-1"
                    >
                      <Film className="w-3 h-3 text-indigo-400" />
                      <span>{sample.name}</span>
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* Media URL Input & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              
              {/* Form Inputs */}
              <div className="lg:col-span-7 space-y-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    URL Direta da Mídia (MP4 / WebM / Imagem HD)
                  </label>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => {
                      setMediaUrl(e.target.value);
                      if (e.target.value.includes('.mp4') || e.target.value.includes('.webm')) {
                        setCreativeFormat('video');
                      }
                    }}
                    placeholder="https://meuservidor.com/video-15s.mp4"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Título do Anúncio (Headline)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fome de Outback? Ganhe 1 Bloomin' Onion grátis!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Selo / Badge de Destaque</label>
                  <input
                    type="text"
                    placeholder="Ex: VÍDEO 15s • CUPOM EXCLUSIVO NO CARRO"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Descrição / Subtítulo</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Mostre este cupom ao garçom no restaurante do shopping mais próximo ou peça pelo app com entrega expressa."
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center space-x-1 text-slate-300">
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pré-Visualização do Criativo</span>
                  </span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-300 font-mono">
                    {durationSeconds}s Slot
                  </span>
                </div>

                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
                  {isCurrentMediaVideo ? (
                    <video
                      key={mediaUrl}
                      src={mediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-[10px] font-bold text-white">
                    {isCurrentMediaVideo ? '🎬 Vídeo Comercial HD' : '📸 Banner'}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-tight">
                  {isCurrentMediaVideo 
                    ? `O vídeo será executado no player embarcado da TV veicular por ${durationSeconds} segundos em loop rotativo contínuo.` 
                    : `A imagem estática será exibida com transição suave por ${durationSeconds} segundos.`
                  }
                </p>
              </div>

            </div>

            {/* Interactive QR Code & Voucher Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Texto do Botão CTA na TV</label>
                <input
                  type="text"
                  placeholder="Ex: Resgatar Cupom"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Vantagem do Cupom</label>
                <input
                  type="text"
                  placeholder="Ex: R$ 30 OFF ou 20% OFF"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Código Promocional</label>
                <input
                  type="text"
                  placeholder="Ex: OUTBACKTV2026"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Link do QR Code</label>
                <input
                  type="text"
                  placeholder="https://empresa.com/promo"
                  value={qrCodeUrl}
                  onChange={(e) => setQrCodeUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>
            </div>

          </div>

          {/* Section 3: Geofencing & Dayparting */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-4 h-4" />
              <span>3. Segmentação por Geolocalização (Geofencing) & Horários</span>
            </h3>

            {/* Geofence Checkbox Badges */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-2">Selecione os Polígonos de Exibição:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleGeofence('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    selectedGeoFences.includes('all')
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Todas as Zonas & Cidades (Geral)
                </button>

                {geoFences.map((gf) => {
                  const isSelected = selectedGeoFences.includes(gf.id);
                  return (
                    <button
                      key={gf.id}
                      type="button"
                      onClick={() => handleToggleGeofence(gf.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-500 text-cyan-300'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: gf.color }} />
                      <span>{gf.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dayparting Horários */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Horário Inicial de Exibição</label>
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Horário Final de Exibição</label>
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{`${i.toString().padStart(2, '0')}:00`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Service Filter */}
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-2">Categorias de Veículos / Frotas Ativas:</label>
              <div className="flex flex-wrap gap-2">
                {['Uber Black', 'Uber Comfort', 'UberX', 'Taxi Especial', '99 Pop'].map((svc) => {
                  const isChecked = selectedServices.includes(svc);
                  return (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => handleToggleService(svc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isChecked
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {svc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 shadow-lg shadow-cyan-500/20 transition transform active:scale-95 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publicar Campanha na Frota</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
