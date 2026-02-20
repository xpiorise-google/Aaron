import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label, ZAxis } from 'recharts';
import { Task, TaskStatus } from '../types';
import { HelpCircle, XCircle, CheckCircle2, AlertTriangle, Clock, CloudCog } from 'lucide-react';

interface StrategyMatrixProps {
  tasks: Task[]; // Active/Filtered tasks for the dots
  allTasks?: Task[]; // Full history for heatmap
  onTaskClick: (taskId: string) => void;
  hoveredTaskIds: string[];
  setHoveredTaskIds: (ids: string[]) => void;
}

interface GroupedPoint {
  x: number;
  y: number;
  tasks: Task[];
  size: number;
  key: string;
}

// Heatmap now uses raw coordinates for precision
interface HeatmapPoint {
  x: number;
  y: number;
  id: string;
}

const StrategyMatrix: React.FC<StrategyMatrixProps> = ({ tasks, allTasks = [], onTaskClick, hoveredTaskIds, setHoveredTaskIds }) => {
  const [localHoverKey, setLocalHoverKey] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Heatmap Data: Map ALL history tasks to raw x/y points for the "Cloud" background
  // We no longer snap to integers, solving the misalignment issue.
  const heatmapData = useMemo(() => {
    if (!allTasks || allTasks.length === 0) return [];
    return allTasks.map(t => ({
      x: t.effortScore,
      y: t.impactScore,
      id: t.id
    }));
  }, [allTasks]);

  // Data Aggregation: Group tasks with same Impact/Effort coordinates (Active Tasks)
  const data = useMemo(() => {
    // Only use 'tasks' prop (Active ones) for the dots
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.DIVESTED && t.status !== TaskStatus.COMPLETED);
    const groups = new Map<string, Task[]>();

    activeTasks.forEach(t => {
      // Use toFixed to normalize floats for grouping key
      const key = `${t.effortScore.toFixed(1)}-${t.impactScore.toFixed(1)}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(t);
    });

    const points: GroupedPoint[] = [];
    groups.forEach((groupTasks, key) => {
      points.push({
        x: groupTasks[0].effortScore,
        y: groupTasks[0].impactScore,
        tasks: groupTasks,
        size: groupTasks.length,
        key: key
      });
    });

    return points;
  }, [tasks]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // If it's a heatmap point (has 'id' but no 'tasks' array), don't show tooltip
      // We identify Active Task points by the presence of 'tasks' array
      if (!payload[0].payload.tasks) return null;

      const point = payload[0].payload as GroupedPoint;
      
      return (
        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg shadow-2xl text-xs z-50 max-w-[250px] pointer-events-none">
          <div className="flex justify-between items-center mb-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">
             <span className="text-zinc-500 dark:text-zinc-400 font-mono">
               E: <span className="text-zinc-800 dark:text-white">{point.x}</span> / I: <span className="text-zinc-800 dark:text-white">{point.y}</span>
             </span>
             <span className="text-zinc-500">{point.tasks.length} 项</span>
          </div>
          <div className="space-y-2">
            {point.tasks.map((t, idx) => (
              <div key={t.id} className="flex flex-col">
                <div className="flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${hoveredTaskIds.includes(t.id) ? 'bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_#818cf8]' : 'bg-zinc-400 dark:bg-zinc-600'}`}></div>
                   <span className={`font-bold ${hoveredTaskIds.includes(t.id) ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                     {t.title}
                   </span>
                </div>
                {idx < point.tasks.length - 1 && <div className="border-b border-zinc-100 dark:border-zinc-800/50 my-1"></div>}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Shape for the "Cloud" Background
  // Renders a blurred circle at the EXACT coordinates of the task
  const CloudShape = (props: any) => {
    const { cx, cy } = props;
    // We use a fixed low opacity. When multiple tasks (circles) overlap, 
    // the opacity naturally accumulates, creating a darker "density" cloud.
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={35} // Radius large enough to create a "cloud" feel when blurred
        fill="#6366f1" // Indigo
        fillOpacity={0.08} // Very low opacity so stacking creates depth
        style={{ filter: 'url(#heatmapBlur)' }} // Apply Gaussian Blur
        pointerEvents="none"
      />
    );
  };

  // Custom Dot Renderer for Active Tasks
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const point = payload as GroupedPoint;
    
    // Check if this point matches the local hover OR contains ANY of the globally hovered tasks
    const isGlobalMatch = hoveredTaskIds.length > 0 && point.tasks.some(t => hoveredTaskIds.includes(t.id));
    const isLocalMatch = localHoverKey === point.key;
    const isHighlighted = isGlobalMatch || isLocalMatch;
    
    // Determine Color based on Quadrant/Score
    let fillColor = '#94a3b8';
    if (point.y >= 5 && point.x <= 5) fillColor = '#10b981'; // Green (Quick Wins)
    else if (point.y >= 5 && point.x > 5) fillColor = '#f59e0b'; // Yellow (Major)
    else if (point.y < 5 && point.x > 5) fillColor = '#ef4444'; // Red (Money Pit)
    else if (point.y < 5 && point.x <= 5) fillColor = '#64748b'; // Slate (Fillers)

    // Size calculation: Base size + extra for multiple tasks
    const baseRadius = 6;
    const radius = baseRadius + (point.size - 1) * 2; 

    return (
      <g 
        onClick={(e) => {
          e.stopPropagation();
          onTaskClick(point.tasks[0].id);
        }}
        onMouseEnter={() => {
          setLocalHoverKey(point.key);
          setHoveredTaskIds(point.tasks.map(t => t.id));
        }}
        onMouseLeave={() => {
          setLocalHoverKey(null);
          setHoveredTaskIds([]);
        }}
        style={{ cursor: 'pointer' }}
      >
        {isHighlighted && (
           <>
             {/* Pulse Effect Ring */}
             <circle cx={cx} cy={cy} r={radius + 8} fill={fillColor} opacity={0.2} pointerEvents="none">
                <animate attributeName="r" from={radius + 4} to={radius + 12} dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
             </circle>
           </>
        )}
        {/* Main Interactive Circle */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={radius} 
          fill={fillColor} 
          stroke="#fff" 
          strokeWidth={isHighlighted ? 2 : 1}
          className="transition-all duration-300"
        />
        {point.size > 1 && (
          <text 
            x={cx} 
            y={cy} 
            dy={3} 
            textAnchor="middle" 
            fill="#1e293b" 
            fontSize={10} 
            fontWeight="bold"
            pointerEvents="none"
          >
            {point.size}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-full min-h-[300px] w-full bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 relative select-none [&_.recharts-wrapper]:outline-none overflow-hidden transition-colors duration-300">
      
      {/* SVG Definitions for Filters */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="heatmapBlur" x="-100%" y="-100%" width="300%" height="300%">
            {/* High deviation creates the cloud effect */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" /> 
          </filter>
        </defs>
      </svg>

      {/* Header & Guide Tooltip Trigger */}
      <div className="absolute top-2 left-4 flex items-center gap-2 z-20">
        <h3 className="text-zinc-400 text-xs uppercase tracking-widest font-semibold">战略决策矩阵</h3>
        <div 
          onMouseEnter={() => setShowGuide(true)}
          onMouseLeave={() => setShowGuide(false)}
          className="cursor-help text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
        >
          <HelpCircle size={14} />
        </div>

        {/* Legend for Heatmap */}
        <div className="flex items-center gap-2 ml-4 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20">
           <CloudCog size={12} className="text-indigo-500 dark:text-indigo-400" />
           <span className="text-[10px] text-indigo-600 dark:text-indigo-300">历史战略概率云</span>
        </div>

        {/* COO Guide Tooltip */}
        {showGuide && (
          <div className="absolute top-6 left-0 w-80 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-xl p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
               <h4 className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                 COO 决策法则
               </h4>
               <p className="text-zinc-500 scale-90 origin-left mt-0.5">资源是有限的，ROI 决定生死。</p>
            </div>
            
            <div className="space-y-3">
              {/* Q1 */}
              <div className="flex gap-3">
                <div className="mt-0.5 text-emerald-500"><CheckCircle2 size={14} /></div>
                <div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">速赢项目 (Quick Wins)</div>
                  <div className="text-zinc-500 dark:text-zinc-400 leading-relaxed scale-95 origin-left">
                    左上角 (高产出/低耗时)。<span className="text-zinc-900 dark:text-white font-semibold underline decoration-emerald-500/50">立即亲自执行</span>。
                  </div>
                </div>
              </div>

              {/* Q2 */}
              <div className="flex gap-3">
                <div className="mt-0.5 text-amber-500"><AlertTriangle size={14} /></div>
                <div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">重大战略 (Major Projects)</div>
                  <div className="text-zinc-500 dark:text-zinc-400 leading-relaxed scale-95 origin-left">
                    右上角 (高产出/高耗时)。<span className="text-zinc-900 dark:text-white font-semibold underline decoration-amber-500/50">分解并排期</span>。
                  </div>
                </div>
              </div>

              {/* Q3 */}
              <div className="flex gap-3">
                <div className="mt-0.5 text-zinc-500"><Clock size={14} /></div>
                <div>
                  <div className="font-bold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">琐碎杂务 (Fillers)</div>
                  <div className="text-zinc-500 dark:text-zinc-400 leading-relaxed scale-95 origin-left">
                    左下角 (低产出/低耗时)。<span className="text-zinc-900 dark:text-white font-semibold underline decoration-zinc-500/50">批量处理或委派</span>。
                  </div>
                </div>
              </div>

               {/* Q4 */}
               <div className="flex gap-3">
                <div className="mt-0.5 text-rose-500"><XCircle size={14} /></div>
                <div>
                  <div className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">资源黑洞 (Money Pits)</div>
                  <div className="text-zinc-500 dark:text-zinc-400 leading-relaxed scale-95 origin-left">
                    右下角 (低产出/高耗时)。<span className="text-zinc-900 dark:text-white font-semibold underline decoration-rose-500/50">坚决砍掉</span>。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Effort" 
            domain={[0, 10]} 
            tick={{fill: '#94a3b8', fontSize: 10}}
            label={{ value: '成本 / 耗时 →', position: 'bottom', fill: '#64748b', fontSize: 10 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Impact" 
            domain={[0, 10]} 
            tick={{fill: '#94a3b8', fontSize: 10}}
            label={{ value: 'ROI / 影响力 →', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
          />
          <ZAxis range={[50, 400]} /> {/* Affects the Z-scaling if used, mostly for data points */}
          
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ strokeDasharray: '3 3', stroke: '#475569', strokeWidth: 1 }} 
            isAnimationActive={false}
          />
          
          {/* Quadrant Lines */}
          <ReferenceLine x={5} stroke="#475569" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={5} stroke="#475569" strokeDasharray="3 3" strokeOpacity={0.5} />

          {/* Labels */}
          <Label value="速赢项目" position="insideTopLeft" offset={10} style={{ fill: '#10b981', fontSize: '10px', opacity: 0.5, pointerEvents: 'none' }} />
          <Label value="重大战略" position="insideTopRight" offset={10} style={{ fill: '#f59e0b', fontSize: '10px', opacity: 0.5, pointerEvents: 'none' }} />
          <Label value="琐碎杂务" position="insideBottomLeft" offset={10} style={{ fill: '#64748b', fontSize: '10px', opacity: 0.5, pointerEvents: 'none' }} />
          <Label value="资源黑洞" position="insideBottomRight" offset={10} style={{ fill: '#ef4444', fontSize: '10px', opacity: 0.5, pointerEvents: 'none' }} />

          {/* Layer 1: Background Heatmap Cloud (All Tasks) */}
          <Scatter 
            name="HeatmapCloud" 
            data={heatmapData} 
            shape={<CloudShape />} 
            legendType="none"
            isAnimationActive={false}
          />

          {/* Layer 2: Active Tasks Dots */}
          <Scatter 
            name="Tasks" 
            data={data} 
            shape={<CustomDot />} 
            isAnimationActive={true}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StrategyMatrix;