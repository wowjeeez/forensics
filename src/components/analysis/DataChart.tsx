import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DataChartProps {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  dataKey: string;
  nameKey?: string;
  title?: string;
}

const COLORS = ['#589DF6', '#6AAF50', '#FFC66D', '#CC7832', '#E06C75', '#9876AA', '#56B6C2'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-editor-toolbar border border-editor-border rounded px-3 py-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="text-sm">
            <span className="text-gray-400">{entry.name}: </span>
            <span className="text-gray-200 font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function DataChart({ type, data, dataKey, nameKey = 'name', title }: DataChartProps) {
  return (
    <div className="h-full w-full flex flex-col bg-editor-bg p-4">
      {title && (
        <h3 className="text-lg font-medium text-gray-200 mb-4">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#323232" />
            <XAxis dataKey={nameKey} stroke="#A9B7C6" />
            <YAxis stroke="#A9B7C6" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#A9B7C6' }} />
            <Bar dataKey={dataKey} fill="#589DF6" />
          </BarChart>
        ) : type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#323232" />
            <XAxis dataKey={nameKey} stroke="#A9B7C6" />
            <YAxis stroke="#A9B7C6" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#A9B7C6' }} />
            <Line type="monotone" dataKey={dataKey} stroke="#589DF6" strokeWidth={2} />
          </LineChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
