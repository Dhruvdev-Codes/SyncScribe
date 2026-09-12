import React, { useEffect, useState } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { ListTree, X, Hash } from 'lucide-react';

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export const OutlineDrawer: React.FC = () => {
  const { activeDrawer, setActiveDrawer, editorInstance, document } = useDocument();
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editorInstance) return;

    const extractHeadings = () => {
      const items: HeadingItem[] = [];
      const doc = editorInstance.state.doc;
      doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
          items.push({
            id: `heading-${pos}`,
            text: node.textContent,
            level: node.attrs.level,
          });
        }
      });
      setHeadings(items);
    };

    extractHeadings();
    editorInstance.on('update', extractHeadings);
    return () => {
      editorInstance.off('update', extractHeadings);
    };
  }, [editorInstance, document?.content]);

  if (activeDrawer !== 'outline') return null;

  const scrollToHeading = (text: string) => {
    if (!editorInstance) return;
    const { doc } = editorInstance.state;
    let targetPos: number | null = null;
    doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading' && node.textContent === text && targetPos === null) {
        targetPos = pos;
      }
    });

    if (targetPos !== null) {
      editorInstance.chain().focus().setTextSelection(targetPos).scrollIntoView().run();
    }
  };

  return (
    <aside className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-4rem)] z-30 animate-fade-in shadow-xl">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-brand-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Document Outline</h3>
        </div>

        <button
          onClick={() => setActiveDrawer(null)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {headings.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ListTree className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No headings found</p>
            <p className="text-[11px] text-slate-400 mt-1">Use H1, H2, H3 tags to build an outline</p>
          </div>
        ) : (
          <nav className="space-y-1">
            {headings.map((h, i) => (
              <button
                key={i}
                onClick={() => scrollToHeading(h.text)}
                style={{ paddingLeft: `${(h.level - 1) * 16 + 8}px` }}
                className="w-full text-left py-1.5 pr-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium truncate flex items-center gap-1.5 transition-colors group"
              >
                <Hash className="w-3 h-3 text-slate-400 group-hover:text-brand-500 flex-shrink-0" />
                <span className="truncate">{h.text || 'Untitled section'}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </aside>
  );
};
