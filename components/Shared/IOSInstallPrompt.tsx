
import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, ShoppingBag, ArrowUp, ChevronRight } from 'lucide-react';

const IOSInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Detecta se é iOS
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detecta se já está no modo standalone (instalado)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    // Mostra o prompt se for iOS e não estiver instalado
    if (isIos && !isStandalone) {
      const hasDismissed = localStorage.getItem('ios_prompt_dismissed');
      if (!hasDismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const dismissPrompt = () => {
    setIsVisible(false);
    localStorage.setItem('ios_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 animate-in slide-in-from-bottom duration-700">
      <div className="bg-white rounded-[32px] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 p-6 relative overflow-hidden">
        {/* Botão de Fechar */}
        <button 
          onClick={dismissPrompt}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-100">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Instalar Economize</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Adicione o ícone à sua tela de início</p>
          </div>

          <div className="w-full space-y-3 mt-2">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-500">
                <Share className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-left">
                1. Toque no botão de <span className="text-blue-600">Compartilhar</span> abaixo
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-600">
                <PlusSquare className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-left">
                2. Role e escolha <span className="text-slate-900">"Adicionar à Tela de Início"</span>
              </p>
            </div>
          </div>

          <div className="pt-2 animate-bounce">
            <ArrowUp className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallPrompt;
