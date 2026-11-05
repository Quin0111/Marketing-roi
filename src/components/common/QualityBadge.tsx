import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { ModelQualityStatus } from '../../types';
import { QUALITY_STATUS_LABELS, SCIENTIFIC_STATEMENTS } from '../../constants/translations';
export function QualityBadge({ status, showDetails=false, className='' }: { status: ModelQualityStatus; showDetails?: boolean; className?: string }) {
 const [open,setOpen] = useState(false);
 const [position,setPosition] = useState({ left:8,top:8,width:288 });
 const button=useRef<HTMLButtonElement>(null); const tooltip=useRef<HTMLDivElement>(null); const id=useId();
 const visible=open||showDetails;
 useEffect(() => {
  if (!visible) return;
  const place=() => { const anchor=button.current?.getBoundingClientRect(); if (!anchor) return;
   const width=Math.min(288,window.innerWidth-16), height=tooltip.current?.getBoundingClientRect().height || 180;
   setPosition({ width,left:Math.max(8,Math.min(anchor.right-width,window.innerWidth-width-8)),top:Math.max(8,anchor.bottom+8+height < window.innerHeight ? anchor.bottom+8 : anchor.top-height-8) }); };
  const close=(event:KeyboardEvent) => { if(event.key==='Escape') { setOpen(false); button.current?.focus(); } };
  const outside=(event:PointerEvent) => { if(!button.current?.contains(event.target as Node) && !tooltip.current?.contains(event.target as Node)) setOpen(false); };
  place(); window.addEventListener('resize',place); window.addEventListener('scroll',place,true); window.addEventListener('keydown',close); window.addEventListener('pointerdown',outside);
  return () => { window.removeEventListener('resize',place); window.removeEventListener('scroll',place,true); window.removeEventListener('keydown',close); window.removeEventListener('pointerdown',outside); };
 },[visible]);
 return <div className={`inline-flex ${className}`}><button ref={button} type="button" onClick={() => setOpen(!open)} aria-expanded={visible} aria-describedby={visible?id:undefined} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs border border-slate-200 text-slate-700 bg-slate-50" aria-label={`Quality Gate: ${status}`}><Info className="w-4 h-4" />{status==='BASELINE_ONLY' ? 'BASELINE_ONLY' : QUALITY_STATUS_LABELS[status]}</button>
 {visible && createPortal(<div ref={tooltip} id={id} role="tooltip" style={{...position,position:'fixed',zIndex:1000,maxHeight:'calc(100dvh - 16px)',overflowY:'auto'}} className="p-4 text-xs bg-white rounded-xl border shadow-lg text-slate-600"><p className="font-semibold text-slate-900 mb-2">Cơ chế kiểm soát chất lượng (Quality Gate)</p><p>{status==='BASELINE_ONLY' ? SCIENTIFIC_STATEMENTS.qualityGateWarning : status==='UNVERIFIED' ? 'Chưa xác minh được trạng thái mô hình từ Backend. Không đưa ra khuyến nghị tối ưu.' : 'Trạng thái này không được chấp nhận trong phiên bản hiện tại.'}</p></div>,document.body)}</div>;
}
