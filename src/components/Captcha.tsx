import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaProps {
  value: string;
  onChange: (value: string) => void;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function Captcha({ value, onChange }: CaptchaProps) {
  const [code, setCode] = useState(generateCode);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0a0e1a');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.15 + Math.random() * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }

    // Dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(255, 215, 0, ${Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Characters
    const fonts = ['bold 28px Georgia', 'bold 26px Courier New', 'bold 30px Times New Roman'];
    const colors = ['#FFD700', '#FFCC00', '#D4AF37', '#FFD700'];
    const spacing = w / (text.length + 1);

    for (let i = 0; i < text.length; i++) {
      ctx.save();
      const x = spacing * (i + 1);
      const y = h / 2 + (Math.random() - 0.5) * 8;
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.font = fonts[Math.floor(Math.random() * fonts.length)];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  };

  const refresh = () => {
    const newCode = generateCode();
    setCode(newCode);
    onChange('');
  };

  useEffect(() => {
    drawCaptcha(code);
  }, [code]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <canvas
          ref={canvasRef}
          width={200}
          height={60}
          className="rounded-lg border border-yellow-500/40"
        />
        <button
          type="button"
          onClick={refresh}
          className="p-2 rounded-lg border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
          aria-label="Refresh captcha"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="Enter 6-digit code"
        maxLength={6}
        className="mt-3 w-full px-4 py-2.5 rounded-lg bg-slate-900/60 border border-yellow-500/30 text-yellow-50 placeholder-gray-500 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-colors tracking-[0.5em] text-center font-mono text-lg"
      />
      <input type="hidden" data-captcha-code value={code} readOnly />
    </div>
  );
}
