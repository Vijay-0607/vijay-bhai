import { Link } from 'react-router-dom';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.currentUser);
  const getNotifications = useNotificationStore((s) => s.getUserNotifications);
  const markRead = useNotificationStore((s) => s.markAsRead);
  const markAllRead = useNotificationStore((s) => s.markAllAsRead);
  if (!user) return null;
  const notifications = getNotifications(user.id);
  return <div className="mx-auto max-w-4xl space-y-5 py-2"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-emerald-700"><BellRing className="h-5 w-5"/><span className="text-sm font-semibold">Marketplace updates</span></div><h1 className="mt-1 text-3xl font-bold">Notifications</h1><p className="mt-2 text-sm text-zinc-500">Offers, matches, and deal changes for your account.</p></div>{notifications.some((item)=>!item.read)&&<button onClick={()=>markAllRead(user.id)} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"><CheckCheck className="h-4 w-4"/>Mark all read</button>}</div>{notifications.length===0?<div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700"><Bell className="mx-auto h-8 w-8 text-zinc-400"/><p className="mt-3 font-semibold">You’re all caught up</p><p className="mt-1 text-sm text-zinc-500">New matches and deal updates will show here.</p></div>:<div className="space-y-2">{notifications.map((item)=><article key={item.id} className={`rounded-xl border p-4 ${item.read?'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900':'border-emerald-300 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20'}`}><div className="flex items-start gap-3"><div className="mt-0.5 rounded-lg bg-white p-2 text-emerald-700 dark:bg-zinc-900"><Bell className="h-4 w-4"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{item.title}</h2><time className="text-xs text-zinc-400">{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.message}</p><div className="mt-2 flex gap-3">{item.link&&<Link to={item.link.replace('/app','')} onClick={()=>markRead(item.id)} className="text-sm font-semibold text-emerald-700">Open update →</Link>}{!item.read&&<button onClick={()=>markRead(item.id)} className="text-sm text-zinc-500">Mark read</button>}</div></div></div></article>)}</div>}</div>;
}
