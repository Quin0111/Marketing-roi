import React, { useState } from 'react';
import { Sidebar, NavPage } from './Sidebar';
import { Header } from './Header';
import { Menu, X } from 'lucide-react';
import { useModel } from '../../contexts/ModelContext';

interface LayoutProps {
  currentPage: NavPage;
  onPageChange: (page: NavPage) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentPage, onPageChange, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { status, loading, error, refresh } = useModel();

  const handleNavClick = (page: NavPage) => {
    onPageChange(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased text-slate-800 font-sans">
      {/* Thanh Header dành cho Mobile */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-navy-950 text-white sticky top-0 z-40 border-b border-navy-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-dusty text-slate-800 flex items-center justify-center font-bold text-sm">
            DM
          </div>
          <span className="font-bold text-base tracking-tight">DreamMakers ROI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-navy-800 text-slate-300 hover:text-white"
          aria-expanded={mobileMenuOpen} aria-label="Mở thanh điều hướng"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Drawer menu dành cho Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-navy-950  flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-6 border-b border-navy-800">
            <span className="font-bold text-lg text-white">DreamMakers ROI</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-navy-800 text-slate-300"
              aria-label="Đóng thanh điều hướng"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav aria-label="Điều hướng chính trên di động" className="flex-1 py-6 space-y-2">
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium ${
                currentPage === 'dashboard' ? 'bg-blue-600 text-slate-800' : 'text-slate-300 hover:bg-navy-800'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => handleNavClick('predict')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium ${
                currentPage === 'predict' ? 'bg-blue-600 text-slate-800' : 'text-slate-300 hover:bg-navy-800'
              }`}
            >
              Dự đoán ROI
            </button>
            <button
              onClick={() => handleNavClick('scenarios')}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium ${
                currentPage === 'scenarios' ? 'bg-blue-600 text-slate-800' : 'text-slate-300 hover:bg-navy-800'
              }`}
            >
              So sánh &amp; Đề xuất
            </button>

          </nav>
        </div>
      )}

      {/* Thanh điều hướng cố định trên máy tính (Desktop Sidebar) */}
      <div className="hidden md:block">
        <Sidebar currentPage={currentPage} onPageChange={handleNavClick} />
      </div>

      {/* Vùng nội dung chính */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header currentPage={currentPage} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {currentPage !== 'predict' && !loading && status === 'UNVERIFIED' && <div role="alert" className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 space-y-2">
            <p>{error || 'Chưa xác minh được mô hình từ Backend.'} Các số minh họa và snapshot lịch sử vẫn có thể đọc; không phải kết quả suy luận trực tiếp.</p>
            <button onClick={() => void refresh()} className="font-semibold underline">Tải lại thông tin mô hình</button>
          </div>}
          {children}
        </main>
      </div>
    </div>
  );
};
