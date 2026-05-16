import type { ReactNode } from 'react';

interface KanbanColumn {
  id: number;
  title: string;
  color: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  renderCards: (columnId: number) => ReactNode;
}

export default function KanbanBoard({ columns, renderCards }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-1 min-h-[400px]">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex-1 min-w-[280px] bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-gray-100"
        >
          {/* Column Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
              <h3 className="text-sm font-semibold text-gray-700">{col.title}</h3>
            </div>
          </div>
          {/* Cards container */}
          <div className="p-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
            {renderCards(col.id)}
          </div>
        </div>
      ))}
    </div>
  );
}
