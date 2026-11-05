import { LayoutDashboard, Calculator, GitCompare, Layers } from 'lucide-react';
import { NavPage } from '../../services/navigation';
export type { NavPage } from '../../services/navigation';
export const Sidebar = ({ currentPage, onPageChange }: { currentPage: NavPage; onPageChange: (page: NavPage) => void }) => {
 const displayName = import.meta.env.VITE_DISPLAY_NAME?.trim() || 'Người dùng DreamMakers';
 const items = [['dashboard','Tổng quan',LayoutDashboard],['predict','Dự đoán ROI',Calculator],['scenarios','So sánh & Đề xuất',GitCompare]] as const;
 return <aside className="w-64 bg-ink text-canvas flex flex-col h-screen sticky top-0 shrink-0"><div className="px-6 py-7 border-b border-white/15"><div className="flex gap-3 items-center"><Layers className="w-6 h-6 text-dusty" /><span className="font-bold text-lg">DreamMakers</span></div><p className="text-xs text-mist mt-2">Marketing ROI Intelligence</p></div>
 <nav aria-label="Điều hướng chính" className="flex-1 px-4 py-6 space-y-2">{items.map(([id,label,Icon]) => <button key={id} aria-label={`Đi đến ${label}`} onClick={() => onPageChange(id)} aria-current={currentPage===id ? 'page' : undefined} className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-sm text-left ${currentPage===id ? 'bg-dusty text-slate-800 font-semibold' : 'text-canvas hover:bg-white/10'}`}><Icon className="w-5 h-5" />{label}</button>)}</nav>
 <div className="p-5 border-t border-white/15"><p className="text-sm break-words" data-testid="display-name">{displayName}</p><p className="text-xs text-mist mt-1">Tên hiển thị cục bộ · không phải tài khoản đăng nhập</p></div></aside>;
};
