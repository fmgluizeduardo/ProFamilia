"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenLine } from "lucide-react";

export function SignaturePad({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const movedRef = useRef(false);
  // Guarda o estado real em ref: o redesenho no redimensionamento pode ocorrer
  // com um closure antigo e, sem isso, apagar a assinatura já coletada.
  const temTintaRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const setup = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const { width, height } = parent.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    // Preserva o traço existente ao girar o aparelho ou redimensionar a janela.
    const snapshot = temTintaRef.current ? canvas.toDataURL() : null;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#16222f";
    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = snapshot;
    }
  }, []);

  useEffect(() => {
    setup();
    window.addEventListener("resize", setup);
    return () => window.removeEventListener("resize", setup);
  }, [setup]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function emit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    temTintaRef.current = true;
    setHasInk(true);
    onChange(canvas.toDataURL("image/png"));
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    movedRef.current = false;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    movedRef.current = true;
  }

  function onUp() {
    if (drawingRef.current && movedRef.current) emit();
    drawingRef.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    temTintaRef.current = false;
    setHasInk(false);
    onChange(null);
  }

  return (
    <div>
      <div className="relative h-44 w-full overflow-hidden rounded-xl border-2 border-dashed border-ink-200 bg-white">
        {!hasInk && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-ink-300">
            <PenLine className="h-6 w-6" strokeWidth={1.8} />
            <span className="text-[0.78rem] font-semibold">
              Assine aqui com o dedo ou caneta
            </span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none cursor-crosshair"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
      </div>
      {hasInk && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[0.75rem] font-bold text-ink-500 transition-colors hover:border-ink-300 active:scale-[0.97]"
        >
          <Eraser className="h-3.5 w-3.5" />
          Limpar assinatura
        </button>
      )}
    </div>
  );
}
