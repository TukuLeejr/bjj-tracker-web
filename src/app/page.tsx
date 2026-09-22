'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import QuickLogModal from '@/components/quick-log-modal';

import {
  getProfile,
  getSessions,
} from '@/lib/storage';

import type {
  TrainingSession,
  UserProfile,
} from '@/lib/storage';

function formatDuration(
  seconds: number
) {
  const hours =
    Math.floor(
      seconds / 3600
    );

  const minutes =
    Math.floor(
      (seconds % 3600) /
        60
    );

  if (
    hours > 0
  ) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatMinutes(
  minutes: number
) {
  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    minutes % 60;

  if (
    hours > 0
  ) {
    return `${hours}h ${remaining}m`;
  }

  return `${remaining}m`;
}

function formatShortDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    }
  );
}

function formatWeekday(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    undefined,
    {
      weekday: 'long',
    }
  );
}

function goalColor(
  progress: number
) {
  if (
    progress >= 1
  ) {
    return '#30D158';
  }

  if (
    progress >= 0.75
  ) {
    return '#34C759';
  }

  if (
    progress >= 0.5
  ) {
    return '#FFD60A';
  }

  if (
    progress >= 0.25
  ) {
    return '#FF9F0A';
  }

  return '#FF453A';
}

function goalTint(
  progress: number
) {
  if (
    progress >= 1
  ) {
    return 'rgba(48, 209, 88, 0.08)';
  }

  if (
    progress >= 0.75
  ) {
    return 'rgba(52, 199, 89, 0.08)';
  }

  if (
    progress >= 0.5
  ) {
    return 'rgba(255, 214, 10, 0.07)';
  }

  if (
    progress >= 0.25
  ) {
    return 'rgba(255, 159, 10, 0.07)';
  }

  return 'rgba(255, 69, 58, 0.07)';
}

function getStartOfWeek() {
  const now =
    new Date();

  const day =
    now.getDay();

  const difference =
    now.getDate() -
    day +
    (
      day === 0
        ? -6
        : 1
    );

  const monday =
    new Date(
      now
    );

  monday.setDate(
    difference
  );

  monday.setHours(
    0,
    0,
    0,
    0
  );

  return monday;
}

function getStartOfMonth(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function getStartOfPreviousMonth(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    1
  );
}

function getPreviousMonthComparisonEnd(
  date: Date
) {
  const previousMonthLastDay =
    new Date(
      date.getFullYear(),
      date.getMonth(),
      0
    ).getDate();

  return new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    Math.min(
      date.getDate(),
      previousMonthLastDay
    ),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}

function getStartOfDaysAgo(
  daysAgo: number
) {
  const date =
    new Date();

  date.setDate(
    date.getDate() -
      daysAgo
  );

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

function percentageChange(
  current: number,
  previous: number
) {
  if (
    previous === 0
  ) {
    if (
      current === 0
    ) {
      return 0;
    }

    return null;
  }

  return Math.round(
    (
      (
        current -
        previous
      ) /
      previous
    ) *
      100
  );
}

function trendDirection(
  current: number,
  previous: number
) {
  if (
    current >
    previous
  ) {
    return 'up';
  }

  if (
    current <
    previous
  ) {
    return 'down';
  }

  return 'same';
}

export default function HomePage() {
  const [
    sessions,
    setSessions,
  ] =
    useState<
      TrainingSession[]
    >([]);

  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile>({
      belt: 'White',
      weightKg: '',
      gym: '',
      preferredStyle:
        'Both',
      weeklySessionGoal:
        4,
      weeklyMatMinutesGoal:
        360,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    quickLogVisible,
    setQuickLogVisible,
  ] =
    useState(
      false
    );

  const loadData =
    useCallback(
      async () => {
        try {
          const [
            sessionData,
            profileData,
          ] =
            await Promise.all([
              getSessions(),
              getProfile(),
            ]);

          setSessions(
            sessionData
          );

          setProfile(
            profileData
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    loadData();

    function refreshOnFocus() {
      loadData();
    }

    function refreshOnVisibility() {
      if (
        document.visibilityState ===
        'visible'
      ) {
        loadData();
      }
    }

    window.addEventListener(
      'focus',
      refreshOnFocus
    );

    document.addEventListener(
      'visibilitychange',
      refreshOnVisibility
    );

    return () => {
      window.removeEventListener(
        'focus',
        refreshOnFocus
      );

      document.removeEventListener(
        'visibilitychange',
        refreshOnVisibility
      );
    };
  }, [
    loadData,
  ]);

  const weekSessions =
    useMemo(() => {
      const start =
        getStartOfWeek();

      const now =
        new Date();

      return sessions.filter(
        (
          session
        ) => {
          const date =
            new Date(
              session.date
            );

          return (
            date >= start &&
            date <= now
          );
        }
      );
    }, [
      sessions,
    ]);

  const weeklyMatSeconds =
    useMemo(
      () =>
        weekSessions.reduce(
          (
            total,
            session
          ) =>
            total +
            session.durationSeconds,
          0
        ),
      [
        weekSessions,
      ]
    );

  const weeklyRolls =
    useMemo(
      () =>
        weekSessions.reduce(
          (
            total,
            session
          ) =>
            total +
            session.rollCount,
          0
        ),
      [
        weekSessions,
      ]
    );

  const weeklySubs =
    useMemo(
      () =>
        weekSessions.reduce(
          (
            total,
            session
          ) =>
            total +
            session.submissionsFor,
          0
        ),
      [
        weekSessions,
      ]
    );

  const dashboardTrends =
    useMemo(() => {
      const now =
        new Date();

      const currentMonthStart =
        getStartOfMonth(
          now
        );

      const previousMonthStart =
        getStartOfPreviousMonth(
          now
        );

      const previousMonthEnd =
        getPreviousMonthComparisonEnd(
          now
        );

      const currentMonth =
        sessions.filter(
          (
            session
          ) => {
            const date =
              new Date(
                session.date
              );

            return (
              date >=
                currentMonthStart &&
              date <= now
            );
          }
        );

      const previousMonth =
        sessions.filter(
          (
            session
          ) => {
            const date =
              new Date(
                session.date
              );

            return (
              date >=
                previousMonthStart &&
              date <=
                previousMonthEnd
            );
          }
        );

      const currentMatSeconds =
        currentMonth.reduce(
          (
            total,
            session
          ) =>
            total +
            session.durationSeconds,
          0
        );

      const previousMatSeconds =
        previousMonth.reduce(
          (
            total,
            session
          ) =>
            total +
            session.durationSeconds,
          0
        );

      const currentRolls =
        currentMonth.reduce(
          (
            total,
            session
          ) =>
            total +
            session.rollCount,
          0
        );

      const previousRolls =
        previousMonth.reduce(
          (
            total,
            session
          ) =>
            total +
            session.rollCount,
          0
        );

      const currentSubs =
        currentMonth.reduce(
          (
            total,
            session
          ) =>
            total +
            session.submissionsFor,
          0
        );

      const previousSubs =
        previousMonth.reduce(
          (
            total,
            session
          ) =>
            total +
            session.submissionsFor,
          0
        );

      const last30Start =
        getStartOfDaysAgo(
          29
        );

      const previous30Start =
        getStartOfDaysAgo(
          59
        );

      const previous30End =
        new Date(
          last30Start
        );

      previous30End.setMilliseconds(
        -1
      );

      const techniqueMap: {
        [key: string]: {
          name: string;
          last30: number;
          previous30: number;
        };
      } = {};

      sessions.forEach(
        (
          session
        ) => {
          const sessionDate =
            new Date(
              session.date
            );

          session.techniques?.forEach(
            (
              technique
            ) => {
              const key =
                technique.techniqueId ||
                technique.techniqueName;

              if (
                !techniqueMap[
                  key
                ]
              ) {
                techniqueMap[
                  key
                ] = {
                  name:
                    technique.techniqueName,
                  last30:
                    0,
                  previous30:
                    0,
                };
              }

              if (
                sessionDate >=
                  last30Start &&
                sessionDate <=
                  now
              ) {
                techniqueMap[
                  key
                ].last30 +=
                  1;
              } else if (
                sessionDate >=
                  previous30Start &&
                sessionDate <=
                  previous30End
              ) {
                techniqueMap[
                  key
                ].previous30 +=
                  1;
              }
            }
          );
        }
      );

      const techniqueMomentum =
        Object.values(
          techniqueMap
        )
          .map(
            (
              item
            ) => ({
              ...item,

              difference:
                item.last30 -
                item.previous30,
            })
          )
          .filter(
            (
              item
            ) =>
              item.last30 >
                0 ||
              item.previous30 >
                0
          )
          .sort(
            (
              a,
              b
            ) =>
              Math.abs(
                b.difference
              ) -
              Math.abs(
                a.difference
              )
          )
          .slice(
            0,
            3
          );

      return {
        currentMonth,
        previousMonth,

        currentMatSeconds,
        previousMatSeconds,

        currentRolls,
        previousRolls,

        currentSubs,
        previousSubs,

        techniqueMomentum,
      };
    }, [
      sessions,
    ]);

  const sessionGoal =
    Math.max(
      profile.weeklySessionGoal,
      1
    );

  const matGoalMinutes =
    Math.max(
      profile.weeklyMatMinutesGoal,
      30
    );

  const weeklyMatMinutes =
    Math.floor(
      weeklyMatSeconds /
        60
    );

  const sessionGoalProgress =
    Math.min(
      weekSessions.length /
        sessionGoal,
      1
    );

  const matGoalProgress =
    Math.min(
      weeklyMatMinutes /
        matGoalMinutes,
      1
    );

  const sessionsRemaining =
    Math.max(
      sessionGoal -
        weekSessions.length,
      0
    );

  const matMinutesRemaining =
    Math.max(
      matGoalMinutes -
        weeklyMatMinutes,
      0
    );

  const sessionGoalColor =
    goalColor(
      sessionGoalProgress
    );

  const matGoalColor =
    goalColor(
      matGoalProgress
    );

  const recentSessions =
    useMemo(
      () =>
        [
          ...sessions,
        ]
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b.date
              ).getTime() -
              new Date(
                a.date
              ).getTime()
          )
          .slice(
            0,
            3
          ),
      [
        sessions,
      ]
    );

  const totalRolls =
    useMemo(
      () =>
        sessions.reduce(
          (
            total,
            session
          ) =>
            total +
            session.rollCount,
          0
        ),
      [
        sessions,
      ]
    );

  function getTrendText(
    current: number,
    previous: number
  ) {
    const percentage =
      percentageChange(
        current,
        previous
      );

    if (
      previous === 0 &&
      current > 0
    ) {
      return 'NEW';
    }

    if (
      percentage !==
        null &&
      percentage > 0
    ) {
      return `↑ +${percentage}%`;
    }

    if (
      percentage !==
        null &&
      percentage < 0
    ) {
      return `↓ ${percentage}%`;
    }

    return '0%';
  }

  function TrendRow({
    label,
    currentDisplay,
    previousDisplay,
    currentValue,
    previousValue,
  }: {
    label: string;
    currentDisplay: string;
    previousDisplay: string;
    currentValue: number;
    previousValue: number;
  }) {
    const direction =
      trendDirection(
        currentValue,
        previousValue
      );

    return (
      <div className="trend-row">
        <div className="trend-row-top">
          <div>
            <div className="trend-label">
              {label}
            </div>

            <div className="trend-number">
              {currentDisplay}
            </div>
          </div>

          <div
            className={`trend-badge ${direction}`}
          >
            {getTrendText(
              currentValue,
              previousValue
            )}
          </div>
        </div>

        <div className="previous-row">
          <span>
            LAST MONTH
          </span>

          <strong>
            {previousDisplay}
          </strong>
        </div>
      </div>
    );
  }

  if (
    loading
  ) {
    return (
      <main className="home-page">
        <div className="loading-card">
          Loading your BJJ tracker...
        </div>

        <style jsx>{`
          .home-page {
            width: 100%;
          }

          .loading-card {
            min-height: 160px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #23262b;
            border-radius: 20px;
            background: #141619;
            color: #777c85;
            font-size: 14px;
            font-weight: 700;
          }
        `}</style>
      </main>
    );
  }

  return (
    <>
      <main className="home-page">
        <header className="home-header">
          <div>
            <div className="eyebrow">
              BJJ TRACKER
            </div>

            <h1>
              Ready to roll?
            </h1>

            <div className="profile-line">
              {profile.belt} belt
              {profile.gym
                ? ` · ${profile.gym}`
                : ''}
            </div>
          </div>

          <Link
            href="/profile"
            className="profile-button"
            aria-label="Open profile"
          >
            🥋
          </Link>
        </header>

        <Link
          href="/train"
          className="start-training"
        >
          <div>
            <div className="start-title">
              START TRAINING
            </div>

            <div className="start-subtitle">
              {
                profile.preferredStyle
              }{' '}
              · live session
            </div>
          </div>

          <span className="large-arrow">
            ›
          </span>
        </Link>

        <button
          type="button"
          className="quick-log"
          onClick={() =>
            setQuickLogVisible(
              true
            )
          }
        >
          <div className="quick-left">
            <div className="quick-icon">
              +
            </div>

            <div>
              <div className="quick-title">
                QUICK LOG
              </div>

              <div className="quick-subtitle">
                Add a past session
              </div>
            </div>
          </div>

          <span className="quick-arrow">
            ›
          </span>
        </button>

        <div className="hr-card">
          <div className="hr-left">
            <div className="heart">
              ♥
            </div>

            <div>
              <div className="hr-title">
                HR Monitor
              </div>

              <div className="hr-subtitle">
                Bluetooth unavailable in this web version
              </div>
            </div>
          </div>

          <div className="offline">
            OFFLINE
          </div>
        </div>

        <div className="section-heading">
          <h2>
            This week
          </h2>

          <span>
            Live stats
          </span>
        </div>

        <div className="weekly-grid">
          <div className="weekly-card">
            <strong>
              {
                weekSessions.length
              }
            </strong>

            <span>
              SESSIONS
            </span>
          </div>

          <div className="weekly-card">
            <strong>
              {formatDuration(
                weeklyMatSeconds
              )}
            </strong>

            <span>
              MAT TIME
            </span>
          </div>

          <div className="weekly-card">
            <strong>
              {weeklyRolls}
            </strong>

            <span>
              ROLLS
            </span>
          </div>

          <div className="weekly-card">
            <strong>
              {weeklySubs}
            </strong>

            <span>
              SUBMISSIONS
            </span>
          </div>
        </div>

        <div className="section-heading">
          <h2>
            Monthly trends
          </h2>

          <span>
            vs last month
          </span>
        </div>

        <div className="trends-card">
          <TrendRow
            label="MAT TIME"
            currentDisplay={
              formatDuration(
                dashboardTrends.currentMatSeconds
              )
            }
            previousDisplay={
              formatDuration(
                dashboardTrends.previousMatSeconds
              )
            }
            currentValue={
              dashboardTrends.currentMatSeconds
            }
            previousValue={
              dashboardTrends.previousMatSeconds
            }
          />

          <div className="divider" />

          <TrendRow
            label="SESSIONS"
            currentDisplay={
              String(
                dashboardTrends.currentMonth.length
              )
            }
            previousDisplay={
              String(
                dashboardTrends.previousMonth.length
              )
            }
            currentValue={
              dashboardTrends.currentMonth.length
            }
            previousValue={
              dashboardTrends.previousMonth.length
            }
          />

          <div className="divider" />

          <TrendRow
            label="ROLLS"
            currentDisplay={
              String(
                dashboardTrends.currentRolls
              )
            }
            previousDisplay={
              String(
                dashboardTrends.previousRolls
              )
            }
            currentValue={
              dashboardTrends.currentRolls
            }
            previousValue={
              dashboardTrends.previousRolls
            }
          />

          <div className="divider" />

          <TrendRow
            label="SUBMISSIONS"
            currentDisplay={
              String(
                dashboardTrends.currentSubs
              )
            }
            previousDisplay={
              String(
                dashboardTrends.previousSubs
              )
            }
            currentValue={
              dashboardTrends.currentSubs
            }
            previousValue={
              dashboardTrends.previousSubs
            }
          />
        </div>

        <div className="section-heading">
          <h2>
            Technique momentum
          </h2>

          <Link
            href="/stats"
            className="view-all"
          >
            Full stats
          </Link>
        </div>

        <div className="momentum-card">
          {dashboardTrends.techniqueMomentum.length >
          0 ? (
            dashboardTrends.techniqueMomentum.map(
              (
                technique
              ) => {
                const increased =
                  technique.difference >
                  0;

                const decreased =
                  technique.difference <
                  0;

                return (
                  <div
                    className="momentum-row"
                    key={
                      technique.name
                    }
                  >
                    <div>
                      <div className="momentum-name">
                        {
                          technique.name
                        }
                      </div>

                      <div className="momentum-detail">
                        {
                          technique.last30
                        }{' '}
                        logs in last 30 days
                      </div>

                      <div className="momentum-previous">
                        Previous 30 days:{' '}
                        {
                          technique.previous30
                        }
                      </div>
                    </div>

                    <div
                      className={`momentum-badge ${
                        increased
                          ? 'up'
                          : decreased
                            ? 'down'
                            : ''
                      }`}
                    >
                      {increased
                        ? '↑ +'
                        : decreased
                          ? '↓ '
                          : ''}
                      {
                        technique.difference
                      }
                    </div>
                  </div>
                );
              }
            )
          ) : (
            <div className="empty-momentum">
              <strong>
                No technique trend yet
              </strong>

              <span>
                Log techniques during training and your 30-day momentum will show here.
              </span>
            </div>
          )}
        </div>

        <h2 className="standalone-heading">
          Goals
        </h2>

        <div
          className="goal-card"
          style={{
            borderColor:
              sessionGoalColor,

            background:
              goalTint(
                sessionGoalProgress
              ),
          }}
        >
          <div className="goal-header">
            <div>
              <div className="goal-title">
                Weekly sessions
              </div>

              <div className="goal-subtitle">
                Target{' '}
                {sessionGoal}{' '}
                sessions
              </div>
            </div>

            <div
              className="goal-count"
              style={{
                color:
                  sessionGoalColor,
              }}
            >
              {
                weekSessions.length
              }{' '}
              /{' '}
              {
                sessionGoal
              }
            </div>
          </div>

          <div className="progress-background">
            <div
              className="progress-fill"
              style={{
                width:
                  `${sessionGoalProgress * 100}%`,

                background:
                  sessionGoalColor,
              }}
            />
          </div>

          <div
            className="goal-footer"
            style={{
              color:
                sessionGoalColor,
            }}
          >
            {sessionsRemaining ===
            0
              ? 'Goal complete 🔥'
              : `${sessionsRemaining} ${
                  sessionsRemaining ===
                  1
                    ? 'session'
                    : 'sessions'
                } remaining`}
          </div>
        </div>

        <div
          className="goal-card"
          style={{
            borderColor:
              matGoalColor,

            background:
              goalTint(
                matGoalProgress
              ),
          }}
        >
          <div className="goal-header">
            <div>
              <div className="goal-title">
                Weekly mat time
              </div>

              <div className="goal-subtitle">
                Target{' '}
                {formatMinutes(
                  matGoalMinutes
                )}
              </div>
            </div>

            <div
              className="goal-count"
              style={{
                color:
                  matGoalColor,
              }}
            >
              {formatMinutes(
                weeklyMatMinutes
              )}
            </div>
          </div>

          <div className="progress-background">
            <div
              className="progress-fill"
              style={{
                width:
                  `${matGoalProgress * 100}%`,

                background:
                  matGoalColor,
              }}
            />
          </div>

          <div
            className="goal-footer"
            style={{
              color:
                matGoalColor,
            }}
          >
            {matMinutesRemaining ===
            0
              ? 'Mat-time goal complete 🔥'
              : `${formatMinutes(
                  matMinutesRemaining
                )} remaining`}
          </div>
        </div>

        <h2 className="standalone-heading">
          Overall
        </h2>

        <div className="overall-card">
          <div>
            <strong>
              {
                sessions.length
              }
            </strong>

            <span>
              TOTAL SESSIONS
            </span>
          </div>

          <div className="overall-divider" />

          <div>
            <strong>
              {
                totalRolls
              }
            </strong>

            <span>
              TOTAL ROLLS
            </span>
          </div>
        </div>

        <div className="section-heading">
          <h2>
            Recent sessions
          </h2>

          <Link
            href="/journal"
            className="view-all"
          >
            View all
          </Link>
        </div>

        {recentSessions.length ===
        0 ? (
          <div className="empty-card">
            <div className="empty-emoji">
              🥋
            </div>

            <strong>
              No sessions yet
            </strong>

            <span>
              Your training history will appear here.
            </span>
          </div>
        ) : (
          <div className="recent-list">
            {recentSessions.map(
              (
                session
              ) => (
                <Link
                  href="/journal"
                  className="session-card"
                  key={
                    session.id
                  }
                >
                  <div>
                    <div className="session-title">
                      {formatWeekday(
                        session.date
                      )}
                    </div>

                    <div className="session-meta">
                      <span>
                        {formatShortDate(
                          session.date
                        )}
                      </span>

                      <span className="style-badge">
                        {
                          session.style
                        }
                      </span>
                    </div>
                  </div>

                  <div className="session-right">
                    <strong>
                      {formatDuration(
                        session.durationSeconds
                      )}
                    </strong>

                    <span>
                      {
                        session.rollCount
                      }{' '}
                      rolls ·{' '}
                      {
                        session.submissionsFor
                      }{' '}
                      subs
                    </span>

                    <small>
                      OPEN ›
                    </small>
                  </div>
                </Link>
              )
            )}
          </div>
        )}

        <style jsx>{`
          .home-page {
            width: 100%;
          }

          .home-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 24px;
          }

          .eyebrow {
            color: #777c85;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.16em;
          }

          h1 {
            margin: 5px 0 0;
            color: #ffffff;
            font-size: clamp(30px, 7vw, 42px);
            line-height: 1;
            font-weight: 800;
            letter-spacing: -0.045em;
          }

          .profile-line {
            margin-top: 7px;
            color: #777c85;
            font-size: 12px;
          }

          :global(.profile-button) {
            width: 50px;
            height: 50px;
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #25282e;
            border-radius: 50%;
            background: #17191d;
            font-size: 23px;
          }

          :global(.start-training) {
            min-height: 92px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 20px;
            margin-bottom: 10px;
            border-radius: 22px;
            background: #ffffff;
            color: #090a0c;
            transition: transform 0.15s ease;
          }

          :global(.start-training:active) {
            transform: scale(0.99);
          }

          .start-title {
            font-size: 17px;
            font-weight: 800;
            letter-spacing: 0.04em;
          }

          .start-subtitle {
            margin-top: 5px;
            color: #62666d;
            font-size: 13px;
          }

          .large-arrow {
            font-size: 36px;
            line-height: 1;
          }

          .quick-log {
            width: 100%;
            min-height: 76px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 17px;
            margin-bottom: 12px;
            border: 1px solid #343840;
            border-radius: 20px;
            background: #141619;
            cursor: pointer;
            text-align: left;
          }

          .quick-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .quick-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 13px;
            background: #25282d;
            color: #ffffff;
            font-size: 24px;
          }

          .quick-title {
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.04em;
          }

          .quick-subtitle {
            margin-top: 3px;
            color: #777c85;
            font-size: 12px;
          }

          .quick-arrow {
            color: #777c85;
            font-size: 30px;
          }

          .hr-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 16px;
            margin-bottom: 30px;
            border: 1px solid #23262b;
            border-radius: 18px;
            background: #141619;
          }

          .hr-left {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .heart {
            color: #ff5a60;
            font-size: 27px;
          }

          .hr-title {
            color: #ffffff;
            font-size: 15px;
            font-weight: 800;
          }

          .hr-subtitle {
            margin-top: 3px;
            color: #747982;
            font-size: 12px;
          }

          .offline {
            flex: 0 0 auto;
            padding: 7px 10px;
            border-radius: 10px;
            background: #202328;
            color: #777c85;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.1em;
          }

          .section-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          .section-heading h2,
          .standalone-heading {
            margin: 0 0 12px;
            color: #ffffff;
            font-size: 19px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }

          .section-heading > span {
            margin-bottom: 12px;
            color: #686d75;
            font-size: 12px;
          }

          :global(.view-all) {
            margin-bottom: 12px;
            color: #a5a9b0;
            font-size: 13px;
            font-weight: 700;
          }

          .weekly-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 26px;
          }

          .weekly-card {
            min-width: 0;
            padding: 18px;
            border: 1px solid #23262b;
            border-radius: 18px;
            background: #141619;
          }

          .weekly-card strong {
            display: block;
            overflow: hidden;
            color: #ffffff;
            font-size: 28px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: -0.04em;
            text-overflow: ellipsis;
          }

          .weekly-card span {
            display: block;
            margin-top: 7px;
            color: #727780;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.1em;
          }

          .trends-card,
          .momentum-card {
            margin-bottom: 28px;
            border: 1px solid #23262b;
            border-radius: 20px;
            background: #141619;
          }

          .trends-card {
            display: grid;
            grid-template-columns: 1fr;
            overflow: hidden;
            padding: 0;
          }

          .momentum-card {
            padding: 0 18px;
          }

          :global(.trend-row) {
            min-width: 0;
            padding: 18px;
          }

          :global(.trend-row-top) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          :global(.trend-label) {
            color: #777c85;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.1em;
          }

          :global(.trend-number) {
            margin-top: 5px;
            color: #ffffff;
            font-size: 28px;
            line-height: 1;
            font-weight: 800;
            letter-spacing: -0.04em;
          }

          :global(.trend-badge) {
            min-width: 78px;
            padding: 10px;
            border-radius: 12px;
            background: #25282d;
            color: #c2c5ca;
            text-align: center;
            font-size: 13px;
            font-weight: 800;
          }

          :global(.trend-badge.up) {
            border: 1px solid #236e35;
            background: #153a20;
            color: #45e06f;
          }

          :global(.trend-badge.down) {
            border: 1px solid #773039;
            background: #401c21;
            color: #ff6970;
          }

          :global(.previous-row) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 12px;
            padding-top: 11px;
            border-top: 1px solid #24272c;
            color: #555b63;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.08em;
          }

          :global(.previous-row strong) {
            color: #8b9098;
            font-size: 11px;
            letter-spacing: 0;
          }

          .divider {
            display: none;
          }

          .momentum-row {
            min-height: 82px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            border-bottom: 1px solid #292c32;
          }

          .momentum-row:last-child {
            border-bottom: 0;
          }

          .momentum-name {
            color: #ffffff;
            font-size: 14px;
            font-weight: 800;
          }

          .momentum-detail {
            margin-top: 4px;
            color: #777c85;
            font-size: 10px;
          }

          .momentum-previous {
            margin-top: 4px;
            color: #555b63;
            font-size: 9px;
          }

          .momentum-badge {
            min-width: 58px;
            padding: 10px;
            border-radius: 11px;
            background: #25282d;
            color: #c2c5ca;
            text-align: center;
            font-size: 12px;
            font-weight: 800;
          }

          .momentum-badge.up {
            border: 1px solid #236e35;
            background: #153a20;
            color: #45e06f;
          }

          .momentum-badge.down {
            border: 1px solid #773039;
            background: #401c21;
            color: #ff6970;
          }

          .empty-momentum {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 20px 0;
          }

          .empty-momentum strong {
            color: #ffffff;
            font-size: 14px;
          }

          .empty-momentum span {
            color: #777c85;
            font-size: 11px;
            line-height: 1.55;
          }

          .goal-card {
            padding: 18px;
            margin-bottom: 12px;
            border: 1px solid;
            border-radius: 20px;
          }

          .goal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
          }

          .goal-title {
            color: #ffffff;
            font-size: 17px;
            font-weight: 800;
          }

          .goal-subtitle {
            margin-top: 4px;
            color: #747982;
            font-size: 13px;
          }

          .goal-count {
            font-size: 17px;
            font-weight: 800;
          }

          .progress-background {
            height: 8px;
            margin-top: 18px;
            overflow: hidden;
            border-radius: 999px;
            background: #292c32;
          }

          .progress-fill {
            height: 100%;
            border-radius: 999px;
            transition: width 0.3s ease;
          }

          .goal-footer {
            margin-top: 10px;
            font-size: 12px;
          }

          .standalone-heading {
            margin-top: 28px;
          }

          .overall-card {
            display: grid;
            grid-template-columns: 1fr 1px 1fr;
            align-items: stretch;
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #23262b;
            border-radius: 20px;
            background: #141619;
          }

          .overall-card > div:not(.overall-divider) {
            text-align: center;
          }

          .overall-card strong {
            display: block;
            color: #ffffff;
            font-size: 27px;
            font-weight: 800;
          }

          .overall-card span {
            display: block;
            margin-top: 5px;
            color: #727780;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.1em;
          }

          .overall-divider {
            width: 1px;
            background: #292c32;
          }

          .recent-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          :global(.session-card) {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            padding: 17px;
            border: 1px solid #23262b;
            border-radius: 18px;
            background: #141619;
          }

          .session-title {
            color: #ffffff;
            font-size: 16px;
            font-weight: 800;
          }

          .session-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 6px;
            color: #777c85;
            font-size: 12px;
          }

          .style-badge {
            padding: 3px 7px;
            border: 1px solid #343840;
            border-radius: 8px;
            color: #b8bcc3;
            font-size: 9px;
            font-weight: 800;
          }

          .session-right {
            flex: 0 0 auto;
            text-align: right;
          }

          .session-right strong {
            display: block;
            color: #ffffff;
            font-size: 15px;
          }

          .session-right span {
            display: block;
            margin-top: 5px;
            color: #777c85;
            font-size: 11px;
          }

          .session-right small {
            display: block;
            margin-top: 8px;
            color: #a5a9b0;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.06em;
          }

          .empty-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 28px;
            border: 1px solid #23262b;
            border-radius: 20px;
            background: #141619;
            text-align: center;
          }

          .empty-emoji {
            font-size: 34px;
          }

          .empty-card strong {
            margin-top: 10px;
            color: #ffffff;
            font-size: 17px;
          }

          .empty-card span {
            margin-top: 5px;
            color: #777c85;
            font-size: 13px;
          }

          @media (min-width: 760px) {
            .weekly-grid {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }

            .trends-card {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            :global(.trend-row) {
              border-right: 1px solid #2b2e34;
              border-bottom: 1px solid #2b2e34;
            }

            :global(.trend-row:nth-of-type(2n)) {
              border-right: 0;
            }

            :global(.trend-row:nth-last-of-type(-n + 2)) {
              border-bottom: 0;
            }
          }

          @media (max-width: 759px) {
            :global(.trend-row + .trend-row) {
              border-top: 1px solid #2b2e34;
            }
          }
        `}</style>
      </main>

      <QuickLogModal
        visible={
          quickLogVisible
        }
        onClose={() =>
          setQuickLogVisible(
            false
          )
        }
        onSaved={
          loadData
        }
      />
    </>
  );
}

