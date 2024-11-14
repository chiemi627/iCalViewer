import type { NextPage } from "next";
import ICAL from 'ical.js';
import { useState, useEffect, useCallback } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

// iCal形式のデータからイベントデータを取り出す
function parseICSEvents(icsData: string): CalendarEvent[] {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents('vevent');

  return vevents.map(vevent => {
    const event = new ICAL.Event(vevent);
    return {
      id: event.uid,
      title: event.summary,
      start: event.startDate.toJSDate(),
      end: event.endDate.toJSDate()
    };
  });
}

function getDateRanges() {
  const now = new Date();
  
  //今日と明日を取得
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1);

  // 今週の開始日（日曜日）を取得
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  // 来週の終了日（2週間後の土曜日）を取得
  const nextWeekEnd = new Date(thisWeekStart);
  nextWeekEnd.setDate(thisWeekStart.getDate() + 13);

  return { today, tomorrow, thisWeekStart, nextWeekEnd };
}

  const Home: NextPage = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchCalendar = useCallback(async () => {
      try {
        const response = await fetch('/api/calendar');
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data');
        }
        const icsData = await response.text();
        const parsedEvents = parseICSEvents(icsData);
        setEvents(parsedEvents);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '予定の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }, []); 

    useEffect(() => {
      fetchCalendar();
      const interval = setInterval(fetchCalendar, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }, [fetchCalendar]); 

    if (loading) {
      return <div className="text-center py-8">読み込み中...</div>;
    }

    if (error) {
      return <div className="text-red-500 text-center py-8">エラー: {error}</div>;
    }
  
  const { today, tomorrow, thisWeekStart, nextWeekEnd } = getDateRanges();

  // 今日のイベント
  const todayEvents = events.filter(event => 
    event.start >= today && 
    event.start < new Date(today.getTime() + 24*60*60*1000)
  );

  // 今週と来週のイベント
  const futureEvents = events.filter(event => 
    event.start > today && 
    event.start <= nextWeekEnd
  );
  
  return (
    <div>
      <section>
        <h2>本日の予定</h2>
        {todayEvents.length === 0 ? (
          <p>本日の予約はありません</p>
        ) : (
          <div>
            {todayEvents.map(event => (
              <div key={event.id}>
                <div>
                  {event.start.toLocaleTimeString('ja-JP', 
                      { hour: '2-digit',
                        minute: '2-digit'}
                  )}
                  〜
                  {event.end.toLocaleTimeString('ja-JP', 
                      { hour: '2-digit',
                        minute: '2-digit'}
                  )}
                </div>
                <div>{event.title}</div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
      <h2>今後の予定</h2>
      {futureEvents.length === 0 ? (
        <p>来週まで予定はありません</p>
      ) : (
        <div>
          {Object.entries(
            futureEvents.reduce((groups, event) => {
              const date = event.start;
              const isNextWeek = date > new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

              const dateKey = `${
                date.toLocaleDateString('ja-JP', {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })
              }`;

              if (!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(event);
              return groups;
            }, {} as Record<string, CalendarEvent[]>)
          ).map(([dateKey, dateEvents]) => (
            <div>
              <h3>{dateKey}</h3>
              <div>{dateEvents
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .map(event => (
                  <div>
                    <div>
                      {event.start.toLocaleTimeString('ja-JP', 
                          { hour: '2-digit',
                            minute: '2-digit'}
                      )}
                      〜
                      {event.end.toLocaleTimeString('ja-JP', 
                          { hour: '2-digit',
                            minute: '2-digit'}
                      )}
                    </div>
                    <div>
                      {event.title}
                    </div>
                  </div>
                ))
              }</div>
            </div>
          
          ))}  
        </div>
      )}
      </section>        
    </div>
  );
};

export default Home;
