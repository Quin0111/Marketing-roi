import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { CAMPAIGN_TYPE_ROI_DATA } from '../../data/mockDataset';
import { CAMPAIGN_TYPE_LABELS } from '../../constants/translations';
import { CampaignType } from '../../types';

export const CampaignTypeRoiChart: React.FC = () => {
  const chartData = CAMPAIGN_TYPE_ROI_DATA.map((item) => ({
    ...item,
    vietnameseName: CAMPAIGN_TYPE_LABELS[item.type as CampaignType] || item.type,
  }));

  return (
    <div className="w-full h-72">
      <div className="text-right mb-1">
        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          Dữ liệu minh họa
        </span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EE" vertical={false} />
          <XAxis
            dataKey="vietnameseName"
            stroke="#60717A"
            fontSize={11}
            tickLine={false}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            domain={[4.96, 5.03]}
            stroke="#667780"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => val.toFixed(2).replace('.', ',')}
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
            formatter={(value: any) => [`${Number(value).toFixed(4).replace('.', ',')}`, 'ROI minh họa · thang đo dataset']}
            labelFormatter={(label) => `Loại chiến dịch: ${label}`}
          />
          <Bar dataKey="meanRoi" radius={[6, 6, 0, 0]} barSize={34} name="ROI trung bình">
            {chartData.map((_, index) => (
              <Cell key={`type-cell-${index}`} fill="#B8CCD7" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
