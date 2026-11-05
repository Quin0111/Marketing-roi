import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DURATION_ROI_DATA } from '../../data/mockDataset';

export const DurationRoiChart: React.FC = () => {
  return (
    <div className="w-full h-72">
      <div className="text-right mb-1">
        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
          Dữ liệu minh họa
        </span>
      </div>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={DURATION_ROI_DATA} margin={{ top: 20, right: 25, left: -10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF0EE" vertical={false} />
          <XAxis
            dataKey="duration"
            stroke="#60717A"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            domain={[4.98, 5.02]}
            stroke="#667780"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => val.toFixed(3).replace('.', ',')}
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
            labelFormatter={(label) => `Thời lượng: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="meanRoi"
            name="ROI trung bình"
            stroke="#B8CCD7"
            strokeWidth={3}
            dot={{ r: 6, fill: '#B8CCD7', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 8, fill: '#B8CCD7' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
