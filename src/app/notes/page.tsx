'use client';

import { useState, useMemo } from 'react';
import { 
  StickyNote, Search, Plus, Trash2, Edit2, X, Star, 
  Lightbulb, Grid3X3, List, Filter, Tag, Clock, 
  Sparkles, Brain, Zap, ChevronDown, Archive, Pin
} from 'lucide-react';
import { useDataStore } from '@/store';
import { ConfirmModal } from '@/components/modals';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Note, BrainstormSession } from '@/types';

type ViewMode = 'grid' | 'list';
type TabMode = 'notes' | 'brainstorm';

// Note Colors
const noteColors = [
  { value: '#ffffff', label: 'Weiß', bg: 'bg-white', border: 'border-gray-200' },
  { value: '#fef3c7', label: 'Gelb', bg: 'bg-amber-100', border: 'border-amber-200' },
  { value: '#d1fae5', label: 'Grün', bg: 'bg-emerald-100', border: 'border-emerald-200' },
  { value: '#dbeafe', label: 'Blau', bg: 'bg-blue-100', border: 'border-blue-200' },
  { value: '#fce7f3', label: 'Pink', bg: 'bg-pink-100', border: 'border-pink-200' },
  { value: '#e9d5ff', label: 'Lila', bg: 'bg-purple-100', border: 'border-purple-200' },
  { value: '#fed7aa', label: 'Orange', bg: 'bg-orange-100', border: 'border-orange-200' },
];

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState<TabMode>('notes');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showBrainstormForm, setShowBrainstormForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingSession, setEditingSession] = useState<BrainstormSession | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteColor, setNoteColor] = useState('#ffffff');
  const [notePinned, setNotePinned] = useState(false);
  const [noteTags, setNoteTags] = useState<string[]>([]);

  // Brainstorm form state
  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [brainstormIdeas, setBrainstormIdeas] = useState<string[]>(['']);
  const [newIdea, setNewIdea] = useState('');

  const { 
    notes = [], 
    brainstormSessions = [],
    tags = [],
    addNote, 
    updateNote, 
    deleteNote, 
    archiveNote,
    addBrainstormSession,
    updateBrainstormSession,
    deleteBrainstormSession,
  } = useDataStore();

  // Filter notes by search
  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes.filter(n => !n.archivedAt);
    const query = searchQuery.toLowerCase();
    return notes.filter(n => 
      !n.archivedAt && (
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      )
    );
  }, [notes, searchQuery]);

  // Sort notes: pinned first, then by date
  const sortedNotes = useMemo(() => {
    return [...filteredNotes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [filteredNotes]);

  // Filter brainstorm sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery) return brainstormSessions;
    const query = searchQuery.toLowerCase();
    return brainstormSessions.filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.ideas.some(i => i.content.toLowerCase().includes(query))
    );
  }, [brainstormSessions, searchQuery]);

  const handleSaveNote = async () => {
    const noteData = {
      title: noteTitle || 'Unbenannte Notiz',
      content: noteContent,
      type: 'note' as const,
      color: noteColor,
      isPinned: notePinned,
      tags: noteTags,
    };

    try {
      if (editingNote) {
        await updateNote(editingNote.id, { ...noteData, updatedAt: new Date() });
        setEditingNote(null);
      } else {
        await addNote(noteData);
      }
      resetNoteForm();
    } catch (error) {
      console.error('Fehler beim Speichern der Notiz:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  const handleSaveBrainstorm = async () => {
    const ideas = brainstormIdeas
      .filter(idea => idea.trim())
      .map((content, index) => ({
        id: `idea-${Date.now()}-${index}`,
        content,
        createdAt: new Date(),
      }));

    const sessionData = {
      title: brainstormTopic || 'Brainstorming',
      ideas,
    };

    try {
      if (editingSession) {
        await updateBrainstormSession(editingSession.id, sessionData);
        setEditingSession(null);
      } else {
        await addBrainstormSession(sessionData);
      }
      resetBrainstormForm();
    } catch (error) {
      console.error('Fehler beim Speichern des Brainstorms:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  const resetNoteForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setNoteColor('#ffffff');
    setNotePinned(false);
    setNoteTags([]);
    setShowNoteForm(false);
  };

  const resetBrainstormForm = () => {
    setBrainstormTopic('');
    setBrainstormIdeas(['']);
    setNewIdea('');
    setShowBrainstormForm(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteColor(note.color || '#ffffff');
    setNotePinned(note.isPinned || false);
    setNoteTags(note.tags || []);
    setShowNoteForm(true);
  };

  const handleEditSession = (session: BrainstormSession) => {
    setEditingSession(session);
    setBrainstormTopic(session.title);
    setBrainstormIdeas(session.ideas.map(i => i.content));
    setShowBrainstormForm(true);
  };

  const addBrainstormIdea = () => {
    if (newIdea.trim()) {
      setBrainstormIdeas([...brainstormIdeas, newIdea.trim()]);
      setNewIdea('');
    }
  };

  const removeIdea = (index: number) => {
    setBrainstormIdeas(brainstormIdeas.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Notizen & Ideen</h1>
            <p className="text-gray-500 mt-1">Halte deine Gedanken und Ideen fest</p>
          </div>

          <button
            onClick={() => activeTab === 'notes' ? setShowNoteForm(true) : setShowBrainstormForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={16} />
            {activeTab === 'notes' ? 'Neue Notiz' : 'Neue Session'}
          </button>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex items-center justify-between mb-6">
        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'notes'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <StickyNote size={16} />
            Notizen
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
              {notes.filter(n => !n.archivedAt).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('brainstorm')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'brainstorm'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Brain size={16} />
            Brainstorming
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
              {brainstormSessions.length}
            </span>
          </button>
        </div>

        {/* Search & View Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {activeTab === 'notes' && (
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Raster-Ansicht"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Listen-Ansicht"
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note Form */}
      {showNoteForm && (
        <div className="mb-6 border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-800">
              {editingNote ? 'Notiz bearbeiten' : 'Neue Notiz'}
            </h3>
            <button
              onClick={resetNoteForm}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Schließen"
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          <div className="p-4 space-y-4" style={{ backgroundColor: noteColor }}>
            <input
              type="text"
              placeholder="Titel (optional)"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg font-medium bg-transparent border-none focus:outline-none placeholder-gray-400"
            />
            <textarea
              placeholder="Schreibe deine Notiz..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 text-sm bg-transparent border-none resize-none focus:outline-none placeholder-gray-400"
            />
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Color Picker */}
              <div className="flex items-center gap-1">
                {noteColors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNoteColor(color.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      noteColor === color.value ? 'scale-110 ring-2 ring-offset-1 ring-gray-400' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value, borderColor: color.value === '#ffffff' ? '#e5e7eb' : 'transparent' }}
                    title={color.label}
                  />
                ))}
              </div>

              {/* Pin Toggle */}
              <button
                onClick={() => setNotePinned(!notePinned)}
                className={`p-2 rounded-lg transition-colors ${
                  notePinned ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={notePinned ? 'Nicht mehr anheften' : 'Anheften'}
              >
                <Pin size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetNoteForm}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {editingNote ? 'Speichern' : 'Notiz erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brainstorm Form */}
      {showBrainstormForm && (
        <div className="mb-6 border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb size={20} />
              <h3 className="font-medium">
                {editingSession ? 'Session bearbeiten' : 'Neue Brainstorming-Session'}
              </h3>
            </div>
            <button
              onClick={resetBrainstormForm}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Schließen"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Thema / Fragestellung"
              value={brainstormTopic}
              onChange={(e) => setBrainstormTopic(e.target.value)}
              className="w-full px-4 py-3 text-lg font-medium bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💡 Ideen ({brainstormIdeas.filter(i => i.trim()).length})
              </label>
              
              <div className="space-y-2 mb-3">
                {brainstormIdeas.map((idea, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Sparkles size={14} className="text-yellow-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={idea}
                        onChange={(e) => {
                          const newIdeas = [...brainstormIdeas];
                          newIdeas[index] = e.target.value;
                          setBrainstormIdeas(newIdeas);
                        }}
                        placeholder={`Idee ${index + 1}...`}
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                      />
                    </div>
                    {brainstormIdeas.length > 1 && (
                      <button
                        onClick={() => removeIdea(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Idee entfernen"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setBrainstormIdeas([...brainstormIdeas, ''])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Weitere Idee
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              onClick={resetBrainstormForm}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveBrainstorm}
              disabled={!brainstormTopic.trim() || brainstormIdeas.filter(i => i.trim()).length === 0}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {editingSession ? 'Speichern' : 'Session erstellen'}
            </button>
          </div>
        </div>
      )}

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <>
          {sortedNotes.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <StickyNote size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">Noch keine Notizen</h3>
              <p className="text-sm text-gray-500 mb-4">
                Erstelle deine erste Notiz, um Gedanken festzuhalten.
              </p>
              <button
                onClick={() => setShowNoteForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={16} />
                Erste Notiz erstellen
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {sortedNotes.map(note => (
                <div
                  key={note.id}
                  className="group relative p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer"
                  style={{ 
                    backgroundColor: note.color || '#ffffff',
                    borderColor: note.color === '#ffffff' || !note.color ? '#e5e7eb' : 'transparent'
                  }}
                  onClick={() => handleEditNote(note)}
                >
                  {note.isPinned && (
                    <Pin size={14} className="absolute top-3 right-3 text-amber-500" />
                  )}
                  
                  <h3 className="font-medium text-gray-800 mb-2 line-clamp-1">
                    {note.title || 'Unbenannte Notiz'}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  
                  <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {format(new Date(note.updatedAt || note.createdAt), 'dd.MM.yy', { locale: de })}
                    </span>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); archiveNote(note.id); }}
                        className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                        title="Archivieren"
                      >
                        <Archive size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(note.id); }}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={14} className="text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedNotes.map(note => (
                <div
                  key={note.id}
                  className="group flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleEditNote(note)}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: note.color || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-800 truncate">
                        {note.title || 'Unbenannte Notiz'}
                      </h3>
                      {note.isPinned && <Pin size={12} className="text-amber-500" />}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{note.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {format(new Date(note.updatedAt || note.createdAt), 'dd.MM.yy HH:mm', { locale: de })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* BRAINSTORM TAB */}
      {activeTab === 'brainstorm' && (
        <>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <Brain size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-800 mb-1">Noch keine Brainstorming-Sessions</h3>
              <p className="text-sm text-gray-500 mb-4">
                Starte eine Session, um Ideen zu sammeln.
              </p>
              <button
                onClick={() => setShowBrainstormForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Lightbulb size={16} />
                Erste Session starten
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredSessions.map(session => (
                <div
                  key={session.id}
                  className="group p-5 bg-gradient-to-br from-yellow-50 to-orange-50 border border-orange-200 rounded-xl hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleEditSession(session)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Lightbulb size={18} className="text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{session.title}</h3>
                        <p className="text-xs text-gray-500">
                          {format(new Date(session.createdAt), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(session.id); }}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={14} className="text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {session.ideas.slice(0, 4).map((idea, index) => (
                      <div 
                        key={idea.id || index}
                        className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg text-sm"
                      >
                        <Sparkles size={12} className="text-orange-400 flex-shrink-0" />
                        <span className="text-gray-700 line-clamp-1">{idea.content}</span>
                      </div>
                    ))}
                    {session.ideas.length > 4 && (
                      <p className="text-xs text-orange-600 font-medium pl-2">
                        +{session.ideas.length - 4} weitere Ideen
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-orange-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-orange-600">
                      {session.ideas.length} Ideen
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Aktiv
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={true}
          title="Löschen bestätigen"
          message="Möchtest du diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          confirmText="Löschen"
          onConfirm={() => {
            if (activeTab === 'notes') {
              deleteNote(showDeleteConfirm);
            } else {
              deleteBrainstormSession(showDeleteConfirm);
            }
            setShowDeleteConfirm(null);
          }}
          onClose={() => setShowDeleteConfirm(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
