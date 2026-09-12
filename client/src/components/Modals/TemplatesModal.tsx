import React, { useState, useEffect } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { templateApi, documentApi } from '../../services/api';
import { TemplateItem } from '../../types';
import { BookOpen, X, Sparkles, ArrowRight, Check } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (id: string) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
}) => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      templateApi
        .getAll()
        .then((res) => {
          setTemplates(res);
          if (res.length > 0) setSelectedTemplate(res[0]);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUseTemplate = async () => {
    if (!selectedTemplate || isCreating) return;
    setIsCreating(true);
    try {
      const newDoc = await documentApi.create({
        title: selectedTemplate.title,
        content: selectedTemplate.content,
        plainText: selectedTemplate.content.replace(/<[^>]*>?/gm, ' '),
        icon: selectedTemplate.icon || '📝',
        tags: [selectedTemplate.category || 'template'],
      });

      onClose();
      onSelectDocument(newDoc.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[560px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Template Gallery
              </h3>
              <p className="text-xs text-slate-400">
                Jumpstart your document with curated structures
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* List column */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="py-10 text-center text-xs text-slate-400">Loading templates...</div>
            ) : (
              templates.map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500/50 shadow-xs'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{tpl.icon || '📄'}</span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {tpl.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{tpl.description}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Preview column */}
          <div className="w-2/3 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden">
            {selectedTemplate ? (
              <>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase font-semibold text-brand-500 tracking-wider">
                      {selectedTemplate.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {selectedTemplate.title}
                    </h3>
                  </div>

                  <button
                    onClick={handleUseTemplate}
                    disabled={isCreating}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isCreating ? 'Creating...' : 'Use This Template'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 text-xs prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 m-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select a template to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
