import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Scale, Book, BookOpen, FileText, Quote, BrainCircuit, Gavel, Plus, LayoutDashboard, ScrollText, Bot, Mic, Paperclip, ChevronDown, AlertTriangle, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll();

  // Custom Cursor Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const followMouse = () => {
      setRingPos(prev => ({
        x: prev.x + (mousePos.x - prev.x) * 0.12,
        y: prev.y + (mousePos.y - prev.y) * 0.12
      }));
      requestAnimationFrame(followMouse);
    };
    const animId = requestAnimationFrame(followMouse);
    return () => cancelAnimationFrame(animId);
  }, [mousePos]);

  // Canvas Particles Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: any[] = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      for (let i = 0; i < 140; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random(),
          da: Math.random() * 0.008 + 0.002,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const drawConns = () => {
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(184, 144, 15, ${0.06 * (1 - d / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawConns();
      stars.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.a += s.da;
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;
        if (s.y < 0) s.y = canvas.height;
        if (s.y > canvas.height) s.y = 0;
        const al = 0.15 + 0.2 * Math.abs(Math.sin(s.a));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(184, 144, 15, ${al})`;
        ctx.fill();
      });
      requestAnimationFrame(loop);
    };

    const animId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const stats = [
    { n: "250+", l: "Legal Maxims" },
    { n: "0%", l: "Hallucination Rate" },
    { n: "750+", l: "Legal Bareacts" },
    { n: "∞", l: "Litigations Draftable" }
  ];

  const features = [
    {
      num: "01",
      icon: "✍️",
      title: "Full Litigation Drafting Suite",
      desc: "Draft any legal document in existence — applications, notices, petitions, plaints, written statements, replies, affidavits, writ petitions, SLPs, bail applications, injunctions and every litigable instrument known to law. Jurisdiction-aware, court-ready, professionally structured in seconds.",
      hero: true
    },
    {
      num: "02",
      icon: "📜",
      title: "Bare Act Simplifier",
      desc: "Any statute, decoded into plain language instantly. Understand every section, proviso, and explanation without a dictionary."
    },
    {
      num: "03",
      icon: "⚡",
      title: "AI Argument Enhancer",
      desc: "Feed your argument, receive a battle-hardened version. AI-powered structure, legal logic, and persuasive force — refined for court."
    },
    {
      num: "04",
      icon: "🔍",
      title: "Precedent Case Research",
      desc: "Instantly surface landmark precedents, ratio decidendi, and obiter dicta from across all courts and jurisdictions."
    },
    {
      num: "05",
      icon: "📖",
      title: "Legal Maxims 250+",
      desc: "Every Latin and legal maxim catalogued, explained in context, and cross-referenced to real case applications."
    },
    {
      num: "06",
      icon: "🏛️",
      title: "Doctrines & Principles",
      desc: "The complete encyclopedia of legal doctrines — from res judicata to promissory estoppel — explained with case law and application."
    },
    {
      num: "07",
      icon: "🔗",
      title: "Statutory Bridge",
      desc: "Navigate the gap between old and new legislation effortlessly. Track amendments, repeals, replacements and transitions with clarity."
    },
    {
      num: "08",
      icon: "🤖",
      title: "Lexalyse AI Bot",
      desc: "Your 24/7 legal research assistant. Ask anything in law. Receive verified, hallucination-free answers backed by authority."
    },
    {
      num: "09",
      icon: "📡",
      title: "Live Legal Updates",
      desc: "Real-time legal news and developments from across the country. Synchronized every 6 hours to ensure you stay ahead of critical legislative and judicial changes."
    }
  ];

  const marqueeItems = ['Bare Act Simplifier', '✦', 'AI Argument Enhancer', '✦', 'Precedent Research', '✦', '250+ Legal Maxims', '✦', 'Litigation Drafting', '✦', 'Statutory Bridge', '✦', 'All Doctrines & Principles', '✦', 'Zero Hallucination AI', '✦', 'Live Legal Updates', '✦'];

  return (
    <div className="bg-white font-syne text-black overflow-x-hidden cursor-none selection:bg-black/10 selection:text-black">
      {/* Custom Cursor */}
      <div 
        className="fixed w-3 h-3 bg-black rounded-full pointer-events-none z-[9999] mix-blend-difference transition-[width,height] duration-300"
        style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, -50%)', width: isHovering ? '20px' : '12px', height: isHovering ? '20px' : '12px' }}
      />
      <div 
        className="fixed w-9 h-9 border border-black/30 rounded-full pointer-events-none z-[9998] transition-all duration-150 ease-out"
        style={{ left: ringPos.x, top: ringPos.y, transform: 'translate(-50%, -50%)', width: isHovering ? '56px' : '36px', height: isHovering ? '56px' : '36px' }}
      />

      <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-10" />

      {/* HERO SECTION */}
      <section className="relative z-[2] min-h-screen flex flex-col justify-center items-center text-center px-10 overflow-hidden bg-white">
        <motion.div 
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-radial-gradient from-black/5 to-transparent"
        />
        
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-5 text-black"
        >
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.5"/>
            <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="0.5"/>
            <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="0.5"/>
            <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="0.5"/>
            <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="0.5"/>
            <line x1="73" y1="73" x2="327" y2="327" stroke="currentColor" strokeWidth="0.5"/>
            <line x1="327" y1="73" x2="73" y2="327" stroke="currentColor" strokeWidth="0.5"/>
            <text x="200" y="215" textAnchor="middle" fontSize="80" fill="currentColor">⚖</text>
          </svg>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative inline-flex items-center gap-2.5 border border-black px-5 py-2 text-[10px] uppercase tracking-[0.4em] text-black mb-10 bg-black/5 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[badgeShine_3s_infinite]" />
          <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
          India's Premier Legal Intelligence Platform
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 60, scaleY: 1.2, filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, scaleY: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="font-cormorant text-[clamp(72px,14vw,170px)] font-bold leading-[0.85] tracking-[-0.04em]"
        >
          <span className="text-black">Lex</span>
          <motion.span 
            animate={{ color: ['#000000', '#666666', '#000000'], textShadow: ['0 0 0px transparent', '0 0 60px rgba(0,0,0,0.1)', '0 0 0px transparent'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="italic"
          >
            alyse
          </motion.span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-[clamp(14px,1.8vw,18px)] font-normal text-black/60 max-w-[560px] leading-[1.8] mt-8 tracking-wide"
        >
          From bare acts to courtroom arguments — the complete legal intelligence suite built for lawyers who refuse to settle for less.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex gap-5 justify-center flex-wrap mt-12"
        >
          <button 
            onClick={onEnter}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="bg-black text-white px-11 py-4 text-[11px] tracking-[0.3em] uppercase font-bold relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)] group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            Explore the Platform
          </button>
          <button 
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="bg-transparent text-black px-11 py-4 text-[11px] tracking-[0.3em] uppercase font-semibold border border-black/20 transition-all hover:border-black hover:text-black hover:bg-black/5 hover:shadow-[0_0_30px_rgba(0,0,0,0.05)]"
          >
            Watch Demo ↗
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-[9px] tracking-[0.5em] uppercase text-black/50">Scroll</span>
          <div className="w-px h-14 bg-gradient-to-b from-black to-transparent relative overflow-hidden">
            <motion.div 
              animate={{ y: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-black/20"
            />
          </div>
        </motion.div>
      </section>

      <div className="relative z-[2] h-[2px] bg-gradient-to-r from-transparent via-gray-400 via-black via-gray-600 via-black via-gray-400 to-transparent animate-pulse shadow-[0_0_40px_rgba(0,0,0,0.2)]" />

      {/* STATS SECTION */}
      <section className="relative z-[2] py-20 bg-gray-50 border-y border-black/10 overflow-hidden">
        <div className="flex flex-wrap justify-center">
          {stats.map((stat, i) => (
            <div key={i} className="flex-1 min-w-[250px] text-center px-10 py-5 border-r border-black/10 last:border-none">
              <span className="font-cormorant text-[clamp(52px,6vw,80px)] font-light text-black leading-none block">{stat.n}</span>
              <span className="text-[10px] tracking-[0.35em] uppercase text-black/50 mt-2.5 block">{stat.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SHOWCASE */}
      <section className="relative z-[2] py-32 px-10 md:px-16 bg-white">
        <div className="text-center mb-24">
          <div className="text-[10px] tracking-[0.6em] uppercase text-black/40 mb-4">Platform Capabilities</div>
          <h2 className="font-cormorant text-[clamp(42px,6vw,80px)] font-semibold leading-none tracking-tight">
            Every tool a lawyer <em className="italic text-gray-600">ever needed.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 max-w-7xl mx-auto">
          {features.map((feat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className={`relative overflow-hidden p-12 bg-white border border-black/5 transition-all duration-500 hover:border-black/40 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] group ${feat.hero ? 'lg:col-span-2 bg-gradient-to-br from-gray-50 to-white border-black/20' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
              <div className="font-cormorant text-7xl font-light text-black/5 leading-none absolute top-5 right-6 tracking-tight group-hover:text-black/10 group-hover:scale-110 transition-all duration-500">{feat.num}</div>
              
              <div className="w-14 h-14 border border-black/10 flex items-center justify-center text-2xl mb-6 relative overflow-hidden group-hover:border-black group-hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] transition-all">
                {feat.icon}
              </div>

              <h3 className={`font-cormorant font-semibold mb-3.5 leading-tight group-hover:text-black transition-colors ${feat.hero ? 'text-3xl' : 'text-2xl'}`}>
                {feat.title}
              </h3>
              <p className="text-[13px] text-black/60 leading-[1.8] font-normal tracking-wide">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <div className="relative z-[2] py-6 bg-white border-y border-black/10 overflow-hidden">
        <div className="flex whitespace-nowrap animate-[marqueeRun_18s_linear_infinite]">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className={`text-[11px] tracking-[0.35em] uppercase font-bold px-9 flex-shrink-0 ${item === '✦' ? 'text-black/20 px-2' : 'text-black'}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* BOT SECTION */}
      <section className="relative z-[2] py-32 px-10 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center bg-white text-black overflow-hidden border-b border-black/5">
        <div className="absolute top-1/2 -right-24 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-radial-gradient from-black/5 to-transparent animate-pulse" />
        
        <div className="relative z-10">
          <div className="text-[10px] tracking-[0.6em] uppercase text-gray-500 mb-5">Meet the Intelligence</div>
          <h2 className="font-cormorant text-[clamp(44px,6vw,72px)] font-semibold leading-[0.95] tracking-tight mb-7">
            Lexa<em className="italic text-gray-500">lyse</em><br />AI Bot
          </h2>
          <p className="text-[15px] text-black/60 leading-[1.9] mb-10 font-normal">
            Ask any legal question. Receive court-ready, fully sourced answers in seconds. No hallucination. No guessing. No fabricated citations. Pure legal intelligence, verified to the source.
          </p>
          
          <div className="flex flex-wrap gap-2.5 mb-10">
            {['Case Law', 'Bare Acts', 'Maxims', 'Doctrines', 'Litigation', 'Procedures'].map((pill, i) => (
              <button 
                key={i}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                className={`px-4 py-2 border border-black/15 text-[10px] tracking-[0.25em] uppercase transition-all hover:border-black hover:text-black ${i === 0 ? 'bg-black/15 border-black text-black' : 'text-black/50'}`}
              >
                {pill}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-3.5 px-7 py-4 bg-gradient-to-r from-black/5 to-black/10 border-l-4 border-black text-[12px] tracking-[0.2em] uppercase text-black">
            <div className="w-2.5 h-2.5 bg-black rounded-full animate-pulse shadow-[0_0_10px_rgba(0,0,0,0.4)]" />
            Zero Hallucination Guarantee
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 60, rotateY: -8 }}
          whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="relative perspective-1000 group"
        >
          <div className="absolute -inset-5 rounded-lg bg-radial-gradient from-black/5 to-transparent animate-pulse -z-10" />
          <div className="bg-white border border-black/10 rounded-md overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.1)]">
            <div className="bg-black/5 px-4 py-3 flex items-center gap-2 border-b border-black/10">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
              <span className="ml-2.5 text-[11px] text-black/30 tracking-widest">lexalyse-ai · legal research engine v2.1</span>
            </div>
            <div className="p-7 font-mono text-[12.5px] leading-[2.2] min-h-[280px]">
              <div className="flex gap-2.5 items-baseline">
                <span className="text-black">lex&gt;</span>
                <span className="text-black/55">What is the doctrine of res judicata?</span>
              </div>
              <div className="flex gap-2.5 items-baseline">
                <span className="text-black">ai &gt;</span>
                <span className="text-black/80">Bars relitigation of issues already decided.</span>
              </div>
              <div className="flex gap-2.5 items-baseline">
                <span className="text-black">ai &gt;</span>
                <span className="text-black/80">Auth: S.11 CPC | AIR 1960 SC 941 ✓</span>
              </div>
              <div className="mt-2 flex gap-2.5 items-baseline">
                <span className="text-black">lex&gt;</span>
                <span className="text-black/55">Draft a Section 138 NI Act legal notice</span>
              </div>
              <div className="flex gap-2.5 items-baseline">
                <span className="text-black">ai &gt;</span>
                <span className="text-black/80">Generating notice... ████████████ 100%</span>
              </div>
              <div className="flex gap-2.5 items-baseline">
                <span className="text-black">ai &gt;</span>
                <span className="text-black/80">Notice drafted. Jurisdiction: Delhi HC ✓</span>
              </div>
              <div className="mt-2 flex gap-2.5 items-baseline">
                <span className="text-black">lex&gt;</span>
                <span className="text-black/55">Maxim for adverse possession?</span>
              </div>
              <div className="flex gap-2.5 items-baseline">
                <span className="text-black">ai &gt;</span>
                <span className="text-black/80">Nemo dat quod non habet ✓</span>
              </div>
              <div className="flex gap-2.5 items-baseline">
                <span className="text-black">lex&gt;</span>
                <div className="w-2 h-3.5 bg-black animate-pulse" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="relative z-[2] h-[2px] bg-gradient-to-r from-transparent via-gray-400 via-black via-gray-600 via-black via-gray-400 to-transparent animate-pulse" />

      {/* CTA SECTION */}
      <section className="relative z-[2] py-40 px-10 md:px-16 text-center overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-cormorant text-[clamp(100px,22vw,300px)] font-bold italic text-black/5 whitespace-nowrap pointer-events-none tracking-tighter animate-[bgTextDrift_20s_ease-in-out_infinite_alternate]">
          Lexalyse
        </div>
        
        <div className="text-[10px] tracking-[0.6em] uppercase text-black/50 mb-6">Begin Your Journey</div>
        <h2 className="font-cormorant text-[clamp(48px,8vw,100px)] font-semibold leading-[0.9] tracking-tight mb-7 text-black">
          Law is complex.<br /><em className="italic text-gray-600">You shouldn't be.</em>
        </h2>
        <p className="text-base text-black/60 max-w-[500px] mx-auto mb-14 leading-[1.8] font-normal">
          Join thousands of lawyers, students, and legal professionals who've transformed how they practice law with Lexalyse.
        </p>
        
        <button 
          onClick={onEnter}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="inline-flex items-center gap-4 bg-black text-white px-16 py-5.5 text-[11px] tracking-[0.4em] uppercase font-bold relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(0,0,0,0.3)] group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
          Start Using Lexalyse <ArrowRight className="text-2xl group-hover:translate-x-2 transition-transform" />
        </button>
      </section>

      <footer className="relative z-[2] bg-white py-8 px-10 md:px-16 flex flex-col md:flex-row justify-between items-center border-t border-black/10 gap-3 text-center">
        <div className="font-cormorant text-2xl italic text-black">Lexalyse</div>
        <div className="text-[10px] tracking-[0.35em] uppercase text-black/30">Law · Intelligence · Precision</div>
      </footer>

      <style>{`
        @keyframes badgeShine {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes marqueeRun {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes bgTextDrift {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(-50%, -50%) scale(1.05); }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
