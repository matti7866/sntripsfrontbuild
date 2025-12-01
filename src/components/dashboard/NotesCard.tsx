import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import notesService from '../../services/notesService';
import { useNavigate } from 'react-router-dom';
import './NotesCard.css';

export default function NotesCard() {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['notesCategories'],
    queryFn: () => notesService.getCategories(),
    select: (data) => data.categories || []
  });

  const categories = categoriesData || [];

  // Auto-select first category
  if (categories.length > 0 && selectedCategoryId === null) {
    setSelectedCategoryId(categories[0].id);
  }

  // Load notes for selected category
  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', selectedCategoryId],
    queryFn: () => {
      if (!selectedCategoryId) throw new Error('No category selected');
      return notesService.loadNotes(selectedCategoryId);
    },
    enabled: !!selectedCategoryId,
    select: (data) => data.notes || '',
    refetchOnWindowFocus: false
  });

  // Strip HTML tags and get plain text for preview
  const getPlainText = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Truncate text for preview
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="card dashboard-card notes-dashboard-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="fa fa-sticky-note me-2"></i>
          Quick Notes
        </h5>
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => navigate('/notes')}
        >
          <i className="fa fa-external-link-alt me-1"></i> Open Full Notes
        </button>
      </div>
      <div className="card-body">
        {categoriesLoading ? (
          <div className="text-center py-4">
            <i className="fa fa-spinner fa-spin fa-2x text-muted"></i>
            <p className="mt-2 text-muted">Loading notes...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-4">
            <i className="fa fa-sticky-note fa-3x text-muted mb-3"></i>
            <p className="text-muted">No notes yet</p>
            <button 
              className="btn btn-sm btn-primary"
              onClick={() => navigate('/notes')}
            >
              Create First Note
            </button>
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            <div className="notes-tabs mb-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`notes-tab ${selectedCategoryId === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <i className="fa fa-folder me-1"></i>
                  {category.name}
                </button>
              ))}
            </div>

            {/* Notes Preview */}
            <div className="notes-preview">
              {notesLoading ? (
                <div className="text-center py-3">
                  <i className="fa fa-spinner fa-spin"></i> Loading...
                </div>
              ) : notesData ? (
                <div 
                  className="notes-content"
                  dangerouslySetInnerHTML={{ 
                    __html: truncateText(getPlainText(notesData), 300)
                      ? truncateText(getPlainText(notesData), 300)
                      : '<em class="text-muted">No content in this category yet...</em>'
                  }}
                />
              ) : (
                <div className="text-muted fst-italic">No content in this category yet...</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

