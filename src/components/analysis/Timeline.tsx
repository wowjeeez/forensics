import { useMemo } from 'react';
import { Clock } from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  title: string;
  description?: string;
  category?: string;
  color?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [events]);

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      file: 'text-ide-blue',
      database: 'text-ide-purple',
      network: 'text-ide-cyan',
      system: 'text-ide-yellow',
      error: 'text-ide-red',
      default: 'text-ide-green',
    };
    return colors[category || 'default'] || colors.default;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="h-full w-full flex flex-col bg-editor-bg">
      <div className="h-10 border-b border-editor-border flex items-center px-4">
        <Clock className="w-4 h-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-300">Timeline</span>
        <span className="ml-auto text-xs text-gray-500">{events.length} events</span>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-editor-border" />

          {sortedEvents.map((event) => (
            <div key={event.id} className="relative pl-8 pb-6">
              {/* Dot */}
              <div
                className={`absolute left-0 w-4 h-4 rounded-full border-2 border-editor-bg ${
                  event.color || 'bg-ide-blue'
                }`}
                style={{ top: '4px' }}
              />

              {/* Content */}
              <div className="bg-editor-toolbar border border-editor-border rounded p-3 hover:border-ide-blue transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-200">{event.title}</h4>
                  {event.category && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(event.category)}`}
                    >
                      {event.category}
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  {formatDate(event.timestamp)}
                </div>

                {event.description && (
                  <p className="text-sm text-gray-400">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
