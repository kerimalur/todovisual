'use client';

import { 
  User, Bell, Timer, Database, Download, Palette, Globe, Trash2, Check, 
  Clock, Volume2, ListTodo, Shield, Sparkles, Coffee,
  Upload, Smartphone, Send, PlusCircle
} from 'lucide-react';
import { useSettingsStore, useDataStore } from '@/store';
import { useState } from 'react';
import { WhatsAppCustomRule, WhatsAppCustomRuleTrigger } from '@/types';

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-11 h-6 rounded-full relative transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
      title={label}
    >
      <span 
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'right-1' : 'left-1'}`} 
      />
    </button>
  );
}

function SettingRow({ children, label, description }: { children: React.ReactNode; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
        <Icon size={18} className="text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5 divide-y divide-gray-100">
        {children}
      </div>
    </section>
  );
}

const CUSTOM_RULE_TRIGGERS: Array<{ value: WhatsAppCustomRuleTrigger; label: string; description: string }> = [
  {
    value: 'task-created',
    label: 'Neue Aufgabe',
    description: 'Wird nach dem Erstellen einer Aufgabe ausgelöst.',
  },
  {
    value: 'task-completed',
    label: 'Aufgabe erledigt',
    description: 'Wird ausgelöst, wenn du eine Aufgabe als erledigt markierst.',
  },
  {
    value: 'event-attended',
    label: 'Termin anwesend',
    description: 'Wird ausgelöst, wenn ein Termin als anwesend markiert wird.',
  },
];

const DEFAULT_CUSTOM_RULE_TEMPLATES: Record<WhatsAppCustomRuleTrigger, string> = {
  'task-created':
    'Custom Regel: Neue Aufgabe "{taskTitle}" geplant für {startAt}.',
  'task-completed':
    'Custom Regel: "{taskTitle}" wurde erledigt ({completedAt}).',
  'event-attended':
    'Custom Regel: Anwesenheit bei "{eventTitle}" bestätigt ({eventDate}, {eventStart}-{eventEnd}).',
};

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { goals, projects, tasks, events, journalEntries, focusSessions } = useDataStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState('');
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'focus' | 'appearance' | 'data'>('general');

  const showSavedFeedback = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSettings({ [key]: value });
    showSavedFeedback();
  };

  const handleAddWhatsAppRule = () => {
    const trigger: WhatsAppCustomRuleTrigger = 'task-created';
    const newRule: WhatsAppCustomRule = {
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `rule-${Date.now()}`,
      name: `Neue Regel ${settings.whatsappCustomRules.length + 1}`,
      enabled: true,
      trigger,
      template: DEFAULT_CUSTOM_RULE_TEMPLATES[trigger],
    };
    handleChange('whatsappCustomRules', [...settings.whatsappCustomRules, newRule]);
  };

  const handleUpdateWhatsAppRule = (
    ruleId: string,
    updates: Partial<Pick<WhatsAppCustomRule, 'name' | 'enabled' | 'trigger' | 'template'>>
  ) => {
    const nextRules = settings.whatsappCustomRules.map((rule) =>
      rule.id === ruleId
        ? {
            ...rule,
            ...updates,
          }
        : rule
    );
    handleChange('whatsappCustomRules', nextRules);
  };

  const handleDeleteWhatsAppRule = (ruleId: string) => {
    const nextRules = settings.whatsappCustomRules.filter((rule) => rule.id !== ruleId);
    handleChange('whatsappCustomRules', nextRules);
  };

  const handleExportData = () => {
    const data = {
      goals,
      projects,
      tasks,
      events,
      journalEntries,
      focusSessions,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleSendTestSms = async () => {
    const phoneNumber = settings.smsPhoneNumber.trim();
    if (!phoneNumber) {
      setSmsStatus('Bitte zuerst eine Mobilnummer eintragen.');
      return;
    }

    setSmsSending(true);
    setSmsStatus('');
    try {
      const response = await fetch('/api/reminders/sms/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          reminderTime: settings.reminderTime,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'SMS Test fehlgeschlagen.');
      }

      setSmsStatus('Test-SMS wurde erfolgreich versendet.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SMS Test fehlgeschlagen.';
      setSmsStatus(message);
    } finally {
      setSmsSending(false);
    }
  };

  const handleSendTestWhatsApp = async () => {
    const phoneNumber = settings.whatsappPhoneNumber.trim();
    if (!phoneNumber) {
      setWhatsappStatus('Bitte zuerst eine WhatsApp-Nummer eintragen.');
      return;
    }

    setWhatsappSending(true);
    setWhatsappStatus('');
    try {
      const response = await fetch('/api/reminders/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'WhatsApp Test fehlgeschlagen.');
      }

      setWhatsappStatus('Test-WhatsApp wurde erfolgreich versendet.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'WhatsApp Test fehlgeschlagen.';
      setWhatsappStatus(message);
    } finally {
      setWhatsappSending(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Allgemein', icon: User },
    { id: 'focus', label: 'Fokus & Timer', icon: Timer },
    { id: 'appearance', label: 'Darstellung', icon: Palette },
    { id: 'data', label: 'Daten', icon: Database },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Einstellungen</h1>
            <p className="text-gray-500 mt-1">Passe die App an deine Bedürfnisse an</p>
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-fadeIn">
              <Check size={16} />
              Gespeichert
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                border-b-2 -mb-px
                ${activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <>
            {/* Profile */}
            <Section title="Profil" icon={User}>
              <div className="py-3">
                <label className="block text-xs font-medium text-[#9b9a97] mb-2">Dein Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Wie heißt du?"
                  className="input w-full max-w-sm"
                />
                <p className="text-xs text-[#9b9a97] mt-1">Wird auf dem Dashboard und im Zen Modus angezeigt</p>
              </div>
              <div className="py-3">
                <label className="block text-xs font-medium text-[#9b9a97] mb-2">E-Mail (optional)</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="deine@email.de"
                  className="input w-full max-w-sm"
                />
              </div>
              <div className="py-3">
                <label className="block text-xs font-medium text-[#9b9a97] mb-2">Persoenliches Motto</label>
                <input
                  type="text"
                  value={settings.personalMotto}
                  onChange={(e) => handleChange('personalMotto', e.target.value)}
                  placeholder="Was soll dich taeglich erinnern?"
                  className="input w-full max-w-xl"
                />
                <p className="text-xs text-[#9b9a97] mt-1">Wird auf dem Cockpit und im Zen Modus angezeigt</p>
              </div>
            </Section>

            {/* Personalization */}
            <Section title="Persoenliche Experience" icon={Sparkles}>
              <SettingRow label="Begruessungsstil" description="Wie dich Dashboard und Zen Modus ansprechen">
                <select
                  value={settings.greetingStyle}
                  onChange={(e) =>
                    handleChange('greetingStyle', e.target.value as 'classic' | 'direct' | 'motivational')
                  }
                  className="select"
                  title="Begruessungsstil"
                >
                  <option value="classic">Klassisch</option>
                  <option value="direct">Direkt</option>
                  <option value="motivational">Motivierend</option>
                </select>
              </SettingRow>
              <SettingRow label="Tagesziel (Aufgaben)" description="Wird als Ziel-Fortschritt auf dem Cockpit gezeigt">
                <input
                  type="number"
                  value={settings.dailyTaskGoal}
                  onChange={(e) =>
                    handleChange('dailyTaskGoal', Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1)))
                  }
                  min={1}
                  max={30}
                  className="input w-20"
                />
              </SettingRow>
              <SettingRow label="Dashboard Dichte" description="Mehr Infos oder mehr Ruhe auf dem Cockpit">
                <select
                  value={settings.dashboardDensity}
                  onChange={(e) =>
                    handleChange('dashboardDensity', e.target.value as 'comfortable' | 'compact')
                  }
                  className="select"
                  title="Dashboard Dichte"
                >
                  <option value="comfortable">Komfortabel</option>
                  <option value="compact">Kompakt</option>
                </select>
              </SettingRow>
            </Section>

            {/* Language */}
            <Section title="Sprache & Region" icon={Globe}>
              <SettingRow label="Sprache" description="Anzeigesprache der App">
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value as 'de' | 'en')}
                  className="select"
                  title="Sprache"
                >
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </SettingRow>
              <SettingRow label="Woche beginnt am Montag">
                <Toggle
                  enabled={settings.weekStartsOnMonday}
                  onChange={(v) => handleChange('weekStartsOnMonday', v)}
                  label="Wochenstart"
                />
              </SettingRow>
            </Section>

            {/* Notifications */}
            <Section title="Benachrichtigungen" icon={Bell}>
              <SettingRow label="Motivations-Nachrichten" description="Nach Aufgaben und Fokus-Sessions">
                <Toggle
                  enabled={settings.motivationToastsEnabled}
                  onChange={(v) => handleChange('motivationToastsEnabled', v)}
                  label="Motivation"
                />
              </SettingRow>
              <SettingRow label="Tägliche Erinnerung" description="Erinnere mich an offene Aufgaben">
                <Toggle
                  enabled={settings.dailyReminderEnabled}
                  onChange={(v) => handleChange('dailyReminderEnabled', v)}
                  label="Erinnerung"
                />
              </SettingRow>
              {settings.dailyReminderEnabled && (
                <SettingRow label="Erinnerungszeit">
                  <input
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => handleChange('reminderTime', e.target.value)}
                    className="input w-28"
                  />
                </SettingRow>
              )}

              <div className="py-4 space-y-3">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-indigo-100 flex items-center justify-center">
                      <Smartphone size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">SMS Erinnerungen</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Versand via Twilio (ENV: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`).
                      </p>
                    </div>
                  </div>

                  <SettingRow label="SMS aktivieren" description="Ergaenzt die taegliche Erinnerung per SMS">
                    <Toggle
                      enabled={settings.smsRemindersEnabled}
                      onChange={(v) => handleChange('smsRemindersEnabled', v)}
                      label="SMS aktivieren"
                    />
                  </SettingRow>

                  {settings.smsRemindersEnabled && (
                    <>
                      <SettingRow label="Mobilnummer" description="Format: +491234567890">
                        <input
                          type="tel"
                          value={settings.smsPhoneNumber}
                          onChange={(e) => handleChange('smsPhoneNumber', e.target.value)}
                          placeholder="+491234567890"
                          className="input w-52"
                        />
                      </SettingRow>

                      <SettingRow label="Vorlaufzeit (Min)" description="Wie viele Minuten vor dem Termin erinnert wird">
                        <input
                          type="number"
                          value={settings.smsLeadMinutes}
                          onChange={(e) => handleChange('smsLeadMinutes', parseInt(e.target.value, 10) || 0)}
                          min={0}
                          max={240}
                          className="input w-20"
                        />
                      </SettingRow>

                      <div className="pt-3">
                        <button
                          onClick={() => void handleSendTestSms()}
                          disabled={smsSending}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={14} />
                          {smsSending ? 'Sende Test...' : 'Test SMS senden'}
                        </button>
                        {smsStatus && <p className="text-xs text-gray-600 mt-2">{smsStatus}</p>}
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center">
                      <Smartphone size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">WhatsApp Erinnerungen</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        ENV fuer Sender: `TWILIO_WHATSAPP_FROM` (z.B. `whatsapp:+14155238886`).
                      </p>
                    </div>
                  </div>

                  <SettingRow label="WhatsApp aktivieren" description="Aktiviert alle WhatsApp-Benachrichtigungen">
                    <Toggle
                      enabled={settings.whatsappRemindersEnabled}
                      onChange={(v) => handleChange('whatsappRemindersEnabled', v)}
                      label="WhatsApp aktivieren"
                    />
                  </SettingRow>

                  {settings.whatsappRemindersEnabled && (
                    <>
                      <SettingRow label="WhatsApp Nummer" description="Format: +491234567890">
                        <input
                          type="tel"
                          value={settings.whatsappPhoneNumber}
                          onChange={(e) => handleChange('whatsappPhoneNumber', e.target.value)}
                          placeholder="+491234567890"
                          className="input w-full max-w-xs"
                        />
                      </SettingRow>

                      <SettingRow
                        label="Bei neuer Aufgabe erinnern"
                        description="Sofort nach dem Erstellen einer Aufgabe"
                      >
                        <Toggle
                          enabled={settings.whatsappTaskCreatedEnabled}
                          onChange={(v) => handleChange('whatsappTaskCreatedEnabled', v)}
                          label="Neue Aufgabe"
                        />
                      </SettingRow>
                      <SettingRow
                        label="Text: Neue Aufgabe"
                        description="Platzhalter: {taskTitle}, {startAt}, {project}, {priority}"
                      >
                        <textarea
                          value={settings.whatsappTaskCreatedTemplate}
                          onChange={(e) => handleChange('whatsappTaskCreatedTemplate', e.target.value)}
                          rows={4}
                          className="input w-full md:w-96 resize-y"
                        />
                      </SettingRow>

                      <SettingRow
                        label="Bei erledigter Aufgabe erinnern"
                        description="Sofort wenn eine Aufgabe als erledigt markiert wird"
                      >
                        <Toggle
                          enabled={settings.whatsappTaskCompletedEnabled}
                          onChange={(v) => handleChange('whatsappTaskCompletedEnabled', v)}
                          label="Aufgabe erledigt"
                        />
                      </SettingRow>
                      <SettingRow
                        label="Text: Aufgabe erledigt"
                        description="Platzhalter: {taskTitle}, {completedAt}, {project}, {priority}"
                      >
                        <textarea
                          value={settings.whatsappTaskCompletedTemplate}
                          onChange={(e) => handleChange('whatsappTaskCompletedTemplate', e.target.value)}
                          rows={4}
                          className="input w-full md:w-96 resize-y"
                        />
                      </SettingRow>

                      <SettingRow
                        label="1h vor Start erinnern"
                        description="Serverseitig 1 Stunde vor Startzeit"
                      >
                        <Toggle
                          enabled={settings.whatsappTaskStartReminderEnabled}
                          onChange={(v) => handleChange('whatsappTaskStartReminderEnabled', v)}
                          label="1h Start-Reminder"
                        />
                      </SettingRow>
                      <SettingRow
                        label="Text: 1h vor Start"
                        description="Platzhalter: {taskTitle}, {startAt}, {project}, {priority}"
                      >
                        <textarea
                          value={settings.whatsappTaskStartTemplate}
                          onChange={(e) => handleChange('whatsappTaskStartTemplate', e.target.value)}
                          rows={4}
                          className="input w-full md:w-96 resize-y"
                        />
                      </SettingRow>

                      <SettingRow
                        label="Wochenrueckblick Sonntags"
                        description="Rueckblick + Vorschau fuer Ziele"
                      >
                        <Toggle
                          enabled={settings.whatsappWeeklyReviewEnabled}
                          onChange={(v) => handleChange('whatsappWeeklyReviewEnabled', v)}
                          label="Wochenrueckblick"
                        />
                      </SettingRow>
                      {settings.whatsappWeeklyReviewEnabled && (
                        <SettingRow label="Zeit am Sonntag">
                          <input
                            type="time"
                            value={settings.whatsappWeeklyReviewTime}
                            onChange={(e) => handleChange('whatsappWeeklyReviewTime', e.target.value)}
                            className="input w-28"
                          />
                        </SettingRow>
                      )}
                      <SettingRow
                        label="Text: Wochenrueckblick"
                        description="Platzhalter: {weekRange}, {review}"
                      >
                        <textarea
                          value={settings.whatsappWeeklyReviewTemplate}
                          onChange={(e) => handleChange('whatsappWeeklyReviewTemplate', e.target.value)}
                          rows={5}
                          className="input w-full md:w-96 resize-y"
                        />
                      </SettingRow>

                      <SettingRow
                        label="Bei Termin-Anwesenheit erinnern"
                        description="Wenn ein Termin als anwesend markiert wird"
                      >
                        <Toggle
                          enabled={settings.whatsappEventAttendedEnabled}
                          onChange={(v) => handleChange('whatsappEventAttendedEnabled', v)}
                          label="Termin anwesend"
                        />
                      </SettingRow>
                      <SettingRow
                        label="Text: Termin anwesend"
                        description="Platzhalter: {eventTitle}, {eventDate}, {eventStart}, {eventEnd}"
                      >
                        <textarea
                          value={settings.whatsappEventAttendedTemplate}
                          onChange={(e) => handleChange('whatsappEventAttendedTemplate', e.target.value)}
                          rows={4}
                          className="input w-full md:w-96 resize-y"
                        />
                      </SettingRow>

                      <div className="mt-5 rounded-2xl border-2 border-emerald-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-sm font-semibold text-emerald-800">Große Option: Eigene WhatsApp-Regeln</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Erstelle beliebig viele eigene Nachrichten-Regeln direkt in der Software.
                            </p>
                          </div>
                          <button
                            onClick={handleAddWhatsAppRule}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <PlusCircle size={14} />
                            Regel hinzufügen
                          </button>
                        </div>

                        {settings.whatsappCustomRules.length === 0 ? (
                          <p className="text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg p-3">
                            Noch keine eigenen Regeln vorhanden.
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                            {settings.whatsappCustomRules.map((rule) => (
                              <div key={rule.id} className="rounded-xl border border-gray-200 p-3 bg-gray-50/50">
                                <div className="flex flex-wrap items-center gap-2">
                                  <input
                                    value={rule.name}
                                    onChange={(e) => handleUpdateWhatsAppRule(rule.id, { name: e.target.value })}
                                    placeholder="Name der Regel"
                                    className="input flex-1 min-w-[170px]"
                                  />
                                  <select
                                    value={rule.trigger}
                                    onChange={(e) => {
                                      const trigger = e.target.value as WhatsAppCustomRuleTrigger;
                                      handleUpdateWhatsAppRule(rule.id, {
                                        trigger,
                                        template: rule.template || DEFAULT_CUSTOM_RULE_TEMPLATES[trigger],
                                      });
                                    }}
                                    className="select min-w-[165px]"
                                    title="Trigger"
                                  >
                                    {CUSTOM_RULE_TRIGGERS.map((triggerOption) => (
                                      <option key={triggerOption.value} value={triggerOption.value}>
                                        {triggerOption.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Toggle
                                    enabled={rule.enabled}
                                    onChange={(enabled) => handleUpdateWhatsAppRule(rule.id, { enabled })}
                                    label="Regel aktiv"
                                  />
                                  <button
                                    onClick={() => handleDeleteWhatsAppRule(rule.id)}
                                    className="px-2 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50"
                                  >
                                    Entfernen
                                  </button>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-2">
                                  {CUSTOM_RULE_TRIGGERS.find((option) => option.value === rule.trigger)?.description}
                                </p>
                                <textarea
                                  value={rule.template}
                                  onChange={(e) => handleUpdateWhatsAppRule(rule.id, { template: e.target.value })}
                                  rows={4}
                                  className="input w-full mt-2 resize-y"
                                  placeholder="Eigene WhatsApp-Nachricht"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={() => void handleSendTestWhatsApp()}
                          disabled={whatsappSending}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={14} />
                          {whatsappSending ? 'Sende Test...' : 'Test WhatsApp senden'}
                        </button>
                        {whatsappStatus && <p className="text-xs text-gray-600 mt-2">{whatsappStatus}</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Section>
          </>
        )}

        {/* FOCUS TAB */}
        {activeTab === 'focus' && (
          <>
            {/* Timer Settings */}
            <Section title="Timer Einstellungen" icon={Clock}>
              <div className="py-3 grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#9b9a97] mb-2">Fokus-Zeit (Min)</label>
                  <input
                    type="number"
                    value={settings.defaultFocusMinutes}
                    onChange={(e) => handleChange('defaultFocusMinutes', parseInt(e.target.value) || 25)}
                    min={5}
                    max={120}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9b9a97] mb-2">Kurze Pause (Min)</label>
                  <input
                    type="number"
                    value={settings.defaultBreakMinutes}
                    onChange={(e) => handleChange('defaultBreakMinutes', parseInt(e.target.value) || 5)}
                    min={1}
                    max={30}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9b9a97] mb-2">Lange Pause (Min)</label>
                  <input
                    type="number"
                    value={settings.longBreakMinutes}
                    onChange={(e) => handleChange('longBreakMinutes', parseInt(e.target.value) || 15)}
                    min={5}
                    max={60}
                    className="input w-full"
                  />
                </div>
              </div>
              <SettingRow label="Sessions bis lange Pause" description="Anzahl der Fokus-Sessions">
                <input
                  type="number"
                  value={settings.sessionsUntilLongBreak}
                  onChange={(e) => handleChange('sessionsUntilLongBreak', parseInt(e.target.value) || 4)}
                  min={2}
                  max={10}
                  className="input w-16"
                />
              </SettingRow>
            </Section>

            {/* Audio */}
            <Section title="Audio" icon={Volume2}>
              <SettingRow label="Sound bei Timer-Ende" description="Spielt einen Ton ab">
                <Toggle
                  enabled={settings.soundEnabled}
                  onChange={(v) => handleChange('soundEnabled', v)}
                  label="Sound"
                />
              </SettingRow>
              {settings.soundEnabled && (
                <SettingRow label="Lautstärke">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      value={settings.soundVolume}
                      onChange={(e) => handleChange('soundVolume', parseInt(e.target.value))}
                      min={0}
                      max={100}
                      className="w-24"
                    />
                    <span className="text-xs text-[#6b6b6b] w-8">{settings.soundVolume}%</span>
                  </div>
                </SettingRow>
              )}
            </Section>

            {/* Automation */}
            <Section title="Automatisierung" icon={Sparkles}>
              <SettingRow label="Pausen automatisch starten" description="Nach jeder Fokus-Session">
                <Toggle
                  enabled={settings.autoStartBreaks}
                  onChange={(v) => handleChange('autoStartBreaks', v)}
                  label="Auto-Pause"
                />
              </SettingRow>
              <SettingRow label="Fokus automatisch starten" description="Nach jeder Pause">
                <Toggle
                  enabled={settings.autoStartFocus}
                  onChange={(v) => handleChange('autoStartFocus', v)}
                  label="Auto-Fokus"
                />
              </SettingRow>
            </Section>
          </>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <>
            {/* Theme */}
            <Section title="Design" icon={Palette}>
              <SettingRow label="Farbschema" description="Aktuell ist nur heller Modus aktiv">
                <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900">
                  Hell
                </div>
              </SettingRow>
              <SettingRow label="Akzentfarbe">
                <div className="flex gap-2">
                  {['#2383e2', '#0f7b6c', '#9065e0', '#d44c47', '#cb912f', '#448361'].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleChange('accentColor', color)}
                      className={`w-6 h-6 rounded-full transition-transform ${settings.accentColor === color ? 'ring-2 ring-offset-2 ring-[#37352f] scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                      title={`Farbe ${color}`}
                    />
                  ))}
                </div>
              </SettingRow>
              <SettingRow label="Kompakte Ansicht" description="Weniger Abstände, mehr Inhalt">
                <Toggle
                  enabled={settings.compactMode}
                  onChange={(v) => handleChange('compactMode', v)}
                  label="Kompakt"
                />
              </SettingRow>
            </Section>

            {/* Zen Mode */}
            <Section title="Zen Modus" icon={Coffee}>
              <SettingRow label="Uhr anzeigen" description="Große Uhranzeige im Zen Modus">
                <Toggle
                  enabled={settings.zenShowClock}
                  onChange={(v) => handleChange('zenShowClock', v)}
                  label="Uhr"
                />
              </SettingRow>
              <SettingRow label="Statistiken anzeigen" description="Erledigte Aufgaben heute">
                <Toggle
                  enabled={settings.zenShowStats}
                  onChange={(v) => handleChange('zenShowStats', v)}
                  label="Stats"
                />
              </SettingRow>
              <SettingRow label="Zitate anzeigen" description="Motivierende Zitate unten">
                <Toggle
                  enabled={settings.zenShowQuotes}
                  onChange={(v) => handleChange('zenShowQuotes', v)}
                  label="Zitate"
                />
              </SettingRow>
              <SettingRow label="Hintergrund-Stil">
                <select
                  value={settings.zenBackgroundStyle}
                  onChange={(e) => handleChange('zenBackgroundStyle', e.target.value as 'solid' | 'gradient' | 'animated')}
                  className="select"
                  title="Hintergrund"
                >
                  <option value="solid">Einfarbig</option>
                  <option value="gradient">Farbverlauf</option>
                  <option value="animated">Animiert</option>
                </select>
              </SettingRow>
            </Section>

            {/* Tasks */}
            <Section title="Aufgaben" icon={ListTodo}>
              <SettingRow label="Standard-Priorität" description="Für neue Aufgaben">
                <select
                  value={settings.defaultTaskPriority}
                  onChange={(e) => handleChange('defaultTaskPriority', e.target.value as 'low' | 'medium' | 'high')}
                  className="select"
                  title="Priorität"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </SettingRow>
              <SettingRow label="Erledigte Aufgaben anzeigen">
                <Toggle
                  enabled={settings.showCompletedTasks}
                  onChange={(v) => handleChange('showCompletedTasks', v)}
                  label="Erledigte anzeigen"
                />
              </SettingRow>
              <SettingRow label="Beschreibungen anzeigen" description="In Aufgabenlisten">
                <Toggle
                  enabled={settings.showTaskDescriptions}
                  onChange={(v) => handleChange('showTaskDescriptions', v)}
                  label="Beschreibungen"
                />
              </SettingRow>
            </Section>
            {/* Quick Capture */}
            <Section title="Quick Capture" icon={PlusCircle}>
              <SettingRow
                label="Platzhalter im Schnellfeld"
                description="Text im FAB-Schnellerfassen Feld"
              >
                <input
                  type="text"
                  value={settings.quickCapturePlaceholder}
                  onChange={(e) => handleChange('quickCapturePlaceholder', e.target.value)}
                  className="input w-full max-w-sm"
                  placeholder="Aufgabe schnell notieren..."
                />
              </SettingRow>
              <SettingRow label="Standard Prioritaet" description="Fuer neue Quick-Capture Aufgaben">
                <select
                  value={settings.quickCaptureDefaultPriority}
                  onChange={(e) =>
                    handleChange(
                      'quickCaptureDefaultPriority',
                      e.target.value as 'low' | 'medium' | 'high' | 'urgent'
                    )
                  }
                  className="select"
                  title="Quick-Capture Prioritaet"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend</option>
                </select>
              </SettingRow>
              <SettingRow label="Standard Tag" description="Wird bei Quick Capture automatisch angehaengt">
                <input
                  type="text"
                  value={settings.quickCaptureDefaultTag}
                  onChange={(e) => handleChange('quickCaptureDefaultTag', e.target.value)}
                  className="input w-56"
                  placeholder="quick-capture"
                />
              </SettingRow>
            </Section>
          </>
        )}

        {/* DATA TAB */}
        {activeTab === 'data' && (
          <>
            {/* Statistics */}
            <Section title="Deine Daten" icon={Database}>
              <div className="py-3 grid grid-cols-5 gap-3">
                {[
                  { label: 'Aufgaben', value: tasks.length },
                  { label: 'Ziele', value: goals.length },
                  { label: 'Projekte', value: projects.length },
                  { label: 'Termine', value: events.length },
                  { label: 'Journal', value: journalEntries.length },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 bg-[#f7f6f3] rounded-md text-center">
                    <p className="text-xl font-semibold text-[#37352f]">{stat.value}</p>
                    <p className="text-[10px] text-[#9b9a97]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Backup */}
            <Section title="Backup & Wiederherstellung" icon={Shield}>
              <SettingRow label="Automatisches Backup" description="Regelmäßige Sicherung">
                <Toggle
                  enabled={settings.autoBackup}
                  onChange={(v) => handleChange('autoBackup', v)}
                  label="Auto-Backup"
                />
              </SettingRow>
              {settings.autoBackup && (
                <SettingRow label="Backup-Häufigkeit">
                  <select
                    value={settings.backupFrequency}
                    onChange={(e) => handleChange('backupFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="select"
                    title="Häufigkeit"
                  >
                    <option value="daily">Täglich</option>
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                  </select>
                </SettingRow>
              )}
              <div className="py-3 flex gap-2">
                <button 
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-3 py-2 border border-[#e9e9e7] rounded-md hover:bg-[rgba(55,53,47,0.04)] transition-colors"
                >
                  <Download size={14} className="text-[#9b9a97]" />
                  <span className="text-sm text-[#37352f]">Daten exportieren</span>
                </button>
                <button 
                  className="flex items-center gap-2 px-3 py-2 border border-[#e9e9e7] rounded-md hover:bg-[rgba(55,53,47,0.04)] transition-colors"
                >
                  <Upload size={14} className="text-[#9b9a97]" />
                  <span className="text-sm text-[#37352f]">Daten importieren</span>
                </button>
              </div>
            </Section>

            {/* Danger Zone */}
            <Section title="Gefahrenzone" icon={Trash2}>
              <div className="py-3 space-y-3">
                <button 
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-[#e9e9e7] rounded-md hover:bg-[rgba(55,53,47,0.04)] transition-colors w-full"
                >
                  <span className="text-sm text-[#37352f]">Einstellungen zurücksetzen</span>
                </button>
                <button 
                  onClick={() => setShowDeleteDataConfirm(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors w-full"
                >
                  <Trash2 size={14} />
                  <span className="text-sm">Alle Daten unwiderruflich löschen</span>
                </button>
              </div>
            </Section>
          </>
        )}
      </div>

      {/* Reset Settings Confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-md p-5 w-full max-w-sm mx-4 shadow-lg">
            <h3 className="font-semibold text-[#37352f] mb-2">Einstellungen zurücksetzen?</h3>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Alle Einstellungen werden auf die Standardwerte zurückgesetzt. Deine Daten bleiben erhalten.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="btn btn-ghost">Abbrechen</button>
              <button
                onClick={() => { resetSettings(); setShowResetConfirm(false); showSavedFeedback(); }}
                className="btn btn-primary"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Data Confirm */}
      {showDeleteDataConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-md p-5 w-full max-w-sm mx-4 shadow-lg">
            <h3 className="font-semibold text-red-600 mb-2">⚠️ Alle Daten löschen?</h3>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Aufgaben, Ziele, Einträge und Einstellungen werden dauerhaft gelöscht.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowDeleteDataConfirm(false)} className="btn btn-ghost">Abbrechen</button>
              <button
                onClick={handleDeleteAllData}
                className="px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Alle Daten löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

