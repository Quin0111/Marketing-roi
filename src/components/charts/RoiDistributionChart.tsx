import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ROI_DISTRIBUTION } from '../../data/mockDataset';
import { formatNumberVi } from '../../constants/translations';

export const RoiDistributionChart: React.FC = () => {
  return (
    <div className="w-full h-72">
      <div className="text-right mb-1">
        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          Dữ liệu minh họa
        </span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={ROI_DISTRIBUTION} margin={{ top: 10, right: 10, left: -5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EE" vertical={false} />
          <XAxis
            dataKey="range"
            stroke="#667780"
            fontSize={11}
            tickLine={false}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            stroke="#667780"
            fontSize={11}
            tickLine={false}
            tickFormatter={(value) => `${formatNumberVi(value / 1000)} nghìn`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#485760',
              borderRadius: '12px',
              border: 'none',
              color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              fontSize: '12px',
              padding: '10px 14px',
            }}
            formatter={(value: any) => [
              `${formatNumberVi(Number(value))} chiến dịch (${String(ROI_DISTRIBUTION.find(d => d.count === value)?.percentage).replace('.', ',')}%)`,
              'Số lượng chiến dịch'
            ]}
            labelFormatter={(label) => `Khoảng ROI: ${label}`}
          />
          <Bar
            dataKey="count"
            fill="#B8CCD7"
            radius={[6, 6, 0, 0]}
            name="Số lượng chiến dịch"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
