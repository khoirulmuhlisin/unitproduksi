
import { useEffect, useState, useCallback, useRef } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  TooltipProps,
  Legend,
  Cell,
  Line,
  ComposedChart
} from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export interface SalesDataPoint {
  date: string;
  sales: number;
  profit: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-border rounded-lg shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-primary">
          Penjualan: Rp {payload[0].value.toLocaleString()}
        </p>
        <p className="text-sm text-green-500">
          Keuntungan: Rp {payload[1].value.toLocaleString()}
        </p>
      </div>
    );
  }

  return null;
};

export default function SalesChart({ data }: SalesChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // Enhanced colors for better visual appearance
  const salesColor = "#4f46e5"; // Indigo
  const profitColor = "#10b981"; // Emerald
  
  // Add gradients for more professional look
  const salesGradientId = "salesGradient";
  const profitGradientId = "profitGradient";

  const updateDimensions = useCallback(() => {
    if (chartContainerRef.current) {
      setChartWidth(chartContainerRef.current.clientWidth);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    
    // Get chart container width for better precision
    updateDimensions();
    
    // Set up resize observer for more accurate responsiveness
    const resizeObserver = new ResizeObserver(updateDimensions);
    
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    
    // Also listen to window resize for safety
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      if (chartContainerRef.current) {
        resizeObserver.unobserve(chartContainerRef.current);
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, [updateDimensions]);

  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short' 
    })
  }));

  // Calculate optimal bar size based on container width and number of data points
  const calculateBarSize = useCallback(() => {
    if (chartWidth === 0 || chartData.length === 0) return 30;
    const availableWidth = chartWidth - 100; // Account for margins and padding
    const optimalBarWidth = Math.min(30, (availableWidth / chartData.length) / 2.5);
    return Math.max(15, optimalBarWidth); // Ensure bars aren't too thin
  }, [chartWidth, chartData.length]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Grafik Penjualan</h3>
        <p className="text-sm text-muted-foreground">Penjualan dan keuntungan 7 hari terakhir</p>
      </div>
      <div ref={chartContainerRef} className="h-80 w-full chart-container mb-6">
        {isMounted && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
              barGap={8}
            >
              <defs>
                <linearGradient id={salesGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={salesColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={salesColor} stopOpacity={0.5}/>
                </linearGradient>
                <linearGradient id={profitGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={profitColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={profitColor} stopOpacity={0.5}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={{ stroke: '#e5e7eb' }} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                axisLine={{ stroke: '#e5e7eb' }} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                tickFormatter={(value) => `Rp ${value/1000}k`}
                width={80}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} 
                wrapperStyle={{ zIndex: 1000 }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={8}
                formatter={(value) => <span className="text-sm font-medium">{value}</span>}
              />
              <Bar 
                dataKey="sales" 
                name="Penjualan" 
                fill={`url(#${salesGradientId})`}
                radius={[4, 4, 0, 0]} 
                barSize={calculateBarSize()} 
                animationDuration={1500}
              />
              <Bar 
                dataKey="profit" 
                name="Keuntungan" 
                fill={`url(#${profitGradientId})`}
                radius={[4, 4, 0, 0]} 
                barSize={calculateBarSize()} 
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke={profitColor}
                strokeWidth={2}
                dot={{ fill: profitColor, r: 4 }}
                activeDot={{ r: 6 }}
                name=""
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
