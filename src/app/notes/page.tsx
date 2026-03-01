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

  const handleConfirmDelete = () => {
    const targetId = showDeleteConfirm;
    const targetTab = activeTab;
    if (!targetId) return;

    setShowDeleteConfirm(null);

    void (async () => {
      try {
        if (targetTab === 'notes') {
          await deleteNote(targetId);
        } else {
          await deleteBrainstormSession(targetId);
        }
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Löschen fehlgeschlagen. Bitte erneut versuchen.');
      }
    })();
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notizen & Ideen</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {notes.filter(n => !n.archivedAt).length} Notizen · {brainstormSessions.length} Brainstorm-Sessions
          </p>
        </div>
        <button
          onClick={() => activeTab === 'notes' ? setShowNoteForm(true) : setShowBrainstormForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
        >
          <Plus size={16} />
          {activeTab === 'notes' ? 'Neue Notiz' : 'Neue Session'}
        </button>
      </div>

      {/* Tabs & Controls */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        {/* Pill Tabs */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('notes')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <StickyNote size={15} />
            Notizen
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
              activeTab === 'notes' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {notes.filter(n => !n.archivedAt).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('brainstorm')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === 'brainstorm'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Brain size={15} />
            Brainstorming
            <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
              activeTab === 'brainstorm' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {brainstormSessions.length}
            </span>
          </button>
        </div>

        {/* Search & View Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all w-56">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          {activeTab === 'notes' && (
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
                title="Raster"
              >
                <Grid3X3 size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors border-l border-gray-200 ${viewMode === 'list' ? 'bg-gray-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
                title="Liste"
              >
                <List size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note Form */}
      {showNoteForm && (
        <div className="mb-6 border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm animate-fade-in-up">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <StickyNote size={14} className="text-indigo-500" />
              {editingNote ? 'Notiz bearbeiten' : 'Neue Notiz'}
            </h3>
            <button onClick={resetNoteForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={15} className="text-gray-400" />
            </button>
          </div>

          <div className="p-5 space-y-3" style={{ backgroundColor: noteColor }}>
            <input
              type="text"
              placeholder="Titel (optional)"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full px-3 py-2 text-lg font-semibold bg-transparent border-none focus:outline-none placeholder-gray-400"
            />
            <textarea
              placeholder="Schreibe deine Notiz..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm bg-transparent border-none resize-none focus:outline-none placeholder-gray-400 leading-relaxed"
            />
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {noteColors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNoteColor(color.value)}
                    className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${
                      noteColor === color.value ? 'scale-110 ring-2 ring-offset-1 ring-indigo-400' : ''
                    }`}
                    style={{ backgroundColor: color.value, borderColor: color.value === '#ffffff' ? '#d1d5db' : 'transparent' }}
                    title={color.label}
                  />
                ))}
              </div>
              <button
                onClick={() => setNotePinned(!notePinned)}
                className={`p-1.5 rounded-lg transition-colors ${notePinned ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-gray-100'}`}
                title={notePinned ? 'Nicht mehr anheften' : 'Anheften'}
              >
                <Pin size={15} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={resetNoteForm} className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                Abbrechen
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {editingNote ? 'Speichern' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brainstorm Form */}
      {showBrainstormForm && (
        <div className="mb-6 border border-orange-200 rounded-2xl bg-white overflow-hidden shadow-sm animate-fade-in-up">
          <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Lightbulb size={16} />
              </div>
              <h3 className="font-semibold">{editingSession ? 'Session bearbeiten' : 'Neue Brainstorming-Session'}</h3>
            </div>
            <button onClick={resetBrainstormForm} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <input
              type="text"
              placeholder="Thema / Fragestellung"
              value={brainstormTopic}
              onChange={(e) => setBrainstormTopic(e.target.value)}
              className="w-full px-4 py-3 text-base font-semibold bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 placeholder-amber-400"
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Ideen · {brainstormIdeas.filter(i => i.trim()).length}
              </label>
              <div className="space-y-2 mb-3">
                {brainstormIdeas.map((idea, index) => (
                  <div key={index} className="flex items-center gap-2 animate-fade-in">
                    <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                      <Sparkles size={13} className="text-amber-500 flex-shrink-0" />
                      <input
                        type="text"
                        value={idea}
                        onChange={(e) => {
                          const newIdeas = [...brainstormIdeas];
                          newIdeas[index] = e.target.value;
                          setBrainstormIdeas(newIdeas);
                        }}
                        placeholder={`Idee ${index + 1}...`}
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-800 placeholder-amber-400"
                      />
                    </div>
                    {brainstormIdeas.length > 1 && (
                      <button
                        onClick={() => removeIdea(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setBrainstormIdeas([...brainstormIdeas, ''])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
              >
                <Plus size={13} />
                Weitere Idee
              </button>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2">
            <button onClick={resetBrainstormForm} className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              Abbrechen
            </button>
            <button
              onClick={handleSaveBrainstorm}
              disabled={!brainstormTopic.trim() || brainstormIdeas.filter(i => i.trim()).length === 0}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-xl transition-colors"
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
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-white animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                <StickyNote size={26} className="text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Noch keine Notizen</h3>
              <p className="text-sm text-gray-500 mb-4">Erstelle deine erste Notiz, um Gedanken festzuhalten.</p>
              <button
                onClick={() => setShowNoteForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Plus size={15} />
                Erste Notiz erstellen
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedNotes.map((note, idx) => (
                <div
                  key={note.id}
                  className="group relative p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 animate-fade-in-up"
                  style={{
                    backgroundColor: note.color || '#ffffff',
                    borderColor: note.color === '#ffffff' || !note.color ? '#e5e7eb' : 'transparent',
                    animationDelay: `${idx * 40}ms`,
                  }}
                  onClick={() => handleEditNote(note)}
                >
                  {note.isPinned && (
                    <Pin size={13} className="absolute top-3.5 right-3.5 text-amber-500" />
                  )}
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1 pr-4">
                    {note.title || 'Unbenannte Notiz'}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                  <div className="mt-3 pt-3 border-t border-black/[0.07] flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 font-medium">
                      {format(new Date(note.updatedAt || note.createdAt), 'dd.MM.yy', { locale: de })}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); archiveNote(note.id); }}
                        className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                        title="Archivieren"
                      >
                        <Archive size={13} className="text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(note.id); }}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={13} className="text-gray-500 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50 overflow-hidden">
              {sortedNotes.map((note, idx) => (
                <div
                  key={note.id}
                  className="group flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => handleEditNote(note)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: note.color === '#ffffff' || !note.color ? '#6366f1' : note.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {note.title || 'Unbenannte Notiz'}
                      </p>
                      {note.isPinned && <Pin size={11} className="text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{note.content}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium flex-shrink-0">
                    {format(new Date(note.updatedAt || note.createdAt), 'dd.MM.yy HH:mm', { locale: de })}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); archiveNote(note.id); }} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors" title="Archivieren">
                      <Archive size={13} className="text-gray-400" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(note.id); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Löschen">
                      <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
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
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-orange-200 rounded-2xl bg-amber-50/30 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
                <Brain size={26} className="text-orange-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Noch keine Sessions</h3>
              <p className="text-sm text-gray-500 mb-4">Starte eine Session, um Ideen zu sammeln.</p>
              <button
                onClick={() => setShowBrainstormForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Lightbulb size={15} />
                Erste Session starten
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredSessions.map((session, idx) => (
                <div
                  key={session.id}
                  className="group p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => handleEditSession(session)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Lightbulb size={18} className="text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 leading-snug">{session.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(session.createdAt), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(session.id); }}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Löschen"
                    >
                      <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {session.ideas.slice(0, 4).map((idea, index) => (
                      <div
                        key={idea.id || index}
                        className="flex items-center gap-2 px-3 py-2 bg-white/70 border border-orange-100 rounded-xl text-sm"
                      >
                        <Sparkles size={11} className="text-orange-400 flex-shrink-0" />
                        <span className="text-gray-700 line-clamp-1">{idea.content}</span>
                      </div>
                    ))}
                    {session.ideas.length > 4 && (
                      <p className="text-xs text-orange-600 font-semibold pl-3">
                        +{session.ideas.length - 4} weitere Ideen
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-lg">
                      <Sparkles size={10} />
                      {session.ideas.length} Ideen
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
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
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteConfirm(null)}
          variant="danger"
        />
      )}
    </div>
  );
}
