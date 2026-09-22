'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSessions } from '@/lib/storage';
import type { RollDifficulty, TrainingSession } from '@/lib/storage';

type TechniqueTrend = {
  name: string;
  category: string;
  drilled: number;
  attempted: number;
  hit: number;
  total: number;
  last30: number;
  previous30: number;
};

const DIFFICULTIES: RollDifficulty[] = ['Easy', 'Competitive', 'Hard'];

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getStartOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getStartOfDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getPreviousMonthEnd(now: Date) {
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  return new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    Math.min(now.getDate(), lastDay),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds()
  );
}

function currentStreak(sessions: TrainingSession[]) {
  const today = getStartOfDay(new Date());
  const dates = Array.from(new Set(sessions.map((s) => getDateKey(s.date))))
    .map((key) => new Date(`${key}T12:00:00`))
    .sort((a, b) => b.getTime() - a.getTime());

  if (!dates.length) return 0;

  const newestDiff = Math.round((today.getTime() - getStartOfDay(dates[0]).getTime()) / 86400000);
  if (newestDiff > 1) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i += 1) {
    const diff = Math.round(
      (getStartOfDay(dates[i - 1]).getTime() - getStartOfDay(dates[i]).getTime()) / 86400000
    );
    if (diff === 1) streak += 1;
    else break;
  }
  return streak;
}

function longestStreak(sessions: TrainingSession[]) {
  const dates = Array.from(new Set(sessions.map((s) => getDateKey(s.date))))
    .map((key) => new Date(`${key}T12:00:00`))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i += 1) {
    const diff = Math.round(
      (getStartOfDay(dates[i]).getTime() - getStartOfDay(dates[i - 1]).getTime()) / 86400000
    );
    if (diff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function difficultyColor(value: RollDifficulty) {
  if (value === 'Easy') return '#34C759';
  if (value === 'Hard') return '#FF453A';
  return '#FFD60A';
}

function ratingColor(value: number) {
  if (value <= 1.5) return '#FF453A';
  if (value <= 2.5) return '#FF9F0A';
  if (value <= 3.5) return '#FFD60A';
  if (value <= 4.5) return '#34C759';
  return '#30D158';
}

function trendText(current: number, previous: number) {
  if (previous === 0) return current === 0 ? '0%' : 'NEW';
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct > 0 ? `↑ +${pct}%` : pct < 0 ? `↓ ${pct}%` : '0%';
}

export default function StatsPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);

  const loadSessions = useCallback(async () => {
    setSessions(await getSessions());
  }, []);

  useEffect(() => {
    loadSessions();

    const refresh = () => loadSessions();
    const visibility = () => {
      if (document.visibilityState === 'visible') loadSessions();
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visibility);

    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [loadSessions]);

  const a = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousEnd = getPreviousMonthEnd(now);
    const last30 = getStartOfDaysAgo(29);
    const previous30 = getStartOfDaysAgo(59);
    const previous30End = new Date(last30);
    previous30End.setMilliseconds(-1);

    const currentMonth = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= currentStart && d <= now;
    });

    const previousMonth = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= previousStart && d <= previousEnd;
    });

    const total = (items: TrainingSession[], key: 'durationSeconds' | 'rollCount' | 'submissionsFor' | 'submissionsAgainst') =>
      items.reduce((sum, s) => sum + s[key], 0);

    const difficulties: Record<RollDifficulty, number> = {
      Easy: 0,
      Competitive: 0,
      Hard: 0,
    };

    const techniques: Record<string, TechniqueTrend> = {};

    sessions.forEach((session) => {
      session.rolls?.forEach((roll) => {
        difficulties[roll.difficulty || 'Competitive'] += 1;
      });

      const d = new Date(session.date);

      session.techniques?.forEach((log) => {
        const key = log.techniqueId || log.techniqueName;

        if (!techniques[key]) {
          techniques[key] = {
            name: log.techniqueName,
            category: log.category,
            drilled: 0,
            attempted: 0,
            hit: 0,
            total: 0,
            last30: 0,
            previous30: 0,
          };
        }

        const t = techniques[key];
        t.total += 1;
        if (log.activity === 'Drilled') t.drilled += 1;
        if (log.activity === 'Attempted') t.attempted += 1;
        if (log.activity === 'Hit') t.hit += 1;

        if (d >= last30 && d <= now) t.last30 += 1;
        else if (d >= previous30 && d <= previous30End) t.previous30 += 1;
      });
    });

    const rated = sessions.filter((s) => Boolean(s.ratings));

    const avgRating = (key: 'energy' | 'performance' | 'technique' | 'conditioning') =>
      rated.length
        ? rated.reduce((sum, s) => sum + (s.ratings?.[key] || 0), 0) / rated.length
        : 0;

    const hrSessions = sessions.filter((s) => s.averageHr > 0);

    return {
      totalSessions: sessions.length,
      totalMat: total(sessions, 'durationSeconds'),
      totalRolls: total(sessions, 'rollCount'),
      totalFor: total(sessions, 'submissionsFor'),
      totalAgainst: total(sessions, 'submissionsAgainst'),
      gi: sessions.filter((s) => s.style === 'Gi').length,
      noGi: sessions.filter((s) => s.style === 'No-Gi').length,
      avgHr: hrSessions.length
        ? Math.round(hrSessions.reduce((sum, s) => sum + s.averageHr, 0) / hrSessions.length)
        : 0,
      maxHr: sessions.reduce((m, s) => Math.max(m, s.maxHr || 0), 0),
      currentMonth,
      previousMonth,
      currentMat: total(currentMonth, 'durationSeconds'),
      previousMat: total(previousMonth, 'durationSeconds'),
      currentRolls: total(currentMonth, 'rollCount'),
      previousRolls: total(previousMonth, 'rollCount'),
      currentSubs: total(currentMonth, 'submissionsFor'),
      previousSubs: total(previousMonth, 'submissionsFor'),
      currentStreak: currentStreak(sessions),
      longestStreak: longestStreak(sessions),
      longestSession: [...sessions].sort((x, y) => y.durationSeconds - x.durationSeconds)[0] || null,
      mostRolls: [...sessions].sort((x, y) => y.rollCount - x.rollCount)[0] || null,
      mostSubs: [...sessions].sort((x, y) => y.submissionsFor - x.submissionsFor)[0] || null,
      difficulties,
      difficultyTotal: Object.values(difficulties).reduce((x, y) => x + y, 0),
      techniques: Object.values(techniques).sort((x, y) => y.total - x.total),
      momentum: Object.values(techniques)
        .filter((t) => t.last30 || t.previous30)
        .sort((x, y) => (y.last30 - y.previous30) - (x.last30 - x.previous30))
        .slice(0, 5),
      ratedCount: rated.length,
      ratings: rated.length
        ? {
            energy: avgRating('energy'),
            performance: avgRating('performance'),
            technique: avgRating('technique'),
            conditioning: avgRating('conditioning'),
          }
        : null,
    };
  }, [sessions]);

  if (!sessions.length) {
    return (
      <main className="stats-page">
        <div className="eyebrow">TRAINING ANALYTICS</div>
        <h1>Stats</h1>
        <p className="subtitle">Your trends, records and training patterns.</p>
        <div className="empty-card">
          <strong>No training data yet</strong>
          <span>Complete or quick-log a session and your stats will appear here.</span>
        </div>
        <Style />
      </main>
    );
  }

  return (
    <main className="stats-page">
      <header>
        <div className="eyebrow">TRAINING ANALYTICS</div>
        <h1>Stats</h1>
        <p className="subtitle">Your trends, records and training patterns.</p>
      </header>

      <div className="stat-grid">
        <Stat label="TOTAL SESSIONS" value={String(a.totalSessions)} />
        <Stat label="MAT TIME" value={formatDuration(a.totalMat)} />
        <Stat label="TOTAL ROLLS" value={String(a.totalRolls)} />
        <Stat label="SUBMISSIONS" value={String(a.totalFor)} />
      </div>

      <Title>This month</Title>
      <div className="card month-grid">
        <Trend label="MAT TIME" value={formatDuration(a.currentMat)} current={a.currentMat} previous={a.previousMat} />
        <Trend label="SESSIONS" value={String(a.currentMonth.length)} current={a.currentMonth.length} previous={a.previousMonth.length} />
        <Trend label="ROLLS" value={String(a.currentRolls)} current={a.currentRolls} previous={a.previousRolls} />
        <Trend label="SUBMISSIONS" value={String(a.currentSubs)} current={a.currentSubs} previous={a.previousSubs} />
      </div>

      <Title>Consistency</Title>
      <div className="two-grid">
        <div className="card"><b>{a.currentStreak}</b><small>CURRENT STREAK</small><em>consecutive training days</em></div>
        <div className="card"><b>{a.longestStreak}</b><small>LONGEST STREAK</small><em>consecutive training days</em></div>
      </div>

      <Title>Records</Title>
      <div className="card">
        <Record label="LONGEST SESSION" value={a.longestSession ? formatDuration(a.longestSession.durationSeconds) : '--'} />
        <Record label="MOST ROLLS" value={a.mostRolls ? String(a.mostRolls.rollCount) : '--'} />
        <Record label="MOST SUBMISSIONS" value={a.mostSubs ? String(a.mostSubs.submissionsFor) : '--'} last />
      </div>

      <Title>Roll difficulty</Title>
      <div className="card">
        {DIFFICULTIES.map((difficulty) => {
          const count = a.difficulties[difficulty];
          const pct = a.difficultyTotal ? Math.round((count / a.difficultyTotal) * 100) : 0;
          return (
            <div className="difficulty" key={difficulty}>
              <span><i style={{ background: difficultyColor(difficulty) }} />{difficulty}</span>
              <strong>{count} <small>{pct}%</small></strong>
            </div>
          );
        })}
      </div>

      <Title>Technique development</Title>
      {a.techniques.length ? (
        <div className="tech-list">
          {a.techniques.slice(0, 8).map((t) => {
            const attempts = t.attempted + t.hit;
            const hitRate = attempts ? Math.round((t.hit / attempts) * 100) : 0;
            return (
              <div className="tech-card" key={`${t.name}-${t.category}`}>
                <div className="tech-head">
                  <div><strong>{t.name}</strong><span>{t.category}</span></div>
                  <div className="hit"><strong>{hitRate}%</strong><span>HIT RATE</span></div>
                </div>
                <div className="tech-stats">
                  <Mini label="DRILLED" value={t.drilled} />
                  <Mini label="ATTEMPTED" value={t.attempted} />
                  <Mini label="HIT" value={t.hit} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-inner">Log techniques during sessions to see development data.</div>
      )}

      <Title>Technique momentum</Title>
      <div className="card">
        {a.momentum.length ? a.momentum.map((t, i) => {
          const diff = t.last30 - t.previous30;
          return (
            <div className={`momentum ${i === a.momentum.length - 1 ? 'last' : ''}`} key={`${t.name}-${t.category}`}>
              <div><strong>{t.name}</strong><span>{t.last30} logs vs {t.previous30}</span></div>
              <b className={diff > 0 ? 'up' : diff < 0 ? 'down' : ''}>{diff > 0 ? '+' : ''}{diff}</b>
            </div>
          );
        }) : <span className="muted">Not enough recent technique data yet.</span>}
      </div>

      <Title>Training feel</Title>
      <div className="card">
        {a.ratings ? (
          <>
            <Rating label="ENERGY" value={a.ratings.energy} />
            <Rating label="PERFORMANCE" value={a.ratings.performance} />
            <Rating label="TECHNIQUE" value={a.ratings.technique} />
            <Rating label="CONDITIONING" value={a.ratings.conditioning} />
            <div className="note">Average of {a.ratedCount} rated {a.ratedCount === 1 ? 'session' : 'sessions'}.</div>
          </>
        ) : <span className="muted">Rate sessions after training to see these averages.</span>}
      </div>

      <Title>Training style</Title>
      <div className="card split">
        <div><span>Gi</span><strong>{a.gi}</strong></div>
        <i />
        <div><span>No-Gi</span><strong>{a.noGi}</strong></div>
      </div>

      <Title>Submission balance</Title>
      <div className="card split">
        <div><strong className="green">{a.totalFor}</strong><span className="green">FOR</span></div>
        <i />
        <div><strong className="red">{a.totalAgainst}</strong><span className="red">AGAINST</span></div>
      </div>

      <Title>Heart rate</Title>
      <div className="card hr">
        <div><strong>{a.avgHr || '--'}</strong><span>AVG BPM</span></div>
        <div><strong>{a.maxHr || '--'}</strong><span>MAX BPM</span></div>
        <p>Heart-rate values currently come from the simulated HR connection used by the Train page.</p>
      </div>

      <div className="bottom-space" />
      <Style />
    </main>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h2>{children}</h2>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat"><strong>{value}</strong><span>{label}</span></div>;
}

function Trend({ label, value, current, previous }: { label: string; value: string; current: number; previous: number }) {
  const cls = current > previous ? 'up' : current < previous ? 'down' : '';
  return <div className="trend"><span>{label}</span><strong>{value}</strong><b className={cls}>{trendText(current, previous)}</b></div>;
}

function Record({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <div className={`record ${last ? 'last' : ''}`}><span>{label}</span><strong>{value}</strong></div>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div className="mini"><strong>{value}</strong><span>{label}</span></div>;
}

function Rating({ label, value }: { label: string; value: number }) {
  const color = ratingColor(value);
  return <div className="rating" style={{ borderLeftColor: color }}><span style={{ color }}>{label}</span><strong style={{ color }}>{value.toFixed(1)}/5</strong></div>;
}

function Style() {
  return (
    <style jsx global>{`
      .stats-page { width: 100%; }
      .stats-page header { margin-bottom: 28px; }
      .stats-page .eyebrow { color:#777c85;font-size:11px;font-weight:900;letter-spacing:.16em; }
      .stats-page h1 { margin:4px 0 0;color:#fff;font-size:34px;line-height:1;font-weight:900;letter-spacing:-.04em; }
      .stats-page .subtitle { margin:7px 0 0;color:#777c85;font-size:13px; }
      .stats-page h2 { margin:22px 0 13px;color:#fff;font-size:20px;font-weight:900;letter-spacing:-.02em; }
      .stats-page .stat-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:24px; }
      .stats-page .stat,.stats-page .card,.stats-page .tech-card,.stats-page .empty-card,.stats-page .empty-inner { border:1px solid #2a2e35;background:#121417; }
      .stats-page .stat { min-height:108px;display:flex;flex-direction:column;justify-content:space-between;padding:18px;border-radius:20px; }
      .stats-page .stat strong { color:#fff;font-size:25px;font-weight:900; }
      .stats-page .stat span,.stats-page .card span { color:#777c85;font-size:9px;font-weight:900;letter-spacing:.08em; }
      .stats-page .card { padding:19px;margin-bottom:24px;border-radius:22px; }
      .stats-page .month-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px; }
      .stats-page .trend strong { display:block;margin-top:5px;color:#fff;font-size:23px; }
      .stats-page .trend b { display:inline-block;margin-top:9px;padding:6px 9px;border-radius:9px;background:#23262b;color:#aaa;font-size:10px; }
      .stats-page .trend b.up,.stats-page .momentum b.up { background:rgba(52,199,89,.12);color:#34c759; }
      .stats-page .trend b.down,.stats-page .momentum b.down { background:rgba(255,69,58,.12);color:#ff453a; }
      .stats-page .two-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px; }
      .stats-page .two-grid .card b { display:block;color:#fff;font-size:32px; }
      .stats-page .two-grid small { display:block;margin-top:7px;color:#777c85;font-size:9px;font-weight:900; }
      .stats-page .two-grid em { display:block;margin-top:5px;color:#555b63;font-size:10px;font-style:normal; }
      .stats-page .record,.stats-page .difficulty,.stats-page .momentum { display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 0;border-bottom:1px solid #272a30; }
      .stats-page .record.last,.stats-page .difficulty:last-child,.stats-page .momentum.last { border-bottom:0; }
      .stats-page .record strong,.stats-page .difficulty strong { color:#fff;font-size:16px; }
      .stats-page .difficulty > span { display:flex;align-items:center;gap:8px;color:#fff;font-size:13px; }
      .stats-page .difficulty i { width:8px;height:8px;border-radius:50%; }
      .stats-page .difficulty small { color:#777c85;font-size:11px; }
      .stats-page .tech-list { display:flex;flex-direction:column;gap:10px; }
      .stats-page .tech-card { padding:18px;border-radius:20px; }
      .stats-page .tech-head { display:flex;align-items:center;justify-content:space-between;gap:16px; }
      .stats-page .tech-head strong,.stats-page .tech-head span { display:block; }
      .stats-page .tech-head strong { color:#fff;font-size:16px; }
      .stats-page .tech-head span { margin-top:4px;color:#777c85;font-size:10px; }
      .stats-page .hit { text-align:right; }
      .stats-page .hit strong { color:#34c759;font-size:19px; }
      .stats-page .tech-stats { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding-top:15px;margin-top:17px;border-top:1px solid #272a30; }
      .stats-page .mini { text-align:center; }
      .stats-page .mini strong { display:block;color:#fff;font-size:19px; }
      .stats-page .mini span { display:block;margin-top:4px;color:#777c85;font-size:8px;font-weight:900; }
      .stats-page .momentum strong,.stats-page .momentum span { display:block; }
      .stats-page .momentum strong { color:#fff;font-size:14px; }
      .stats-page .momentum span { margin-top:4px;color:#777c85;font-size:10px; }
      .stats-page .momentum b { min-width:50px;padding:8px 10px;border-radius:10px;background:#23262b;color:#777c85;text-align:center; }
      .stats-page .rating { display:flex;align-items:center;justify-content:space-between;padding:12px;margin-bottom:8px;border-left:3px solid;border-radius:12px;background:#15171b; }
      .stats-page .rating span { font-size:10px;font-weight:900; }
      .stats-page .rating strong { font-size:17px; }
      .stats-page .note,.stats-page .muted { color:#777c85;font-size:10px;line-height:1.5; }
      .stats-page .note { margin-top:14px;color:#555b63; }
      .stats-page .split { display:grid;grid-template-columns:1fr 1px 1fr;align-items:center;text-align:center; }
      .stats-page .split > i { width:1px;height:46px;background:#292c32; }
      .stats-page .split strong,.stats-page .split span { display:block; }
      .stats-page .split strong { margin-top:5px;color:#fff;font-size:28px; }
      .stats-page .green { color:#34c759 !important; }
      .stats-page .red { color:#ff453a !important; }
      .stats-page .hr { display:flex;gap:55px;flex-wrap:wrap; }
      .stats-page .hr strong,.stats-page .hr span { display:block; }
      .stats-page .hr strong { color:#ff5a60;font-size:30px; }
      .stats-page .hr p { width:100%;margin:0;color:#555b63;font-size:9px;line-height:1.5; }
      .stats-page .empty-card,.stats-page .empty-inner { padding:24px;border-radius:20px; }
      .stats-page .empty-card { display:flex;flex-direction:column;gap:7px; }
      .stats-page .empty-card strong { color:#fff;font-size:18px; }
      .stats-page .empty-card span,.stats-page .empty-inner { color:#777c85;font-size:13px; }
      .stats-page .bottom-space { height:70px; }
      @media (min-width:780px) {
        .stats-page .stat-grid { grid-template-columns:repeat(4,minmax(0,1fr)); }
        .stats-page .month-grid { grid-template-columns:repeat(4,minmax(0,1fr)); }
      }
      @media (max-width:520px) {
        .stats-page .two-grid { grid-template-columns:1fr; }
      }
    `}</style>
  );
}

