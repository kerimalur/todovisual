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
    <div className="max-w-6xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #eab308)' }}>
              <StickyNote size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Notizen & Ideen</h1>
              <p className="text-white/50 mt-1">Halte deine Gedanken und Ideen fest</p>
            </div>
          </div>

          <button
            onClick={() => activeTab === 'notes' ? setShowNoteForm(true) : setShowBrainstormForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-sm hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Plus size={16} />
            {activeTab === 'notes' ? 'Neue Notiz' : 'Neue Session'}
          </button>
        </div>
      </div>

      {/* Tabs & Controls */}
      <div className="flex items-center justify-between mb-6">
        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-xl border border-white/08" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'notes'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/08'
            }`}
          >
            <StickyNote size={16} />
            Notizen
            <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'notes' ? 'bg-white/20 text-white' : 'text-white/40'}`} style={activeTab !== 'notes' ? { background: 'rgba(255,255,255,0.08)' } : {}}>
              {notes.filter(n => !n.archivedAt).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('brainstorm')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'brainstorm'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/08'
            }`}
          >
            <Brain size={16} />
            Brainstorming
            <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'brainstorm' ? 'bg-white/20 text-white' : 'text-white/40'}`} style={activeTab !== 'brainstorm' ? { background: 'rgba(255,255,255,0.08)' } : {}}>
              {brainstormSessions.length}
            </span>
          </button>
        </div>

        {/* Search & View Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 rounded-lg border border-white/10 w-64 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />
          </div>

          {activeTab === 'notes' && (
            <div className="flex items-center border border-white/10 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-white/40 hover:bg-white/08 hover:text-white/70'}`}
                title="Raster-Ansicht"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-white/40 hover:bg-white/08 hover:text-white/70'}`}
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
        <div className="mb-6 border border-white/08 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="p-4 border-b border-white/08 flex items-center justify-between">
            <h3 className="font-medium text-white">
              {editingNote ? 'Notiz bearbeiten' : 'Neue Notiz'}
            </h3>
            <button
              onClick={resetNoteForm}
              className="p-1.5 hover:bg-white/08 rounded-lg transition-colors"
              title="Schließen"
            >
              <X size={16} className="text-white/40" />
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

          <div className="p-4 border-t border-white/08 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Color Picker */}
              <div className="flex items-center gap-1">
                {noteColors.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNoteColor(color.value)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      noteColor === color.value ? 'scale-110 ring-2 ring-offset-1 ring-violet-400' : 'hover:scale-105'
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
                  notePinned ? 'text-amber-400' : 'text-white/30 hover:bg-white/08 hover:text-white/60'
                }`}
                style={notePinned ? { background: 'rgba(245,158,11,0.15)' } : {}}
                title={notePinned ? 'Nicht mehr anheften' : 'Anheften'}
              >
                <Pin size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetNoteForm}
                className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/08 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {editingNote ? 'Speichern' : 'Notiz erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Brainstorm Form */}
      {showBrainstormForm && (
        <div className="mb-6 border border-white/08 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="p-4 text-white flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
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
              className="w-full px-4 py-3 text-lg font-medium text-white placeholder:text-white/30 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            />

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                💡 Ideen ({brainstormIdeas.filter(i => i.trim()).length})
              </label>

              <div className="space-y-2 mb-3">
                {brainstormIdeas.map((idea, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/20" style={{ background: 'rgba(245,158,11,0.08)' }}>
                      <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={idea}
                        onChange={(e) => {
                          const newIdeas = [...brainstormIdeas];
                          newIdeas[index] = e.target.value;
                          setBrainstormIdeas(newIdeas);
                        }}
                        placeholder={`Idee ${index + 1}...`}
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm text-white placeholder:text-white/30"
                      />
                    </div>
                    {brainstormIdeas.length > 1 && (
                      <button
                        onClick={() => removeIdea(index)}
                        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              >
                <Plus size={14} />
                Weitere Idee
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-white/08 flex items-center justify-end gap-2">
            <button
              onClick={resetBrainstormForm}
              className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/08 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveBrainstorm}
              disabled={!brainstormTopic.trim() || brainstormIdeas.filter(i => i.trim()).length === 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
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
            <div className="text-center py-16 border border-dashed border-white/10 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <StickyNote size={48} className="mx-auto text-white/20 mb-3" />
              <h3 className="text-lg font-medium text-white/70 mb-1">Noch keine Notizen</h3>
              <p className="text-sm text-white/40 mb-4">
                Erstelle deine erste Notiz, um Gedanken festzuhalten.
              </p>
              <button
                onClick={() => setShowNoteForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
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
                  className="group relative p-4 rounded-xl border hover:shadow-lg transition-all cursor-pointer"
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
                  className="group flex items-start gap-4 p-4 border border-white/08 rounded-xl hover:bg-white/[0.02] transition-all cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                  onClick={() => handleEditNote(note)}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                    style={{ backgroundColor: note.color || '#7c3aed' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate">
                        {note.title || 'Unbenannte Notiz'}
                      </h3>
                      {note.isPinned && <Pin size={12} className="text-amber-400" />}
                    </div>
                    <p className="text-sm text-white/50 line-clamp-1">{note.content}</p>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0">
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
            <div className="text-center py-16 border border-dashed border-white/10 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Brain size={48} className="mx-auto text-white/20 mb-3" />
              <h3 className="text-lg font-medium text-white/70 mb-1">Noch keine Brainstorming-Sessions</h3>
              <p className="text-sm text-white/40 mb-4">
                Starte eine Session, um Ideen zu sammeln.
              </p>
              <button
                onClick={() => setShowBrainstormForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
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
                  className="group p-5 border border-amber-500/20 rounded-xl hover:shadow-lg transition-all cursor-pointer"
                  style={{ background: 'rgba(245,158,11,0.06)' }}
                  onClick={() => handleEditSession(session)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)' }}>
                        <Lightbulb size={18} className="text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{session.title}</h3>
                        <p className="text-xs text-white/40">
                          {format(new Date(session.createdAt), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(session.id); }}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={14} className="text-white/30 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {session.ideas.slice(0, 4).map((idea, index) => (
                      <div
                        key={idea.id || index}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <Sparkles size={12} className="text-amber-400 flex-shrink-0" />
                        <span className="text-white/70 line-clamp-1">{idea.content}</span>
                      </div>
                    ))}
                    {session.ideas.length > 4 && (
                      <p className="text-xs text-amber-400 font-medium pl-2">
                        +{session.ideas.length - 4} weitere Ideen
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-400">
                      {session.ideas.length} Ideen
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-green-400" style={{ background: 'rgba(34,197,94,0.12)' }}>
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
