import { translateUi } from '../locales/translateUi';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, CheckCheck, Lightbulb, MessageSquareReply } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import type { AppNotification } from '../types';

type NotificationTab = 'recommendations' | 'responses';

const recommendationTypes: AppNotification['type'][] = ['new_match', 'price_alert'];

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.currentUser);
  const getNotifications = useNotificationStore((s) => s.getUserNotifications);
  const markRead = useNotificationStore((s) => s.markAsRead);
  const markAllRead = useNotificationStore((s) => s.markAllAsRead);
  const [activeTab, setActiveTab] = useState<NotificationTab>('recommendations');
  if (!user) return null;

  const notifications = getNotifications(user.id);
  const recommendations = notifications.filter((item) => recommendationTypes.includes(item.type));
  const responses = notifications.filter((item) => !recommendationTypes.includes(item.type));
  const visibleNotifications = activeTab === 'recommendations' ? recommendations : responses;
  const unreadCount = visibleNotifications.filter((item) => !item.read).length;

  return <div className="mx-auto max-w-4xl space-y-5 py-2">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><div className="flex items-center gap-2 text-emerald-700"><BellRing className="h-5 w-5" /><span className="text-sm font-semibold">{translateUi("Marketplace updates")}</span></div><h1 className="mt-1 text-3xl font-bold">{translateUi("Notifications")}</h1><p className="mt-2 text-sm text-zinc-500">{translateUi("See marketplace recommendations and responses to your activity.")}</p></div>
      {unreadCount > 0 && <button onClick={() => markAllRead(user.id)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"><CheckCheck className="h-4 w-4" />{translateUi("Mark all read")}</button>}
    </div>

    <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900" role="tablist" aria-label={translateUi("Notification categories")}>
      <button role="tab" aria-selected={activeTab === 'recommendations'} onClick={() => setActiveTab('recommendations')} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${activeTab === 'recommendations' ? 'bg-white text-emerald-800 shadow-sm dark:bg-zinc-800 dark:text-emerald-300' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}><Lightbulb className="h-4 w-4" />{translateUi("Recommendations")}<span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">{recommendations.length}</span></button>
      <button role="tab" aria-selected={activeTab === 'responses'} onClick={() => setActiveTab('responses')} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${activeTab === 'responses' ? 'bg-white text-emerald-800 shadow-sm dark:bg-zinc-800 dark:text-emerald-300' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}><MessageSquareReply className="h-4 w-4" />{translateUi("Responses")}<span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">{responses.length}</span></button>
    </div>

    {visibleNotifications.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700"><Bell className="mx-auto h-8 w-8 text-zinc-400" /><p className="mt-3 font-semibold">{translateUi(activeTab === 'recommendations' ? 'No recommendations yet' : 'No responses yet')}</p><p className="mt-1 text-sm text-zinc-500">{translateUi(activeTab === 'recommendations' ? 'New crop matches and price alerts will show here.' : 'Offers and deal updates will show here.')}</p></div> : <div className="space-y-2" role="tabpanel">
      {visibleNotifications.map((item) => <article key={item.id} className={`rounded-xl border p-4 ${item.read ? 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900' : 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20'}`}>
        <div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-white p-2 text-emerald-700 dark:bg-zinc-900">{activeTab === 'recommendations' ? <Lightbulb className="h-4 w-4" /> : <MessageSquareReply className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{translateUi(item.title)}</h2><time className="text-xs text-zinc-400">{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{translateUi(item.message)}</p><div className="mt-2 flex gap-3">{item.link && <Link to={item.link.replace('/app', '')} onClick={() => markRead(item.id)} className="text-sm font-semibold text-emerald-700">{translateUi("Open update →")}</Link>}{!item.read && <button onClick={() => markRead(item.id)} className="text-sm text-zinc-500">{translateUi("Mark read")}</button>}</div></div></div>
      </article>)}
    </div>}
  </div>;
}
