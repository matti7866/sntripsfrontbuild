import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import notesService from '../../services/notesService';
import './NotesCard.css';

export default function NotesCard() {
  const queryClient = useQueryClient();
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserTypingRef = useRef<boolean>(false);
  const lastCategoryIdRef = useRef<number | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['notesCategories'],
    queryFn: () => notesService.getCategories(),
    select: (data) => data.categories || []
  });

  const categories = categoriesData || [];

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  // Load notes when category changes
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', selectedCategoryId],
    queryFn: () => {
      if (!selectedCategoryId) throw new Error('No category selected');
      return notesService.loadNotes(selectedCategoryId);
    },
    enabled: !!selectedCategoryId,
    select: (data) => data.notes || '',
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  // Update editor content when notes load
  useEffect(() => {
    if (selectedCategoryId && editorRef.current) {
      if (lastCategoryIdRef.current !== selectedCategoryId) {
        if (!notesLoading && notesData !== undefined) {
          editorRef.current.innerHTML = notesData;
          setEditorContent(notesData);
          lastCategoryIdRef.current = selectedCategoryId;
          isUserTypingRef.current = false;
        }
      } else if (lastCategoryIdRef.current === selectedCategoryId && !notesLoading && notesData !== undefined && !isUserTypingRef.current) {
        const currentContent = editorRef.current.innerHTML;
        if (currentContent !== notesData) {
          editorRef.current.innerHTML = notesData;
          setEditorContent(notesData);
        }
      }
    }
  }, [notesData, selectedCategoryId, notesLoading]);

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: ({ content, categoryId }: { content: string; categoryId: number }) =>
      notesService.saveNotes(content, categoryId),
    onSuccess: (_, variables) => {
      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['notes', variables.categoryId] });
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  });

  // Auto-save handler
  const handleEditorChange = useCallback(() => {
    if (!editorRef.current || !selectedCategoryId) return;

    isUserTypingRef.current = true;
    const content = editorRef.current.innerHTML;
    setEditorContent(content);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(() => {
      saveNotesMutation.mutate({
        content,
        categoryId: selectedCategoryId
      });
      isUserTypingRef.current = false;
    }, 1000);
  }, [selectedCategoryId, saveNotesMutation]);

  // Save on blur
  const handleEditorBlur = useCallback(() => {
    if (!editorRef.current || !selectedCategoryId) return;
    
    const content = editorRef.current.innerHTML;
    if (content !== editorContent) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveNotesMutation.mutate({
        content,
        categoryId: selectedCategoryId
      });
    }
    isUserTypingRef.current = false;
  }, [selectedCategoryId, editorContent, saveNotesMutation]);

  // Manual save
  const handleManualSave = () => {
    if (!editorRef.current || !selectedCategoryId) return;
    
    const content = editorRef.current.innerHTML;
    saveNotesMutation.mutate({
      content,
      categoryId: selectedCategoryId
    });
  };

  // Formatting functions
  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className="dashboard-section notes-card-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <i className="fas fa-sticky-note"></i>
            Quick Notes
          </h2>
        </div>
        <div className="notes-card-actions">
          <select 
            className="category-select"
            value={selectedCategoryId || ''}
            onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
            disabled={categoriesLoading}
          >
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className={`save-indicator save-indicator-${saveStatus}`}>
            {saveStatus === 'idle' && <i className="fas fa-circle"></i>}
            {saveStatus === 'saving' && <i className="fas fa-spinner fa-spin"></i>}
            {saveStatus === 'saved' && <i className="fas fa-check"></i>}
            {saveStatus === 'error' && <i className="fas fa-exclamation-triangle"></i>}
            <span>
              {saveStatus === 'idle' && 'Ready'}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'error' && 'Error'}
            </span>
          </div>
        </div>
      </div>
      <div className="section-body notes-card-body">
        {/* Toolbar */}
        <div className="notes-toolbar">
          <button type="button" onClick={() => execCommand('bold')} title="Bold" className="toolbar-btn">
            <i className="fas fa-bold"></i>
          </button>
          <button type="button" onClick={() => execCommand('italic')} title="Italic" className="toolbar-btn">
            <i className="fas fa-italic"></i>
          </button>
          <button type="button" onClick={() => execCommand('underline')} title="Underline" className="toolbar-btn">
            <i className="fas fa-underline"></i>
          </button>
          <div className="toolbar-divider"></div>
          <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List" className="toolbar-btn">
            <i className="fas fa-list-ul"></i>
          </button>
          <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List" className="toolbar-btn">
            <i className="fas fa-list-ol"></i>
          </button>
          <div className="toolbar-divider"></div>
          <button type="button" onClick={handleManualSave} title="Save Now" className="toolbar-btn toolbar-btn-save">
            <i className="fas fa-save"></i>
          </button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          className="notes-editor"
          contentEditable={true}
          onInput={handleEditorChange}
          onBlur={handleEditorBlur}
          suppressContentEditableWarning={true}
          style={{
            minHeight: '800px',
            maxHeight: '800px',
            overflowY: 'auto',
            padding: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#ffffff',
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
}

