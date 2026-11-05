import { NavPage } from './Sidebar';
import { QualityBadge } from '../common/QualityBadge';
import { useModel } from '../../contexts/ModelContext';
const titles = { dashboard: 'Tổng quan Marketing', predict: 'Dự đoán ROI của chiến dịch Marketing', scenarios: 'So sánh & Đề xuất' };
export const Header = ({ currentPage }: { currentPage: NavPage; onRefresh?: () => void }) => {
 const { status } = useModel();
 return <header className="bg-white border-b border-slate-200 px-6 md:px-8 py-5"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-xl font-bold text-slate-900">{titles[currentPage]}</h1><QualityBadge status={status} /></div></header>;
};
