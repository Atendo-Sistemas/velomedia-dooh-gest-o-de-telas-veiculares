import React, { useState } from 'react';
import { 
  Gift, 
  HelpCircle, 
  Newspaper, 
  Sparkles, 
  Copy, 
  Check, 
  Star, 
  Heart, 
  Send, 
  QrCode, 
  Car, 
  CheckCircle2, 
  Award, 
  ExternalLink,
  MapPin,
  Clock,
  Compass,
  ThumbsUp,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Campaign, Driver, PassengerTrivia, CityNewsItem } from '../types';
import { PASSENGER_TRIVIA, CITY_NEWS } from '../data/mockData';

interface PassengerPortalProps {
  currentDriver?: Driver;
  campaigns: Campaign[];
  onOpenPlayer?: () => void;
}

export const PassengerPortal: React.FC<PassengerPortalProps> = ({
  currentDriver,
  campaigns,
  onOpenPlayer,
}) => {
  const driver = currentDriver || {
    name: 'Carlos Eduardo Silva',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    carModel: 'Toyota Corolla Hybrid 2024',
    carPlate: 'BRA2E19',
    serviceType: 'Uber Black',
    rating: 4.98,
    pixKey: 'carlos.silva@pixmail.com.br'
  };

  const [activeTab, setActiveTab] = useState<'coupons' | 'trivia' | 'news' | 'tip'>('coupons');
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  
  // Trivia Game State
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  // Tip / Gorjeta State
  const [tipAmount, setTipAmount] = useState<number>(5);
  const [rating, setRating] = useState(5);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copiedTipPix, setCopiedTipPix] = useState(false);

  const currentQuestion = PASSENGER_TRIVIA[triviaIndex] || PASSENGER_TRIVIA[0];

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    confetti({ particleCount: 50, spread: 60 });
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleAnswerTrivia = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === currentQuestion.correctIndex) {
      setScore(score + 1);
      confetti({ particleCount: 40, spread: 50 });
    }
  };

  const handleNextQuestion = () => {
    if (triviaIndex < PASSENGER_TRIVIA.length - 1) {
      setTriviaIndex(triviaIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setTriviaIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleSendFeedback = () => {
    setFeedbackSent(true);
    confetti({ particleCount: 60, spread: 70 });
    setTimeout(() => setFeedbackSent(false), 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn text-slate-100 max-w-5xl mx-auto">
      
      {/* ========================================================================= */}
      {/* 1. WELCOME ABOARD HERO BANNER                                             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/30 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center space-x-4 text-center sm:text-left">
          <img
            src={driver.avatar}
            alt={driver.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-400 shadow-md flex-shrink-0"
          />
          <div>
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase">
                BEM-VINDO A BORDO
              </span>
              <span className="text-amber-300 text-xs font-bold">★ {driver.rating.toFixed(2)}</span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-1">
              Corrida com {driver.name}
            </h1>
            <p className="text-xs text-slate-300">
              {driver.carModel} • Placa <span className="font-mono text-cyan-300 font-bold">{driver.carPlate}</span> • {driver.serviceType}
            </p>
          </div>
        </div>

        {onOpenPlayer && (
          <button
            onClick={onOpenPlayer}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Car className="w-4 h-4" />
            <span>Ver Player da TV</span>
          </button>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 2. PASSENGER SUB-TABS                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'coupons'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Cupons & Descontos da Corrida</span>
        </button>

        <button
          onClick={() => setActiveTab('trivia')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'trivia'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Quiz da Cidade (Acertos: {score})</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'news'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Trânsito & Notícias SP</span>
        </button>

        <button
          onClick={() => setActiveTab('tip')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'tip'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Avaliar & Gorjeta PIX</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT: CUPONS & DESCONTOS EXCLUSIVOS                             */}
      {/* ========================================================================= */}
      {activeTab === 'coupons' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => {
              const code = camp.creative.couponCode || 'CORRIDA2026';
              const isCopied = copiedCoupon === code;
              return (
                <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={camp.logo}
                        alt={camp.advertiser}
                        className="w-12 h-12 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800"
                      />
                      <div>
                        <h3 className="text-base font-extrabold text-white">{camp.advertiser}</h3>
                        <span className="text-xs text-amber-400 font-bold block">{camp.creative.discountPercentage || 'Desconto Exclusivo'}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      CUPOM ATIVO
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{camp.creative.ctaText}</p>

                  <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Código Promocional:</span>
                      <span className="font-mono text-sm font-black text-cyan-300 tracking-wider">{code}</span>
                    </div>

                    <button
                      onClick={() => handleCopyCoupon(code)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copiado!' : 'Copiar Cupom'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT: QUIZ & TRIVIA DA CIDADE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'trivia' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn max-w-2xl mx-auto">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Pergunta {triviaIndex + 1} de {PASSENGER_TRIVIA.length}
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold">
              Pontuação: {score} Acertos
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => {
              let btnStyle = 'bg-slate-950 border-slate-800 hover:border-purple-500 text-slate-200';
              if (selectedAnswer !== null) {
                if (idx === currentQuestion.correctIndex) {
                  btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold';
                } else if (idx === selectedAnswer) {
                  btnStyle = 'bg-rose-950 border-rose-500 text-rose-300';
                } else {
                  btnStyle = 'bg-slate-950/40 border-slate-800/40 text-slate-500';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerTrivia(idx)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {selectedAnswer !== null && idx === currentQuestion.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/30 space-y-2 animate-fadeIn">
              <span className="text-xs font-bold text-purple-300 block">💡 Você sabia?</span>
              <p className="text-xs text-slate-300 leading-relaxed">{currentQuestion.explanation}</p>
              <div className="pt-2">
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Próxima Pergunta →
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT: TRÂNSITO & NOTÍCIAS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'news' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Newspaper className="w-5 h-5 text-cyan-400" />
              <span>Manchetes em Tempo Real durante a Viagem</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {CITY_NEWS.map((item) => (
                <div key={item.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                      {item.category}
                    </span>
                    <h4 className="text-xs font-bold text-white leading-snug">{item.title}</h4>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                    <span>{item.source}</span>
                    <span className="font-mono text-cyan-400">{item.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB CONTENT: AVALIAR & GORJETA PIX                                     */}
      {/* ========================================================================= */}
      {activeTab === 'tip' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fadeIn max-w-xl mx-auto">
          
          <div className="text-center space-x-2">
            <h2 className="text-lg font-extrabold text-white">Como foi sua viagem com {driver.name}?</h2>
            <p className="text-xs text-slate-400 mt-1">Sua avaliação e gorjeta incentivam motoristas de alta pontuação.</p>
          </div>

          {/* 5-Star Selector */}
          <div className="flex items-center justify-center space-x-3 py-2">
            {[1, 2, 3, 4, 5].map((st) => (
              <button
                key={st}
                onClick={() => setRating(st)}
                className={`text-2xl transition transform hover:scale-125 ${
                  st <= rating ? 'text-amber-400' : 'text-slate-700'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          {/* Gorjeta PIX Pill Selectors */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 block text-center">Enviar uma Gorjeta Voluntária via PIX:</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 20].map((val) => (
                <button
                  key={val}
                  onClick={() => setTipAmount(val)}
                  className={`py-3 rounded-2xl border text-xs font-bold transition ${
                    tipAmount === val
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  R$ {val},00
                </button>
              ))}
            </div>
          </div>

          {/* Driver PIX Box */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Chave PIX do Motorista:</span>
            <div className="flex items-center justify-center space-x-2">
              <span className="font-mono text-xs font-bold text-emerald-400">{driver.pixKey}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(driver.pixKey);
                  setCopiedTipPix(true);
                  setTimeout(() => setCopiedTipPix(false), 2500);
                }}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                {copiedTipPix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {feedbackSent ? (
            <div className="p-3 bg-emerald-950 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-300">
              Obrigado! Sua avaliação 5 estrelas foi registrada para {driver.name}!
            </div>
          ) : (
            <button
              onClick={handleSendFeedback}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Confirmar Avaliação</span>
            </button>
          )}

        </div>
      )}

    </div>
  );
};
