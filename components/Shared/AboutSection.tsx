
import React from 'react';
import { 
  Info, 
  Code2, 
  Rocket, 
  MessageCircle, 
  Zap, 
  Cpu, 
  Sparkles,
  Phone,
  Terminal,
  ExternalLink,
  Laptop
} from 'lucide-react';

const AboutSection: React.FC = () => {
  const whatsappNumber = "5594991729267";
  const whatsappMessage = encodeURIComponent("Olá Rafael! Vi seu contato no sistema Economize Atacadão e gostaria de fazer um orçamento.");

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Header */}
      <div className="relative bg-slate-900 rounded-[40px] p-8 sm:p-12 overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
          <Terminal className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600/20 text-red-400 rounded-full border border-red-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Inovação & Tecnologia</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
            Transformando <span className="text-red-500">Ideias</span> em <br />Soluções Digitais
          </h1>
          
          <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
            Este sistema foi criado por <span className="text-white font-bold">Rafael</span>, a partir de uma ideia simples: 
            você traz a necessidade, o resto ele transforma em solução.
          </p>
        </div>
      </div>

      {/* Grid de Diferenciais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <FeatureCard 
          icon={Cpu} 
          title="Personalização" 
          description="Cada projeto é focado em automatizar processos e facilitar a sua rotina real."
        />
        <FeatureCard 
          icon={Laptop} 
          title="Sistemas Modernos" 
          description="Interfaces funcionais e de alto desempenho que se adaptam à sua realidade."
        />
        <FeatureCard 
          icon={Rocket} 
          title="Foco em Eficiência" 
          description="Otimize seu tempo com ferramentas feitas sob medida para sua necessidade."
        />
      </div>

      {/* Call to Action */}
      <div className="mt-12 bg-white border border-slate-200 rounded-[40px] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">💡 Teve uma ideia?</h3>
          <p className="text-sm text-slate-500 font-medium">Rafael cuida de todo o desenvolvimento para você.</p>
        </div>
        
        <a 
          href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all active:scale-95"
        >
          <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Fazer Orçamento
          <ExternalLink className="w-4 h-4 opacity-50" />
        </a>
      </div>

      <div className="mt-12 text-center pb-12">
        <div className="inline-flex items-center gap-3 text-slate-300">
          <div className="h-px w-8 bg-slate-200" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Desenvolvimento Sob Medida</p>
          <div className="h-px w-8 bg-slate-200" />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 hover:border-red-100 transition-all group shadow-sm hover:shadow-xl">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all mb-6">
      <Icon className="w-6 h-6" />
    </div>
    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">{title}</h4>
    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{description}</p>
  </div>
);

export default AboutSection;
