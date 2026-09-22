'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  OptionSelector,
  RatingSelector,
} from '@/components/input-controls';

import {
  getTechniques,
  saveSession,
} from '@/lib/storage';

import type {
  Roll,
  RollDifficulty,
  SessionRatings,
  SubmissionCounts,
  Technique,
  TechniqueActivity,
  TechniqueLog,
  TrainingSession,
} from '@/lib/storage';

const BELTS = [
  'White',
  'Blue',
  'Purple',
  'Brown',
  'Black',
  'Unknown',
];

const SUBMISSIONS = [
  'Rear Naked Choke',
  'Armbar',
  'Triangle',
  'Guillotine',
  'Kimura',
  'Americana',
  "D'Arce",
  'Anaconda',
  'Ezekiel',
  'Bow & Arrow',
  'Straight Ankle',
  'Heel Hook',
  'Kneebar',
  'Toe Hold',
  'Other',
];

const TECHNIQUE_ACTIVITIES: TechniqueActivity[] = [
  'Drilled',
  'Attempted',
  'Hit',
];

const ROLL_DIFFICULTIES: RollDifficulty[] = [
  'Easy',
  'Competitive',
  'Hard',
];

function formatTime(
  totalSeconds: number
) {
  const hours =
    Math.floor(
      totalSeconds /
        3600
    );

  const minutes =
    Math.floor(
      (
        totalSeconds %
        3600
      ) /
        60
    );

  const seconds =
    totalSeconds %
    60;

  if (
    hours >
    0
  ) {
    return `${String(
      hours
    ).padStart(
      2,
      '0'
    )}:${String(
      minutes
    ).padStart(
      2,
      '0'
    )}:${String(
      seconds
    ).padStart(
      2,
      '0'
    )}`;
  }

  return `${String(
    minutes
  ).padStart(
    2,
    '0'
  )}:${String(
    seconds
  ).padStart(
    2,
    '0'
  )}`;
}

function confidenceColor(
  level: number
) {
  if (
    level <=
    1
  ) {
    return '#FF453A';
  }

  if (
    level ===
    2
  ) {
    return '#FF9F0A';
  }

  if (
    level ===
    3
  ) {
    return '#FFD60A';
  }

  if (
    level ===
    4
  ) {
    return '#34C759';
  }

  return '#30D158';
}

function difficultyColor(
  difficulty: RollDifficulty
) {
  if (
    difficulty ===
    'Easy'
  ) {
    return '#34C759';
  }

  if (
    difficulty ===
    'Hard'
  ) {
    return '#FF453A';
  }

  return '#FFD60A';
}

function activityColor(
  activity: TechniqueActivity
) {
  if (
    activity ===
    'Drilled'
  ) {
    return '#64D2FF';
  }

  if (
    activity ===
    'Attempted'
  ) {
    return '#FF9F0A';
  }

  return '#34C759';
}

function countSubmissions(
  submissions: SubmissionCounts
) {
  return Object.values(
    submissions
  ).reduce(
    (
      total,
      count
    ) =>
      total +
      count,
    0
  );
}

export default function TrainPage() {
  const [
    style,
    setStyle,
  ] =
    useState<
      'Gi' | 'No-Gi'
    >(
      'No-Gi'
    );

  const [
    sessionActive,
    setSessionActive,
  ] =
    useState(
      false
    );

  const [
    finishingSession,
    setFinishingSession,
  ] =
    useState(
      false
    );

  const [
    sessionSeconds,
    setSessionSeconds,
  ] =
    useState(
      0
    );

  const [
    sessionStartedAt,
    setSessionStartedAt,
  ] =
    useState<
      Date | null
    >(
      null
    );

  const [
    rollActive,
    setRollActive,
  ] =
    useState(
      false
    );

  const [
    rollSeconds,
    setRollSeconds,
  ] =
    useState(
      0
    );

  const [
    rolls,
    setRolls,
  ] =
    useState<
      Roll[]
    >([]);

  const [
    availableTechniques,
    setAvailableTechniques,
  ] =
    useState<
      Technique[]
    >([]);

  const [
    sessionTechniques,
    setSessionTechniques,
  ] =
    useState<
      TechniqueLog[]
    >([]);

  const [
    techniqueModalVisible,
    setTechniqueModalVisible,
  ] =
    useState(
      false
    );

  const [
    selectedTechnique,
    setSelectedTechnique,
  ] =
    useState<
      Technique | null
    >(
      null
    );

  const [
    selectedActivity,
    setSelectedActivity,
  ] =
    useState<TechniqueActivity>(
      'Drilled'
    );

  const [
    techniqueNotes,
    setTechniqueNotes,
  ] =
    useState(
      ''
    );

  const [
    fakeHrConnected,
    setFakeHrConnected,
  ] =
    useState(
      false
    );

  const [
    heartRate,
    setHeartRate,
  ] =
    useState(
      78
    );

  const [
    maxHr,
    setMaxHr,
  ] =
    useState(
      78
    );

  const [
    hrTotal,
    setHrTotal,
  ] =
    useState(
      0
    );

  const [
    hrSamples,
    setHrSamples,
  ] =
    useState(
      0
    );

  const [
    rollModalVisible,
    setRollModalVisible,
  ] =
    useState(
      false
    );

  const [
    pendingRollDuration,
    setPendingRollDuration,
  ] =
    useState(
      0
    );

  const [
    opponentBelt,
    setOpponentBelt,
  ] =
    useState(
      'Unknown'
    );

  const [
    opponentName,
    setOpponentName,
  ] =
    useState(
      ''
    );

  const [
    rollSubsFor,
    setRollSubsFor,
  ] =
    useState<SubmissionCounts>(
      {}
    );

  const [
    rollSubsAgainst,
    setRollSubsAgainst,
  ] =
    useState<SubmissionCounts>(
      {}
    );

  const [
    rollNotes,
    setRollNotes,
  ] =
    useState(
      ''
    );

  const [
    rollDifficulty,
    setRollDifficulty,
  ] =
    useState<RollDifficulty>(
      'Competitive'
    );

  const [
    ratingModalVisible,
    setRatingModalVisible,
  ] =
    useState(
      false
    );

  const [
    energyRating,
    setEnergyRating,
  ] =
    useState(
      3
    );

  const [
    performanceRating,
    setPerformanceRating,
  ] =
    useState(
      3
    );

  const [
    techniqueRating,
    setTechniqueRating,
  ] =
    useState(
      3
    );

  const [
    conditioningRating,
    setConditioningRating,
  ] =
    useState(
      3
    );

  const [
    savingSession,
    setSavingSession,
  ] =
    useState(
      false
    );

  useEffect(() => {
    loadTechniques();
  }, []);

  useEffect(() => {
    if (
      !sessionActive
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setSessionSeconds(
            (
              value
            ) =>
              value +
              1
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    sessionActive,
  ]);

  useEffect(() => {
    if (
      !rollActive
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setRollSeconds(
            (
              value
            ) =>
              value +
              1
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    rollActive,
  ]);

  useEffect(() => {
    if (
      !fakeHrConnected ||
      !sessionActive
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          const base =
            rollActive
              ? 158
              : 132;

          const variation =
            Math.floor(
              Math.random() *
                25
            ) -
            12;

          const nextHr =
            Math.max(
              85,
              Math.min(
                190,
                base +
                  variation
              )
            );

          setHeartRate(
            nextHr
          );

          setMaxHr(
            (
              current
            ) =>
              Math.max(
                current,
                nextHr
              )
          );

          setHrTotal(
            (
              current
            ) =>
              current +
              nextHr
          );

          setHrSamples(
            (
              current
            ) =>
              current +
              1
          );
        },
        1500
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    fakeHrConnected,
    rollActive,
    sessionActive,
  ]);

  async function loadTechniques() {
    const data =
      await getTechniques();

    setAvailableTechniques(
      data
    );
  }

  const averageHr =
    useMemo(
      () => {
        if (
          hrSamples ===
          0
        ) {
          return 0;
        }

        return Math.round(
          hrTotal /
            hrSamples
        );
      },
      [
        hrSamples,
        hrTotal,
      ]
    );

  const totalSubsFor =
    useMemo(
      () =>
        rolls.reduce(
          (
            total,
            roll
          ) =>
            total +
            countSubmissions(
              roll.submissionsFor
            ),
          0
        ),
      [
        rolls,
      ]
    );

  const totalSubsAgainst =
    useMemo(
      () =>
        rolls.reduce(
          (
            total,
            roll
          ) =>
            total +
            countSubmissions(
              roll.submissionsAgainst
            ),
          0
        ),
      [
        rolls,
      ]
    );

  function addSubmission(
    submission: string,
    type:
      | 'for'
      | 'against'
  ) {
    const setter =
      type ===
      'for'
        ? setRollSubsFor
        : setRollSubsAgainst;

    setter(
      (
        current
      ) => ({
        ...current,

        [submission]:
          (
            current[
              submission
            ] ||
            0
          ) +
          1,
      })
    );
  }

  function removeSubmission(
    submission: string,
    type:
      | 'for'
      | 'against'
  ) {
    const setter =
      type ===
      'for'
        ? setRollSubsFor
        : setRollSubsAgainst;

    setter(
      (
        current
      ) => {
        const currentCount =
          current[
            submission
          ] ||
          0;

        if (
          currentCount <=
          1
        ) {
          const updated =
            {
              ...current,
            };

          delete updated[
            submission
          ];

          return updated;
        }

        return {
          ...current,

          [submission]:
            currentCount -
            1,
        };
      }
    );
  }

  function startSession() {
    const now =
      new Date();

    setSessionActive(
      true
    );

    setSessionStartedAt(
      now
    );

    setFinishingSession(
      false
    );

    setSessionSeconds(
      0
    );

    setRollActive(
      false
    );

    setRollSeconds(
      0
    );

    setRolls(
      []
    );

    setSessionTechniques(
      []
    );

    setHeartRate(
      78
    );

    setMaxHr(
      78
    );

    setHrTotal(
      0
    );

    setHrSamples(
      0
    );

    setRollDifficulty(
      'Competitive'
    );

    setEnergyRating(
      3
    );

    setPerformanceRating(
      3
    );

    setTechniqueRating(
      3
    );

    setConditioningRating(
      3
    );

    loadTechniques();
  }

  function startRoll() {
    if (
      !sessionActive ||
      finishingSession
    ) {
      return;
    }

    setRollSeconds(
      0
    );

    setRollActive(
      true
    );
  }

  function endRoll() {
    if (
      !rollActive
    ) {
      return;
    }

    setPendingRollDuration(
      Math.max(
        1,
        rollSeconds
      )
    );

    setRollActive(
      false
    );

    setOpponentBelt(
      'Unknown'
    );

    setOpponentName(
      ''
    );

    setRollSubsFor(
      {}
    );

    setRollSubsAgainst(
      {}
    );

    setRollNotes(
      ''
    );

    setRollDifficulty(
      'Competitive'
    );

    setRollModalVisible(
      true
    );
  }

  function saveRoll() {
    const newRoll: Roll =
      {
        id:
          `${Date.now()}-${Math.random()}`,

        durationSeconds:
          pendingRollDuration,

        opponentName:
          opponentName.trim(),

        opponentBelt,

        submissionsFor:
          rollSubsFor,

        submissionsAgainst:
          rollSubsAgainst,

        notes:
          rollNotes.trim(),

        difficulty:
          rollDifficulty,
      };

    setRolls(
      (
        current
      ) => [
        ...current,
        newRoll,
      ]
    );

    setRollModalVisible(
      false
    );

    setRollSeconds(
      0
    );
  }

  function cancelRollSave() {
    const confirmed =
      window.confirm(
        'Discard this roll? It will not be added to the session.'
      );

    if (
      !confirmed
    ) {
      return;
    }

    setRollModalVisible(
      false
    );

    setRollSeconds(
      0
    );
  }

  function openTechniqueLogger() {
    if (
      finishingSession
    ) {
      return;
    }

    if (
      availableTechniques.length ===
      0
    ) {
      window.alert(
        'No techniques yet. Add techniques from Profile → My Techniques first.'
      );

      return;
    }

    setSelectedTechnique(
      null
    );

    setSelectedActivity(
      'Drilled'
    );

    setTechniqueNotes(
      ''
    );

    setTechniqueModalVisible(
      true
    );
  }

  function saveTechniqueLog() {
    if (
      !selectedTechnique
    ) {
      window.alert(
        'Choose a technique first.'
      );

      return;
    }

    const log: TechniqueLog =
      {
        id:
          `${Date.now()}-${Math.random()}`,

        techniqueId:
          selectedTechnique.id,

        techniqueName:
          selectedTechnique.name,

        category:
          selectedTechnique.category,

        activity:
          selectedActivity,

        notes:
          techniqueNotes.trim(),

        createdAt:
          new Date().toISOString(),
      };

    setSessionTechniques(
      (
        current
      ) => [
        ...current,
        log,
      ]
    );

    setTechniqueModalVisible(
      false
    );

    setSelectedTechnique(
      null
    );

    setTechniqueNotes(
      ''
    );
  }

  function finishSession() {
    if (
      !sessionActive
    ) {
      return;
    }

    if (
      rollActive
    ) {
      window.alert(
        'End the current roll before finishing your session.'
      );

      return;
    }

    setFinishingSession(
      true
    );

    setEnergyRating(
      3
    );

    setPerformanceRating(
      3
    );

    setTechniqueRating(
      3
    );

    setConditioningRating(
      3
    );

    setRatingModalVisible(
      true
    );
  }

  function cancelSessionRating() {
    setRatingModalVisible(
      false
    );

    setFinishingSession(
      false
    );
  }

  async function saveFinishedSession() {
    if (
      savingSession
    ) {
      return;
    }

    const ratings: SessionRatings =
      {
        energy:
          energyRating,

        performance:
          performanceRating,

        technique:
          techniqueRating,

        conditioning:
          conditioningRating,
      };

    try {
      setSavingSession(
        true
      );

      const startedAt =
        sessionStartedAt ??
        new Date();

      const session: TrainingSession =
        {
          id:
            Date.now().toString(),

          date:
            startedAt.toISOString(),

          style,

          durationSeconds:
            sessionSeconds,

          rollCount:
            rolls.length,

          rolls,

          submissionsFor:
            totalSubsFor,

          submissionsAgainst:
            totalSubsAgainst,

          averageHr:
            fakeHrConnected
              ? averageHr
              : 0,

          maxHr:
            fakeHrConnected &&
            hrSamples
              ? maxHr
              : 0,

          techniques:
            sessionTechniques.map(
              (
                log
              ) => ({
                ...log,
                createdAt:
                  startedAt.toISOString(),
              })
            ),

          ratings,
        };

      await saveSession(
        session
      );

      setRatingModalVisible(
        false
      );

      setSessionActive(
        false
      );

      setSessionStartedAt(
        null
      );

      setFinishingSession(
        false
      );

      setRollActive(
        false
      );

      setSavingSession(
        false
      );

      window.alert(
        `${style} session saved with ${rolls.length} ${
          rolls.length ===
          1
            ? 'roll'
            : 'rolls'
        } and ${sessionTechniques.length} ${
          sessionTechniques.length ===
          1
            ? 'technique log'
            : 'technique logs'
        }.`
      );
    } catch (
      error
    ) {
      console.error(
        'SAVE ERROR:',
        error
      );

      setSavingSession(
        false
      );

      const message =
        error instanceof Error
          ? error.message
          : 'Unknown save error.';

      window.alert(
        `Could not save this session. ${message}`
      );
    }
  }

  return (
    <>
      <main className="train-page">
        <header className="train-header">
          <div>
            <div className="eyebrow">
              LIVE TRAINING
            </div>

            <h1>
              Train
            </h1>
          </div>

          <div
            className={
              sessionActive
                ? 'status-pill live'
                : 'status-pill'
            }
          >
            {sessionActive
              ? 'LIVE'
              : 'READY'}
          </div>
        </header>

        {!sessionActive ? (
          <div className="pre-session">
            <OptionSelector
              label="TRAINING STYLE"
              value={
                style
              }
              options={[
                {
                  label:
                    'Gi',
                  value:
                    'Gi',
                },
                {
                  label:
                    'No-Gi',
                  value:
                    'No-Gi',
                },
              ]}
              onChange={(
                value
              ) =>
                setStyle(
                  value as
                    | 'Gi'
                    | 'No-Gi'
                )
              }
            />

            <div
              className={
                fakeHrConnected
                  ? 'hrm-card connected'
                  : 'hrm-card'
              }
            >
              <div>
                <div className="card-eyebrow">
                  SIMULATED HEART RATE
                </div>

                <div className="card-title">
                  HR Monitor
                </div>

                <div
                  className={
                    fakeHrConnected
                      ? 'card-muted connected'
                      : 'card-muted'
                  }
                >
                  {fakeHrConnected
                    ? 'Connected'
                    : 'Not connected'}
                </div>
              </div>

              <button
                type="button"
                className={
                  fakeHrConnected
                    ? 'secondary-button connected'
                    : 'secondary-button'
                }
                onClick={() =>
                  setFakeHrConnected(
                    (
                      value
                    ) =>
                      !value
                  )
                }
              >
                {fakeHrConnected
                  ? 'Disconnect'
                  : 'Connect'}
              </button>
            </div>

            <div className="hr-note">
              This currently uses the same simulated HR behavior as the original app. Real Bluetooth HR can be added separately later.
            </div>

            <button
              type="button"
              className="start-button"
              onClick={
                startSession
              }
            >
              <strong>
                START SESSION
              </strong>

              <span>
                {style} training
              </span>
            </button>
          </div>
        ) : (
          <>
            <div className="timer-card">
              <div className="timer-label">
                SESSION TIME
              </div>

              <div className="session-timer">
                {formatTime(
                  sessionSeconds
                )}
              </div>

              <div className="session-meta">
                <span>
                  {style}
                </span>

                <span>
                  •
                </span>

                <span>
                  {
                    rolls.length
                  }{' '}
                  {rolls.length ===
                  1
                    ? 'roll'
                    : 'rolls'}
                </span>
              </div>
            </div>

            <div className="live-hr-card">
              <div className="card-eyebrow">
                LIVE HEART RATE
              </div>

              <div className="hr-value-row">
                <span className="heart">
                  ♥
                </span>

                <strong>
                  {fakeHrConnected
                    ? heartRate
                    : '--'}
                </strong>

                <span className="bpm">
                  BPM
                </span>
              </div>

              <div className="hr-stats">
                <div>
                  <span>
                    AVG
                  </span>

                  <strong>
                    {averageHr ||
                      '--'}
                  </strong>
                </div>

                <div>
                  <span>
                    MAX
                  </span>

                  <strong>
                    {hrSamples
                      ? maxHr
                      : '--'}
                  </strong>
                </div>

                <div>
                  <span>
                    HR MONITOR
                  </span>

                  <strong>
                    {fakeHrConnected
                      ? 'Connected'
                      : 'Offline'}
                  </strong>
                </div>
              </div>
            </div>

            <div
              className={
                rollActive
                  ? 'roll-card active'
                  : 'roll-card'
              }
            >
              <div className="card-eyebrow">
                CURRENT ROLL
              </div>

              <div
                className={
                  rollActive
                    ? 'roll-timer active'
                    : 'roll-timer'
                }
              >
                {formatTime(
                  rollSeconds
                )}
              </div>

              <div className="roll-status">
                {rollActive
                  ? 'Roll in progress'
                  : 'Start when sparring begins'}
              </div>

              {!rollActive ? (
                <button
                  type="button"
                  className="roll-button"
                  onClick={
                    startRoll
                  }
                >
                  START ROLL
                </button>
              ) : (
                <button
                  type="button"
                  className="roll-button stop"
                  onClick={
                    endRoll
                  }
                >
                  END ROLL
                </button>
              )}
            </div>

            <div className="technique-section">
              <div className="section-header-row">
                <div>
                  <h2>
                    Techniques
                  </h2>

                  <p>
                    Log what you drilled or used
                  </p>
                </div>

                <button
                  type="button"
                  className="small-action"
                  onClick={
                    openTechniqueLogger
                  }
                >
                  + Log
                </button>
              </div>

              {sessionTechniques.length ===
              0 ? (
                <div className="empty-line">
                  No techniques logged yet.
                </div>
              ) : (
                <div className="technique-log-list">
                  {sessionTechniques.map(
                    (
                      item
                    ) => (
                      <div
                        className="technique-log"
                        key={
                          item.id
                        }
                      >
                        <div>
                          <strong>
                            {
                              item.techniqueName
                            }
                          </strong>

                          <span>
                            {
                              item.category
                            }
                          </span>
                        </div>

                        <div
                          className="activity-badge"
                          style={{
                            color:
                              activityColor(
                                item.activity
                              ),

                            borderColor:
                              activityColor(
                                item.activity
                              ),
                          }}
                        >
                          <span
                            className="activity-dot"
                            style={{
                              background:
                                activityColor(
                                  item.activity
                                ),
                            }}
                          />

                          {
                            item.activity
                          }
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {rolls.length >
            0 ? (
              <section className="roll-history">
                <h2>
                  Rolls
                </h2>

                <div className="roll-list">
                  {rolls.map(
                    (
                      roll,
                      index
                    ) => (
                      <div
                        className="saved-roll"
                        style={{
                          borderLeftColor:
                            difficultyColor(
                              roll.difficulty ||
                                'Competitive'
                            ),
                        }}
                        key={
                          roll.id
                        }
                      >
                        <div>
                          <strong>
                            {roll.opponentName ||
                              `Roll ${index + 1}`}
                          </strong>

                          {roll.opponentName ? (
                            <small>
                              Roll{' '}
                              {
                                index +
                                1
                              }
                            </small>
                          ) : null}

                          <span>
                            {
                              roll.opponentBelt
                            }{' '}
                            belt
                          </span>

                          <em
                            style={{
                              color:
                                difficultyColor(
                                  roll.difficulty ||
                                    'Competitive'
                                ),
                            }}
                          >
                            {roll.difficulty ||
                              'Competitive'}
                          </em>
                        </div>

                        <div className="saved-roll-right">
                          <strong>
                            {formatTime(
                              roll.durationSeconds
                            )}
                          </strong>

                          <span>
                            {countSubmissions(
                              roll.submissionsFor
                            )}{' '}
                            for ·{' '}
                            {countSubmissions(
                              roll.submissionsAgainst
                            )}{' '}
                            against
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            ) : null}

            <div className="session-summary">
              <div>
                <span>
                  SUBMISSIONS
                </span>

                <strong className="positive">
                  {
                    totalSubsFor
                  }
                </strong>
              </div>

              <div>
                <span>
                  CAUGHT
                </span>

                <strong className="negative">
                  {
                    totalSubsAgainst
                  }
                </strong>
              </div>

              <div>
                <span>
                  ROLLS
                </span>

                <strong>
                  {
                    rolls.length
                  }
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="finish-button"
              onClick={
                finishSession
              }
            >
              FINISH SESSION
            </button>
          </>
        )}
      </main>

      {rollModalVisible ? (
        <div className="modal-root">
          <div className="modal-backdrop" />

          <div className="modal-panel">
            <div className="modal-scroll">
              <div className="modal-eyebrow">
                ROLL COMPLETE
              </div>

              <h2 className="modal-title">
                Log this roll
              </h2>

              <div className="modal-duration">
                {formatTime(
                  pendingRollDuration
                )}
              </div>

              <div className="field-block">
                <div className="field-title">
                  Opponent name
                </div>

                <input
                  className="text-input"
                  value={
                    opponentName
                  }
                  onChange={(
                    event
                  ) =>
                    setOpponentName(
                      event.target.value
                    )
                  }
                  placeholder="Optional — e.g. Ardit"
                />

                <div className="input-help">
                  Leave blank if you do not want to track their name.
                </div>
              </div>

              <OptionSelector
                label="OPPONENT BELT"
                value={
                  opponentBelt
                }
                options={
                  BELTS.map(
                    (
                      belt
                    ) => ({
                      label:
                        belt,

                      value:
                        belt,
                    })
                  )
                }
                onChange={
                  setOpponentBelt
                }
              />

              <OptionSelector
                label="ROLL DIFFICULTY"
                value={
                  rollDifficulty
                }
                options={
                  ROLL_DIFFICULTIES.map(
                    (
                      difficulty
                    ) => ({
                      label:
                        difficulty,

                      value:
                        difficulty,
                    })
                  )
                }
                onChange={(
                  value
                ) =>
                  setRollDifficulty(
                    value as
                      RollDifficulty
                  )
                }
              />

              <div className="field-title submission-main-title">
                Submissions
              </div>

              <div className="submission-heading for">
                YOU GOT
              </div>

              <div className="submission-grid">
                {SUBMISSIONS.map(
                  (
                    submission
                  ) => {
                    const count =
                      rollSubsFor[
                        submission
                      ] ||
                      0;

                    return (
                      <div
                        className="submission-item"
                        key={`for-${submission}`}
                      >
                        <button
                          type="button"
                          className={
                            count >
                            0
                              ? 'submission-button active-for'
                              : 'submission-button'
                          }
                          onClick={() =>
                            addSubmission(
                              submission,
                              'for'
                            )
                          }
                        >
                          {
                            submission
                          }

                          {count >
                          0
                            ? ` ×${count}`
                            : ''}
                        </button>

                        {count >
                        0 ? (
                          <button
                            type="button"
                            className="minus-button"
                            onClick={() =>
                              removeSubmission(
                                submission,
                                'for'
                              )
                            }
                          >
                            −
                          </button>
                        ) : null}
                      </div>
                    );
                  }
                )}
              </div>

              <div className="submission-heading against">
                GOT CAUGHT WITH
              </div>

              <div className="submission-grid">
                {SUBMISSIONS.map(
                  (
                    submission
                  ) => {
                    const count =
                      rollSubsAgainst[
                        submission
                      ] ||
                      0;

                    return (
                      <div
                        className="submission-item"
                        key={`against-${submission}`}
                      >
                        <button
                          type="button"
                          className={
                            count >
                            0
                              ? 'submission-button active-against'
                              : 'submission-button'
                          }
                          onClick={() =>
                            addSubmission(
                              submission,
                              'against'
                            )
                          }
                        >
                          {
                            submission
                          }

                          {count >
                          0
                            ? ` ×${count}`
                            : ''}
                        </button>

                        {count >
                        0 ? (
                          <button
                            type="button"
                            className="minus-button"
                            onClick={() =>
                              removeSubmission(
                                submission,
                                'against'
                              )
                            }
                          >
                            −
                          </button>
                        ) : null}
                      </div>
                    );
                  }
                )}
              </div>

              <div className="field-block">
                <div className="field-title">
                  Notes
                </div>

                <textarea
                  className="textarea"
                  value={
                    rollNotes
                  }
                  onChange={(
                    event
                  ) =>
                    setRollNotes(
                      event.target.value
                    )
                  }
                  placeholder="What happened in this roll?"
                />
              </div>

              <button
                type="button"
                className="modal-primary"
                onClick={
                  saveRoll
                }
              >
                SAVE ROLL
              </button>

              <button
                type="button"
                className="modal-discard"
                onClick={
                  cancelRollSave
                }
              >
                Discard roll
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {ratingModalVisible ? (
        <div className="modal-root">
          <div className="modal-backdrop" />

          <div className="modal-panel">
            <div className="modal-scroll">
              <button
                type="button"
                className="modal-back"
                onClick={
                  cancelSessionRating
                }
              >
                Back
              </button>

              <div className="modal-eyebrow">
                SESSION COMPLETE
              </div>

              <h2 className="modal-title">
                How was training?
              </h2>

              <p className="modal-description">
                Rate how you felt today. These ratings help show patterns over time.
              </p>

              <div className="rating-stack">
                <RatingSelector
                  label="Energy"
                  value={
                    energyRating
                  }
                  onChange={
                    setEnergyRating
                  }
                />

                <RatingSelector
                  label="Performance"
                  value={
                    performanceRating
                  }
                  onChange={
                    setPerformanceRating
                  }
                />

                <RatingSelector
                  label="Technique"
                  value={
                    techniqueRating
                  }
                  onChange={
                    setTechniqueRating
                  }
                />

                <RatingSelector
                  label="Conditioning"
                  value={
                    conditioningRating
                  }
                  onChange={
                    setConditioningRating
                  }
                />
              </div>

              <button
                type="button"
                className="modal-primary"
                disabled={
                  savingSession
                }
                onClick={
                  saveFinishedSession
                }
              >
                {savingSession
                  ? 'SAVING...'
                  : 'SAVE SESSION'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {techniqueModalVisible ? (
        <div className="modal-root">
          <div className="modal-backdrop" />

          <div className="modal-panel">
            <div className="modal-scroll">
              <button
                type="button"
                className="modal-back"
                onClick={() =>
                  setTechniqueModalVisible(
                    false
                  )
                }
              >
                Cancel
              </button>

              <div className="modal-eyebrow">
                TRAINING LOG
              </div>

              <h2 className="modal-title">
                Log technique
              </h2>

              <p className="modal-description">
                Choose what you worked on during this session.
              </p>

              <div className="field-title">
                Technique
              </div>

              <div className="technique-choice-list">
                {availableTechniques.map(
                  (
                    technique
                  ) => {
                    const selected =
                      selectedTechnique?.id ===
                      technique.id;

                    return (
                      <button
                        type="button"
                        className={
                          selected
                            ? 'technique-choice selected'
                            : 'technique-choice'
                        }
                        key={
                          technique.id
                        }
                        onClick={() =>
                          setSelectedTechnique(
                            (
                              current
                            ) =>
                              current?.id ===
                              technique.id
                                ? null
                                : technique
                          )
                        }
                      >
                        <div>
                          <strong>
                            {
                              technique.name
                            }
                          </strong>

                          <span>
                            {
                              technique.category
                            }
                          </span>
                        </div>

                        <div
                          className="confidence"
                          style={{
                            color:
                              confidenceColor(
                                technique.confidence
                              ),
                          }}
                        >
                          ●{' '}
                          {
                            technique.confidence
                          }
                          /5
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <OptionSelector
                label="ACTIVITY"
                value={
                  selectedActivity
                }
                options={
                  TECHNIQUE_ACTIVITIES.map(
                    (
                      activity
                    ) => ({
                      label:
                        activity,

                      value:
                        activity,
                    })
                  )
                }
                onChange={(
                  value
                ) =>
                  setSelectedActivity(
                    value as
                      TechniqueActivity
                  )
                }
              />

              <div className="field-block">
                <div className="field-title">
                  Notes
                </div>

                <textarea
                  className="textarea"
                  value={
                    techniqueNotes
                  }
                  onChange={(
                    event
                  ) =>
                    setTechniqueNotes(
                      event.target.value
                    )
                  }
                  placeholder="Optional note about what worked..."
                />
              </div>

              <button
                type="button"
                className="modal-primary"
                onClick={
                  saveTechniqueLog
                }
              >
                SAVE TECHNIQUE LOG
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .train-page {
          width: 100%;
        }

        .train-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 28px;
        }

        .eyebrow,
        .card-eyebrow,
        .modal-eyebrow {
          color: #777c85;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        h1 {
          margin: 4px 0 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .status-pill {
          padding: 8px 12px;
          border: 1px solid #2a2d33;
          border-radius: 999px;
          background: #17191d;
          color: #777c85;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .status-pill.live {
          border-color: #34c759;
          background: rgba(52, 199, 89, 0.12);
          color: #34c759;
        }

        .pre-session {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hrm-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px;
          border: 1px solid #23262b;
          border-radius: 20px;
          background: #141619;
        }

        .hrm-card.connected {
          border-color: rgba(52, 199, 89, 0.55);
          background: rgba(52, 199, 89, 0.06);
        }

        .card-title {
          margin-top: 5px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 850;
        }

        .card-muted {
          margin-top: 4px;
          color: #777c85;
          font-size: 13px;
        }

        .card-muted.connected {
          color: #34c759;
          font-weight: 800;
        }

        .secondary-button {
          min-height: 42px;
          padding: 0 15px;
          border: 1px solid #343840;
          border-radius: 12px;
          background: transparent;
          color: #ffffff;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .secondary-button.connected {
          border-color: rgba(52, 199, 89, 0.65);
          background: rgba(52, 199, 89, 0.1);
          color: #34c759;
        }

        .hr-note {
          margin-top: -7px;
          color: #555b63;
          font-size: 10px;
          line-height: 1.5;
        }

        .start-button {
          min-height: 74px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: #ffffff;
          color: #090a0c;
          cursor: pointer;
        }

        .start-button strong {
          font-size: 17px;
          font-weight: 950;
          letter-spacing: 0.04em;
        }

        .start-button span {
          margin-top: 4px;
          color: #62666d;
          font-size: 12px;
        }

        .timer-card {
          padding: 24px 18px;
          margin-bottom: 14px;
          border: 1px solid #23262b;
          border-radius: 24px;
          background: #111316;
          text-align: center;
        }

        .timer-label {
          color: #777c85;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.15em;
        }

        .session-timer {
          margin-top: 5px;
          color: #ffffff;
          font-size: clamp(48px, 12vw, 70px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.05em;
          font-variant-numeric: tabular-nums;
        }

        .session-meta {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin-top: 10px;
          color: #777c85;
          font-size: 13px;
        }

        .live-hr-card {
          padding: 18px;
          margin-bottom: 14px;
          border: 1px solid rgba(255, 69, 58, 0.26);
          border-radius: 20px;
          background: rgba(255, 69, 58, 0.055);
        }

        .hr-value-row {
          display: flex;
          align-items: baseline;
          margin-top: 5px;
        }

        .heart {
          margin-right: 8px;
          color: #ff453a;
          font-size: 23px;
        }

        .hr-value-row strong {
          color: #ffffff;
          font-size: 46px;
          font-weight: 950;
        }

        .bpm {
          margin-left: 6px;
          color: #777c85;
          font-size: 12px;
        }

        .hr-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 18px;
        }

        .hr-stats > div {
          min-width: 0;
        }

        .hr-stats span {
          display: block;
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
        }

        .hr-stats strong {
          display: block;
          margin-top: 4px;
          overflow: hidden;
          color: #ffffff;
          font-size: 14px;
          text-overflow: ellipsis;
        }

        .roll-card {
          padding: 18px;
          margin-bottom: 18px;
          border: 1px solid #23262b;
          border-radius: 20px;
          background: #141619;
          text-align: center;
        }

        .roll-card.active {
          border-color: rgba(255, 159, 10, 0.55);
          background: rgba(255, 159, 10, 0.055);
        }

        .roll-timer {
          margin-top: 5px;
          color: #777c85;
          font-size: 46px;
          line-height: 1;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
        }

        .roll-timer.active {
          color: #ff9f0a;
        }

        .roll-status {
          margin: 8px 0 18px;
          color: #777c85;
          font-size: 13px;
        }

        .roll-button {
          width: 100%;
          min-height: 52px;
          border-radius: 15px;
          background: #ffffff;
          color: #090a0c;
          font-weight: 950;
          cursor: pointer;
        }

        .roll-button.stop {
          background: #ff453a;
          color: #ffffff;
        }

        .technique-section {
          padding: 18px;
          margin-bottom: 26px;
          border: 1px solid #23262b;
          border-radius: 20px;
          background: #141619;
        }

        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .section-header-row h2,
        .roll-history h2 {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
          font-weight: 850;
        }

        .section-header-row p {
          margin: 4px 0 0;
          color: #777c85;
          font-size: 11px;
        }

        .small-action {
          min-height: 38px;
          padding: 0 13px;
          border: 1px solid #343840;
          border-radius: 11px;
          background: transparent;
          color: #ffffff;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .empty-line {
          color: #666b73;
          font-size: 12px;
        }

        .technique-log {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 12px 0;
          border-top: 1px solid #292c32;
        }

        .technique-log strong,
        .technique-log span {
          display: block;
        }

        .technique-log strong {
          color: #ffffff;
          font-size: 14px;
        }

        .technique-log span {
          margin-top: 3px;
          color: #777c85;
          font-size: 10px;
        }

        .activity-badge {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 9px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 900;
        }

        .activity-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .roll-history {
          margin-bottom: 26px;
        }

        .roll-history h2 {
          margin-bottom: 12px;
        }

        .roll-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .saved-roll {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 14px;
          border: 1px solid #23262b;
          border-left: 3px solid;
          border-radius: 16px;
          background: #141619;
        }

        .saved-roll strong,
        .saved-roll span,
        .saved-roll small,
        .saved-roll em {
          display: block;
        }

        .saved-roll strong {
          color: #ffffff;
          font-size: 14px;
        }

        .saved-roll small,
        .saved-roll span {
          margin-top: 4px;
          color: #777c85;
          font-size: 10px;
        }

        .saved-roll em {
          margin-top: 5px;
          font-size: 10px;
          font-style: normal;
          font-weight: 900;
        }

        .saved-roll-right {
          flex: 0 0 auto;
          text-align: right;
        }

        .saved-roll-right strong {
          font-size: 14px;
        }

        .session-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 18px;
          margin-bottom: 14px;
          border: 1px solid #23262b;
          border-radius: 20px;
          background: #141619;
          text-align: center;
        }

        .session-summary span {
          display: block;
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .session-summary strong {
          display: block;
          margin-top: 5px;
          color: #ffffff;
          font-size: 26px;
          font-weight: 950;
        }

        .session-summary .positive {
          color: #34c759;
        }

        .session-summary .negative {
          color: #ff453a;
        }

        .finish-button {
          width: 100%;
          min-height: 58px;
          border: 1px solid #343840;
          border-radius: 18px;
          background: #17191d;
          color: #ffffff;
          font-size: 14px;
          font-weight: 950;
          letter-spacing: 0.05em;
          cursor: pointer;
        }

        .modal-root {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 12px;
        }

        .modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .modal-panel {
          position: relative;
          z-index: 1;
          width: min(100%, 720px);
          max-height: calc(100vh - 24px);
          overflow: hidden;
          border: 1px solid #292d33;
          border-radius: 24px 24px 18px 18px;
          background: #090a0c;
        }

        .modal-scroll {
          max-height: calc(100vh - 24px);
          overflow-y: auto;
          padding: 24px 20px 44px;
        }

        .modal-title {
          margin: 5px 0 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .modal-duration {
          margin: 18px 0 26px;
          color: #ffffff;
          font-size: 46px;
          font-weight: 950;
          font-variant-numeric: tabular-nums;
        }

        .modal-description {
          margin: 10px 0 24px;
          color: #777c85;
          font-size: 13px;
          line-height: 1.55;
        }

        .modal-back {
          margin-bottom: 20px;
          padding: 0;
          background: transparent;
          color: #ffffff;
          font-size: 15px;
          font-weight: 850;
          cursor: pointer;
        }

        .field-block {
          margin-top: 24px;
        }

        .field-title {
          margin-bottom: 10px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 850;
        }

        .text-input,
        .textarea {
          width: 100%;
          border: 1px solid #23262b;
          border-radius: 16px;
          background: #141619;
          color: #ffffff;
          font: inherit;
          outline: none;
        }

        .text-input {
          min-height: 54px;
          padding: 0 15px;
          font-size: 15px;
        }

        .textarea {
          min-height: 120px;
          padding: 15px;
          resize: vertical;
          font-size: 14px;
        }

        .text-input:focus,
        .textarea:focus {
          border-color: #4b5059;
        }

        .input-help {
          margin-top: 7px;
          color: #555b63;
          font-size: 10px;
        }

        .submission-main-title {
          margin-top: 28px;
        }

        .submission-heading {
          margin: 16px 0 10px;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.1em;
        }

        .submission-heading.for {
          color: #34c759;
        }

        .submission-heading.against {
          color: #ff453a;
        }

        .submission-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 18px;
        }

        .submission-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .submission-button {
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid #343840;
          border-radius: 12px;
          background: #141619;
          color: #ffffff;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .submission-button.active-for {
          border-color: #34c759;
          background: #12331b;
          color: #34c759;
        }

        .submission-button.active-against {
          border-color: #ff453a;
          background: #371719;
          color: #ff453a;
        }

        .minus-button {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #292c32;
          color: #ffffff;
          font-size: 18px;
          cursor: pointer;
        }

        .modal-primary {
          width: 100%;
          min-height: 56px;
          margin-top: 26px;
          border-radius: 18px;
          background: #ffffff;
          color: #090a0c;
          font-size: 14px;
          font-weight: 950;
          letter-spacing: 0.04em;
          cursor: pointer;
        }

        .modal-primary:disabled {
          opacity: 0.5;
        }

        .modal-discard {
          width: 100%;
          min-height: 48px;
          margin-top: 8px;
          background: transparent;
          color: #ff6970;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .rating-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .technique-choice-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 22px;
        }

        .technique-choice {
          width: 100%;
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 13px 14px;
          border: 1px solid #23262b;
          border-radius: 15px;
          background: #141619;
          color: #ffffff;
          text-align: left;
          cursor: pointer;
        }

        .technique-choice.selected {
          background: #ffffff;
          color: #090a0c;
        }

        .technique-choice strong,
        .technique-choice span {
          display: block;
        }

        .technique-choice strong {
          font-size: 14px;
        }

        .technique-choice span {
          margin-top: 4px;
          color: #777c85;
          font-size: 9px;
        }

        .technique-choice.selected span {
          color: #62666d;
        }

        .confidence {
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 900;
        }


        @media (max-width: 759px) {
          .train-page {
            width: 100%;
            min-width: 0;
          }

          .train-header,
          .section-header-row,
          .saved-roll,
          .technique-log {
            min-width: 0;
          }

          .modal-root {
            align-items: flex-end;
            padding:
              8px
              8px
              max(
                8px,
                env(safe-area-inset-bottom)
              );
          }

          .modal-panel {
            width: 100%;
            max-height:
              calc(
                100dvh -
                16px -
                env(safe-area-inset-bottom)
              );
            border-radius:
              22px
              22px
              16px
              16px;
          }

          .modal-scroll {
            max-height:
              calc(
                100dvh -
                24px -
                env(safe-area-inset-bottom)
              );
            padding:
              20px
              16px
              calc(
                28px +
                env(safe-area-inset-bottom)
              );
            overscroll-behavior:
              contain;
          }

          .modal-title {
            font-size: 30px;
          }

          .modal-duration {
            font-size: 40px;
          }

          .rating-stack {
            gap: 16px;
          }

          .session-summary {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
            gap: 6px;
            padding: 15px 10px;
          }

          .session-summary span {
            font-size: 8px;
            letter-spacing: 0.04em;
          }

          .session-summary strong {
            font-size: 23px;
          }

          .saved-roll {
            align-items: flex-start;
          }

          .saved-roll > div:first-child {
            min-width: 0;
          }

          .saved-roll-right {
            min-width: 82px;
          }

          .submission-grid {
            display: grid;
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
            gap: 8px;
          }

          .submission-item {
            min-width: 0;
          }

          .submission-button {
            width: 100%;
            min-width: 0;
            height: 44px;
            padding: 0 9px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .minus-button {
            flex: 0 0 34px;
          }

          .modal-primary {
            position: sticky;
            bottom: 0;
            z-index: 3;
            box-shadow:
              0 -12px 24px
              rgba(
                9,
                10,
                12,
                0.92
              );
          }
        }

        @media (min-width: 760px) {
          .modal-root {
            align-items: center;
            padding: 30px;
          }

          .modal-panel {
            max-height: calc(100vh - 60px);
            border-radius: 24px;
          }

          .modal-scroll {
            max-height: calc(100vh - 60px);
          }
        }
      `}</style>
    </>
  );
}


