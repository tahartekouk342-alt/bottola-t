import { Bell, CheckCheck, Trophy, Loader2, Calendar, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, typeof Trophy> = {
  tournament: Trophy,
  match_result: Swords,
  general: Bell,
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications(user?.id);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl" dir="rtl">
      {/* Header with sport-themed background */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(/images/sport-stadium.jpg)', backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
        <div className="relative p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              الإشعارات
            </h1>
            <p className="text-muted-foreground mr-15">{unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()} className="rounded-xl">
              <CheckCheck className="w-4 h-4 ml-2" />تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">لا توجد إشعارات</h3>
            <p className="text-muted-foreground">ستظهر هنا الإشعارات الخاصة بالمنظمين الذين تتابعهم</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const IconComponent = typeIcons[notification.type] || Bell;
            return (
              <Card
                key={notification.id}
                className={cn("transition-all duration-200 cursor-pointer hover:border-primary/50 overflow-hidden",
                  !notification.is_read && "border-primary/30 bg-primary/5")}
                onClick={() => {
                  if (!notification.is_read) markAsRead(notification.id);
                  if (notification.related_tournament_id) navigate(`/viewer/tournament/${notification.related_tournament_id}`);
                }}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                    !notification.is_read ? "bg-primary/20" : "bg-muted")}>
                    <IconComponent className={cn("w-5 h-5", !notification.is_read ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(notification.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!notification.is_read && <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2 animate-pulse" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}