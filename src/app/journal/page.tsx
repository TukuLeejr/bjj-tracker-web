'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  DateTimePickerSheet,
  NumberStepper,
  OptionSelector,
  PickerField,
  RatingSelector,
} from '@/components/input-controls';

import {
  deleteSession,
  getSessions,
  toggleSessionFavorite,
  updateSession,
} from '@/lib/storage';

import type {
  Roll,
  RollDifficulty,
  SessionRatings,
  SubmissionCounts,
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

const TIME_FILTERS = [
  'All',
  'This week',
  'This month',
  'Last 30 days',
] as const;

type TimeFilter =
  (typeof TIME_FILTERS)[number];

type RatingKey =
  | 'energy'
  | 'performance'
  | 'technique'
  | 'conditioning';

const DEFAULT_RATINGS: SessionRatings = {
  energy: 3,
  performance: 3,
  technique: 3,
  conditioning: 3,
};

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

  const remainingSeconds =
    seconds % 60;

  if (
    hours >
    0
  ) {
    return `${hours}h ${minutes}m`;
  }

  if (
    minutes >
    0
  ) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

function formatDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    undefined,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

function formatSessionWeekday(
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

function formatSessionCardDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

function formatTime(
  date: string
) {
  return new Date(
    date
  ).toLocaleTimeString(
    undefined,
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function formatPickerDate(
  date: Date
) {
  return date.toLocaleDateString(
    undefined,
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

function formatPickerTime(
  date: Date
) {
  return date.toLocaleTimeString(
    undefined,
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function mergePickerDateAndTime(
  dateValue: Date,
  timeValue: Date
) {
  const combined =
    new Date(
      dateValue
    );

  combined.setHours(
    timeValue.getHours(),
    timeValue.getMinutes(),
    0,
    0
  );

  return combined;
}

function formatMonthTitle(
  date: Date
) {
  return date.toLocaleDateString(
    undefined,
    {
      month: 'long',
      year: 'numeric',
    }
  );
}

function getDateKey(
  value: string | Date
) {
  const date =
    typeof value ===
    'string'
      ? new Date(
          value
        )
      : value;

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}

function getCalendarDays(
  monthDate: Date
) {
  const year =
    monthDate.getFullYear();

  const month =
    monthDate.getMonth();

  const firstDay =
    new Date(
      year,
      month,
      1
    );

  const lastDay =
    new Date(
      year,
      month +
        1,
      0
    );

  const mondayBasedStart =
    (
      firstDay.getDay() +
      6
    ) %
    7;

  const days: Array<
    | {
        date: Date;
      }
    | null
  > = [];

  for (
    let index = 0;
    index <
    mondayBasedStart;
    index += 1
  ) {
    days.push(
      null
    );
  }

  for (
    let day = 1;
    day <=
    lastDay.getDate();
    day += 1
  ) {
    days.push({
      date:
        new Date(
          year,
          month,
          day
        ),
    });
  }

  while (
    days.length %
      7 !==
    0
  ) {
    days.push(
      null
    );
  }

  return days;
}

function getStartOfWeek() {
  const now =
    new Date();

  const day =
    now.getDay();

  const difference =
    day ===
    0
      ? -6
      : 1 -
        day;

  const start =
    new Date(
      now
    );

  start.setDate(
    now.getDate() +
      difference
  );

  start.setHours(
    0,
    0,
    0,
    0
  );

  return start;
}

function countSubmissions(
  submissions:
    | SubmissionCounts
    | undefined
) {
  if (
    !submissions
  ) {
    return 0;
  }

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

function submissionList(
  submissions:
    | SubmissionCounts
    | undefined
) {
  if (
    !submissions
  ) {
    return [];
  }

  return Object.entries(
    submissions
  )
    .filter(
      (
        [
          ,
          count,
        ]
      ) =>
        count >
        0
    )
    .sort(
      (
        a,
        b
      ) =>
        b[1] -
        a[1]
    );
}

function difficultyColor(
  difficulty:
    | RollDifficulty
    | undefined
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

  if (
    difficulty ===
    'Competitive'
  ) {
    return '#FFD60A';
  }

  return '#777C85';
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

function ratingColor(
  value: number
) {
  if (
    value <=
    1
  ) {
    return '#FF453A';
  }

  if (
    value ===
    2
  ) {
    return '#FF9F0A';
  }

  if (
    value ===
    3
  ) {
    return '#FFD60A';
  }

  if (
    value ===
    4
  ) {
    return '#34C759';
  }

  return '#30D158';
}

function sessionMatchesSearch(
  session: TrainingSession,
  query: string
) {
  const search =
    query
      .trim()
      .toLowerCase();

  if (
    !search
  ) {
    return true;
  }

  if (
    session.style
      .toLowerCase()
      .includes(
        search
      )
  ) {
    return true;
  }

  if (
    session.sessionNotes
      ?.toLowerCase()
      .includes(
        search
      )
  ) {
    return true;
  }

  if (
    session.techniques?.some(
      (
        technique
      ) =>
        technique.techniqueName
          .toLowerCase()
          .includes(
            search
          ) ||
        technique.category
          .toLowerCase()
          .includes(
            search
          ) ||
        technique.notes
          ?.toLowerCase()
          .includes(
            search
          )
    )
  ) {
    return true;
  }

  return Boolean(
    session.rolls?.some(
      (
        roll
      ) =>
        roll.opponentName
          ?.toLowerCase()
          .includes(
            search
          ) ||
        roll.opponentBelt
          ?.toLowerCase()
          .includes(
            search
          ) ||
        roll.notes
          ?.toLowerCase()
          .includes(
            search
          ) ||
        roll.difficulty
          ?.toLowerCase()
          .includes(
            search
          ) ||
        Object.keys(
          roll.submissionsFor ||
            {}
        ).some(
          (
            submission
          ) =>
            submission
              .toLowerCase()
              .includes(
                search
              )
        ) ||
        Object.keys(
          roll.submissionsAgainst ||
            {}
        ).some(
          (
            submission
          ) =>
            submission
              .toLowerCase()
              .includes(
                search
              )
        )
    )
  );
}

export default function JournalPage() {
  const [
    sessions,
    setSessions,
  ] =
    useState<
      TrainingSession[]
    >([]);

  const [
    selectedSession,
    setSelectedSession,
  ] =
    useState<
      TrainingSession | null
    >(
      null
    );

  const [
    displayedMonth,
    setDisplayedMonth,
  ] =
    useState(
      new Date()
    );

  const [
    selectedDateKey,
    setSelectedDateKey,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState(
      ''
    );

  const [
    styleFilter,
    setStyleFilter,
  ] =
    useState<
      | 'All'
      | 'Gi'
      | 'No-Gi'
    >(
      'All'
    );

  const [
    beltFilter,
    setBeltFilter,
  ] =
    useState(
      'All'
    );

  const [
    activityFilter,
    setActivityFilter,
  ] =
    useState<
      | 'All'
      | TechniqueActivity
    >(
      'All'
    );

  const [
    timeFilter,
    setTimeFilter,
  ] =
    useState<TimeFilter>(
      'All'
    );

  const [
    favoritesOnly,
    setFavoritesOnly,
  ] =
    useState(
      false
    );

  const [
    filtersOpen,
    setFiltersOpen,
  ] =
    useState(
      false
    );

  const [
    editingSession,
    setEditingSession,
  ] =
    useState(
      false
    );

  const [
    editingRatings,
    setEditingRatings,
  ] =
    useState(
      false
    );

  const [
    editingRoll,
    setEditingRoll,
  ] =
    useState<
      Roll | null
    >(
      null
    );

  const [
    editingTechnique,
    setEditingTechnique,
  ] =
    useState<
      TechniqueLog | null
    >(
      null
    );

  const [
    editSessionDate,
    setEditSessionDate,
  ] =
    useState(
      new Date()
    );

  const [
    editSessionTime,
    setEditSessionTime,
  ] =
    useState(
      new Date()
    );

  const [
    editSessionMinutes,
    setEditSessionMinutes,
  ] =
    useState(
      90
    );

  const [
    editSessionNotes,
    setEditSessionNotes,
  ] =
    useState(
      ''
    );

  const [
    editDatePickerVisible,
    setEditDatePickerVisible,
  ] =
    useState(
      false
    );

  const [
    editTimePickerVisible,
    setEditTimePickerVisible,
  ] =
    useState(
      false
    );

  const [
    editRatings,
    setEditRatings,
  ] =
    useState<SessionRatings>({
      ...DEFAULT_RATINGS,
    });

  const [
    editOpponentName,
    setEditOpponentName,
  ] =
    useState(
      ''
    );

  const [
    editOpponentBelt,
    setEditOpponentBelt,
  ] =
    useState(
      'Unknown'
    );

  const [
    editDifficulty,
    setEditDifficulty,
  ] =
    useState<RollDifficulty>(
      'Competitive'
    );

  const [
    editSubsFor,
    setEditSubsFor,
  ] =
    useState<SubmissionCounts>(
      {}
    );

  const [
    editSubsAgainst,
    setEditSubsAgainst,
  ] =
    useState<SubmissionCounts>(
      {}
    );

  const [
    editRollNotes,
    setEditRollNotes,
  ] =
    useState(
      ''
    );

  const [
    editTechniqueActivity,
    setEditTechniqueActivity,
  ] =
    useState<TechniqueActivity>(
      'Drilled'
    );

  const [
    editTechniqueNotes,
    setEditTechniqueNotes,
  ] =
    useState(
      ''
    );

  const loadSessions =
    useCallback(
      async () => {
        const data =
          await getSessions();

        setSessions(
          data
        );
      },
      []
    );

  useEffect(() => {
    loadSessions();

    function refresh() {
      loadSessions();
    }

    function visibilityRefresh() {
      if (
        document.visibilityState ===
        'visible'
      ) {
        loadSessions();
      }
    }

    window.addEventListener(
      'focus',
      refresh
    );

    document.addEventListener(
      'visibilitychange',
      visibilityRefresh
    );

    return () => {
      window.removeEventListener(
        'focus',
        refresh
      );

      document.removeEventListener(
        'visibilitychange',
        visibilityRefresh
      );
    };
  }, [
    loadSessions,
  ]);

  const sessionsByDate =
    useMemo(
      () => {
        const map: Record<
          string,
          TrainingSession[]
        > = {};

        sessions.forEach(
          (
            session
          ) => {
            const key =
              getDateKey(
                session.date
              );

            if (
              !map[
                key
              ]
            ) {
              map[
                key
              ] = [];
            }

            map[
              key
            ].push(
              session
            );
          }
        );

        return map;
      },
      [
        sessions,
      ]
    );

  const filteredSessions =
    useMemo(
      () => {
        const now =
          new Date();

        const startOfWeek =
          getStartOfWeek();

        const monthStart =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );

        const last30Start =
          new Date(
            now
          );

        last30Start.setDate(
          now.getDate() -
            29
        );

        last30Start.setHours(
          0,
          0,
          0,
          0
        );

        return sessions
          .filter(
            (
              session
            ) => {
              const sessionDate =
                new Date(
                  session.date
                );

              if (
                selectedDateKey &&
                getDateKey(
                  session.date
                ) !==
                  selectedDateKey
              ) {
                return false;
              }

              if (
                !sessionMatchesSearch(
                  session,
                  searchQuery
                )
              ) {
                return false;
              }

              if (
                styleFilter !==
                  'All' &&
                session.style !==
                  styleFilter
              ) {
                return false;
              }

              if (
                favoritesOnly &&
                !session.isFavorite
              ) {
                return false;
              }

              if (
                beltFilter !==
                'All'
              ) {
                const hasBelt =
                  session.rolls?.some(
                    (
                      roll
                    ) =>
                      roll.opponentBelt ===
                      beltFilter
                  );

                if (
                  !hasBelt
                ) {
                  return false;
                }
              }

              if (
                activityFilter !==
                'All'
              ) {
                const hasActivity =
                  session.techniques?.some(
                    (
                      technique
                    ) =>
                      technique.activity ===
                      activityFilter
                  );

                if (
                  !hasActivity
                ) {
                  return false;
                }
              }

              if (
                timeFilter ===
                  'This week' &&
                sessionDate <
                  startOfWeek
              ) {
                return false;
              }

              if (
                timeFilter ===
                  'This month' &&
                sessionDate <
                  monthStart
              ) {
                return false;
              }

              if (
                timeFilter ===
                  'Last 30 days' &&
                sessionDate <
                  last30Start
              ) {
                return false;
              }

              return true;
            }
          )
          .sort(
            (
              a,
              b
            ) => {
              const favoriteDifference =
                Number(
                  Boolean(
                    b.isFavorite
                  )
                ) -
                Number(
                  Boolean(
                    a.isFavorite
                  )
                );

              if (
                favoriteDifference !==
                0
              ) {
                return favoriteDifference;
              }

              return (
                new Date(
                  b.date
                ).getTime() -
                new Date(
                  a.date
                ).getTime()
              );
            }
          );
      },
      [
        sessions,
        selectedDateKey,
        searchQuery,
        styleFilter,
        beltFilter,
        activityFilter,
        timeFilter,
        favoritesOnly,
      ]
    );

  const calendarDays =
    useMemo(
      () =>
        getCalendarDays(
          displayedMonth
        ),
      [
        displayedMonth,
      ]
    );

  const activeFilterCount =
    useMemo(
      () => {
        let count =
          0;

        if (
          searchQuery.trim()
        ) {
          count +=
            1;
        }

        if (
          styleFilter !==
          'All'
        ) {
          count +=
            1;
        }

        if (
          beltFilter !==
          'All'
        ) {
          count +=
            1;
        }

        if (
          activityFilter !==
          'All'
        ) {
          count +=
            1;
        }

        if (
          timeFilter !==
          'All'
        ) {
          count +=
            1;
        }

        if (
          favoritesOnly
        ) {
          count +=
            1;
        }

        return count;
      },
      [
        searchQuery,
        styleFilter,
        beltFilter,
        activityFilter,
        timeFilter,
        favoritesOnly,
      ]
    );

  function clearFilters() {
    setSearchQuery(
      ''
    );

    setStyleFilter(
      'All'
    );

    setBeltFilter(
      'All'
    );

    setActivityFilter(
      'All'
    );

    setTimeFilter(
      'All'
    );

    setFavoritesOnly(
      false
    );

    setSelectedDateKey(
      null
    );
  }

  function previousMonth() {
    setDisplayedMonth(
      (
        current
      ) =>
        new Date(
          current.getFullYear(),
          current.getMonth() -
            1,
          1
        )
    );

    setSelectedDateKey(
      null
    );
  }

  function nextMonth() {
    setDisplayedMonth(
      (
        current
      ) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            1,
          1
        )
    );

    setSelectedDateKey(
      null
    );
  }

  async function handleFavorite(
    session: TrainingSession
  ) {
    const updated =
      await toggleSessionFavorite(
        session.id
      );

    setSessions(
      updated
    );

    if (
      selectedSession?.id ===
      session.id
    ) {
      const fresh =
        updated.find(
          (
            item
          ) =>
            item.id ===
            session.id
        );

      if (
        fresh
      ) {
        setSelectedSession(
          fresh
        );
      }
    }
  }

  async function handleDeleteSession() {
    if (
      !selectedSession
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        'Delete this training session permanently?'
      );

    if (
      !confirmed
    ) {
      return;
    }

    const updated =
      await deleteSession(
        selectedSession.id
      );

    setSessions(
      updated
    );

    setSelectedSession(
      null
    );
  }

  function openSessionEditor() {
    if (
      !selectedSession
    ) {
      return;
    }

    const date =
      new Date(
        selectedSession.date
      );

    setEditSessionDate(
      new Date(
        date
      )
    );

    setEditSessionTime(
      new Date(
        date
      )
    );

    setEditSessionMinutes(
      Math.max(
        5,
        Math.round(
          selectedSession.durationSeconds /
            60
        )
      )
    );

    setEditSessionNotes(
      selectedSession.sessionNotes ||
        ''
    );

    setEditDatePickerVisible(
      false
    );

    setEditTimePickerVisible(
      false
    );

    setEditingSession(
      true
    );
  }

  async function saveSessionEdits() {
    if (
      !selectedSession
    ) {
      return;
    }

    const newDate =
      mergePickerDateAndTime(
        editSessionDate,
        editSessionTime
      );

    const individualRollSeconds =
      (
        selectedSession.rolls ||
        []
      ).reduce(
        (
          total,
          roll
        ) =>
          total +
          roll.durationSeconds,
        0
      );

    const newDurationSeconds =
      Math.round(
        editSessionMinutes *
          60
      );

    if (
      newDurationSeconds <
      individualRollSeconds
    ) {
      window.alert(
        `This session contains ${formatDuration(
          individualRollSeconds
        )} of individual roll time. The total session cannot be shorter than that.`
      );

      return;
    }

    const newDateIso =
      newDate.toISOString();

    const updatedSession: TrainingSession =
      {
        ...selectedSession,

        date:
          newDateIso,

        durationSeconds:
          newDurationSeconds,

        sessionNotes:
          editSessionNotes.trim(),

        techniques:
          (
            selectedSession.techniques ||
            []
          ).map(
            (
              technique
            ) => ({
              ...technique,

              createdAt:
                newDateIso,
            })
          ),
      };

    const updated =
      await updateSession(
        updatedSession
      );

    setSessions(
      updated
    );

    setSelectedSession(
      updatedSession
    );

    setDisplayedMonth(
      new Date(
        newDateIso
      )
    );

    setSelectedDateKey(
      getDateKey(
        newDateIso
      )
    );

    setEditingSession(
      false
    );
  }

  function openRatingsEditor() {
    if (
      !selectedSession
    ) {
      return;
    }

    setEditRatings(
      selectedSession.ratings
        ? {
            ...selectedSession.ratings,
          }
        : {
            ...DEFAULT_RATINGS,
          }
    );

    setEditingRatings(
      true
    );
  }

  function updateRating(
    key: RatingKey,
    value: number
  ) {
    setEditRatings(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );
  }

  async function saveRatings() {
    if (
      !selectedSession
    ) {
      return;
    }

    const updatedSession: TrainingSession =
      {
        ...selectedSession,

        ratings: {
          ...editRatings,
        },
      };

    const updated =
      await updateSession(
        updatedSession
      );

    setSessions(
      updated
    );

    setSelectedSession(
      updatedSession
    );

    setEditingRatings(
      false
    );
  }

  function openRollEditor(
    roll: Roll
  ) {
    setEditingRoll(
      roll
    );

    setEditOpponentName(
      roll.opponentName ||
        ''
    );

    setEditOpponentBelt(
      roll.opponentBelt ||
        'Unknown'
    );

    setEditDifficulty(
      roll.difficulty ||
        'Competitive'
    );

    setEditSubsFor({
      ...roll.submissionsFor,
    });

    setEditSubsAgainst({
      ...roll.submissionsAgainst,
    });

    setEditRollNotes(
      roll.notes ||
        ''
    );
  }

  function addEditSubmission(
    submission: string,
    type:
      | 'for'
      | 'against'
  ) {
    const setter =
      type ===
      'for'
        ? setEditSubsFor
        : setEditSubsAgainst;

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

  function removeEditSubmission(
    submission: string,
    type:
      | 'for'
      | 'against'
  ) {
    const setter =
      type ===
      'for'
        ? setEditSubsFor
        : setEditSubsAgainst;

    setter(
      (
        current
      ) => {
        const count =
          current[
            submission
          ] ||
          0;

        if (
          count <=
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
            count -
            1,
        };
      }
    );
  }

  async function saveRollEdits() {
    if (
      !selectedSession ||
      !editingRoll
    ) {
      return;
    }

    const updatedRoll: Roll =
      {
        ...editingRoll,

        opponentName:
          editOpponentName.trim(),

        opponentBelt:
          editOpponentBelt,

        difficulty:
          editDifficulty,

        submissionsFor:
          editSubsFor,

        submissionsAgainst:
          editSubsAgainst,

        notes:
          editRollNotes.trim(),
      };

    const updatedRolls =
      (
        selectedSession.rolls ||
        []
      ).map(
        (
          roll
        ) =>
          roll.id ===
          editingRoll.id
            ? updatedRoll
            : roll
      );

    const updatedSession: TrainingSession =
      {
        ...selectedSession,

        rolls:
          updatedRolls,

        rollCount:
          updatedRolls.length,

        submissionsFor:
          updatedRolls.reduce(
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

        submissionsAgainst:
          updatedRolls.reduce(
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
      };

    const updated =
      await updateSession(
        updatedSession
      );

    setSessions(
      updated
    );

    setSelectedSession(
      updatedSession
    );

    setEditingRoll(
      null
    );
  }

  function openTechniqueEditor(
    technique: TechniqueLog
  ) {
    setEditingTechnique(
      technique
    );

    setEditTechniqueActivity(
      technique.activity
    );

    setEditTechniqueNotes(
      technique.notes ||
        ''
    );
  }

  async function saveTechniqueEdits() {
    if (
      !selectedSession ||
      !editingTechnique
    ) {
      return;
    }

    const updatedTechniques =
      (
        selectedSession.techniques ||
        []
      ).map(
        (
          technique
        ) =>
          technique.id ===
          editingTechnique.id
            ? {
                ...technique,

                activity:
                  editTechniqueActivity,

                notes:
                  editTechniqueNotes.trim(),
              }
            : technique
      );

    const updatedSession: TrainingSession =
      {
        ...selectedSession,

        techniques:
          updatedTechniques,
      };

    const updated =
      await updateSession(
        updatedSession
      );

    setSessions(
      updated
    );

    setSelectedSession(
      updatedSession
    );

    setEditingTechnique(
      null
    );
  }

  const selectedRollSeconds =
    selectedSession?.rolls?.reduce(
      (
        total,
        roll
      ) =>
        total +
        roll.durationSeconds,
      0
    ) ||
    0;

  const ratings =
    selectedSession?.ratings;

  return (
    <>
      <main className="journal-page">
        <header className="journal-header">
          <div>
            <div className="eyebrow">
              TRAINING HISTORY
            </div>

            <h1>
              Journal
            </h1>

            <p>
              Review sessions, rolls, techniques and notes.
            </p>
          </div>

          <div className="total-pill">
            {sessions.length}{' '}
            {sessions.length ===
            1
              ? 'session'
              : 'sessions'}
          </div>
        </header>

        <div className="search-row">
          <input
            className="search-input"
            value={
              searchQuery
            }
            onChange={(
              event
            ) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Search sessions, techniques, opponents..."
          />

          <button
            type="button"
            className={
              filtersOpen
                ? 'filter-toggle active'
                : 'filter-toggle'
            }
            onClick={() =>
              setFiltersOpen(
                (
                  value
                ) =>
                  !value
              )
            }
          >
            Filters
            {activeFilterCount >
            0
              ? ` (${activeFilterCount})`
              : ''}
          </button>
        </div>

        {filtersOpen ? (
          <div className="filters-card">
            <div className="filter-header">
              <strong>
                Filters
              </strong>

              <button
                type="button"
                onClick={
                  clearFilters
                }
              >
                Clear all
              </button>
            </div>

            <button
              type="button"
              className={
                favoritesOnly
                  ? 'favorite-filter active'
                  : 'favorite-filter'
              }
              onClick={() =>
                setFavoritesOnly(
                  (
                    value
                  ) =>
                    !value
                )
              }
            >
              ★ STARRED ONLY
            </button>

            <div className="filter-label">
              STYLE
            </div>

            <div className="chip-row">
              {[
                'All',
                'Gi',
                'No-Gi',
              ].map(
                (
                  value
                ) => (
                  <button
                    type="button"
                    key={
                      value
                    }
                    className={
                      styleFilter ===
                      value
                        ? 'filter-chip active'
                        : 'filter-chip'
                    }
                    onClick={() =>
                      setStyleFilter(
                        value as
                          | 'All'
                          | 'Gi'
                          | 'No-Gi'
                      )
                    }
                  >
                    {
                      value
                    }
                  </button>
                )
              )}
            </div>

            <div className="filter-label">
              OPPONENT BELT
            </div>

            <div className="chip-row">
              {[
                'All',
                ...BELTS,
              ].map(
                (
                  value
                ) => (
                  <button
                    type="button"
                    key={
                      value
                    }
                    className={
                      beltFilter ===
                      value
                        ? 'filter-chip active'
                        : 'filter-chip'
                    }
                    onClick={() =>
                      setBeltFilter(
                        value
                      )
                    }
                  >
                    {
                      value
                    }
                  </button>
                )
              )}
            </div>

            <div className="filter-label">
              TECHNIQUE ACTIVITY
            </div>

            <div className="chip-row">
              {[
                'All',
                ...TECHNIQUE_ACTIVITIES,
              ].map(
                (
                  value
                ) => (
                  <button
                    type="button"
                    key={
                      value
                    }
                    className={
                      activityFilter ===
                      value
                        ? 'filter-chip active'
                        : 'filter-chip'
                    }
                    onClick={() =>
                      setActivityFilter(
                        value as
                          | 'All'
                          | TechniqueActivity
                      )
                    }
                  >
                    {
                      value
                    }
                  </button>
                )
              )}
            </div>

            <div className="filter-label">
              TIME
            </div>

            <div className="chip-row">
              {TIME_FILTERS.map(
                (
                  value
                ) => (
                  <button
                    type="button"
                    key={
                      value
                    }
                    className={
                      timeFilter ===
                      value
                        ? 'filter-chip active'
                        : 'filter-chip'
                    }
                    onClick={() =>
                      setTimeFilter(
                        value
                      )
                    }
                  >
                    {
                      value
                    }
                  </button>
                )
              )}
            </div>
          </div>
        ) : null}

        <section className="calendar-card">
          <div className="calendar-header">
            <button
              type="button"
              onClick={
                previousMonth
              }
            >
              ‹
            </button>

            <strong>
              {formatMonthTitle(
                displayedMonth
              )}
            </strong>

            <button
              type="button"
              onClick={
                nextMonth
              }
            >
              ›
            </button>
          </div>

          <div className="week-header">
            {[
              'M',
              'T',
              'W',
              'T',
              'F',
              'S',
              'S',
            ].map(
              (
                day,
                index
              ) => (
                <div
                  key={`${day}-${index}`}
                >
                  {
                    day
                  }
                </div>
              )
            )}
          </div>

          <div className="calendar-grid">
            {calendarDays.map(
              (
                item,
                index
              ) => {
                if (
                  !item
                ) {
                  return (
                    <div
                      key={`blank-${index}`}
                      className="day-cell"
                    />
                  );
                }

                const key =
                  getDateKey(
                    item.date
                  );

                const selected =
                  selectedDateKey ===
                  key;

                const today =
                  key ===
                  getDateKey(
                    new Date()
                  );

                const hasTraining =
                  Boolean(
                    sessionsByDate[
                      key
                    ]?.length
                  );

                return (
                  <button
                    type="button"
                    key={
                      key
                    }
                    className={
                      selected
                        ? 'day-cell selected'
                        : today
                          ? 'day-cell today'
                          : 'day-cell'
                    }
                    onClick={() =>
                      setSelectedDateKey(
                        (
                          current
                        ) =>
                          current ===
                          key
                            ? null
                            : key
                      )
                    }
                  >
                    <span>
                      {
                        item.date.getDate()
                      }
                    </span>

                    {hasTraining ? (
                      <i />
                    ) : null}
                  </button>
                );
              }
            )}
          </div>
        </section>

        <div className="list-heading">
          <div>
            <h2>
              Sessions
            </h2>

            <span>
              {
                filteredSessions.length
              }{' '}
              showing
            </span>
          </div>

          {selectedDateKey ||
          activeFilterCount >
            0 ? (
            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear
            </button>
          ) : null}
        </div>

        {filteredSessions.length ===
        0 ? (
          <div className="empty-card">
            <div>
              🥋
            </div>

            <strong>
              No sessions found
            </strong>

            <span>
              Try another date or clear your filters.
            </span>
          </div>
        ) : (
          <div className="session-list">
            {filteredSessions.map(
              (
                session
              ) => (
                <article
                  className={
                    session.isFavorite
                      ? 'session-card favorite'
                      : 'session-card'
                  }
                  key={
                    session.id
                  }
                >
                  <div className="session-top">
                    <button
                      type="button"
                      className="session-open"
                      onClick={() =>
                        setSelectedSession(
                          session
                        )
                      }
                    >
                      <div>
                        <div className="session-weekday">
                          {formatSessionWeekday(
                            session.date
                          )}
                        </div>

                        <div className="session-date">
                          {formatSessionCardDate(
                            session.date
                          )}{' '}
                          ·{' '}
                          {formatTime(
                            session.date
                          )}
                        </div>
                      </div>

                      <div className="session-duration">
                        {formatDuration(
                          session.durationSeconds
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      className={
                        session.isFavorite
                          ? 'star active'
                          : 'star'
                      }
                      onClick={() =>
                        handleFavorite(
                          session
                        )
                      }
                    >
                      {session.isFavorite
                        ? '★'
                        : '☆'}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="session-open session-bottom"
                    onClick={() =>
                      setSelectedSession(
                        session
                      )
                    }
                  >
                    <span className="style-pill">
                      {
                        session.style
                      }
                    </span>

                    <span>
                      {
                        session.rollCount
                      }{' '}
                      rolls
                    </span>

                    <span>
                      {
                        session.submissionsFor
                      }{' '}
                      subs
                    </span>

                    <span>
                      {
                        session.techniques?.length ||
                        0
                      }{' '}
                      techniques
                    </span>
                  </button>
                </article>
              )
            )}
          </div>
        )}
      </main>

      {selectedSession ? (
        <div className="modal-root">
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close session"
            onClick={() =>
              setSelectedSession(
                null
              )
            }
          />

          <section className="detail-panel">
            <div className="detail-scroll">
              <div className="detail-topbar">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSession(
                      null
                    )
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className={
                    selectedSession.isFavorite
                      ? 'detail-star active'
                      : 'detail-star'
                  }
                  onClick={() =>
                    handleFavorite(
                      selectedSession
                    )
                  }
                >
                  {selectedSession.isFavorite
                    ? '★'
                    : '☆'}
                </button>
              </div>

              <div className="eyebrow">
                SESSION
              </div>

              <h2 className="detail-title">
                {formatSessionWeekday(
                  selectedSession.date
                )}
              </h2>

              <div className="detail-date">
                {formatDate(
                  selectedSession.date
                )}{' '}
                ·{' '}
                {formatTime(
                  selectedSession.date
                )}
              </div>

              <div className="detail-actions">
                <button
                  type="button"
                  onClick={
                    openSessionEditor
                  }
                >
                  EDIT SESSION
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={
                    handleDeleteSession
                  }
                >
                  DELETE
                </button>
              </div>

              <div className="main-stats">
                <div>
                  <strong>
                    {formatDuration(
                      selectedSession.durationSeconds
                    )}
                  </strong>

                  <span>
                    MAT TIME
                  </span>
                </div>

                <div />

                <div>
                  <strong>
                    {
                      selectedSession.rollCount
                    }
                  </strong>

                  <span>
                    ROLLS
                  </span>
                </div>

                <div />

                <div>
                  <strong className="positive">
                    {
                      selectedSession.submissionsFor
                    }
                  </strong>

                  <span>
                    SUBS
                  </span>
                </div>
              </div>

              <section className="detail-card">
                <div className="card-heading">
                  <div>
                    <div className="eyebrow">
                      TRAINING FEEL
                    </div>

                    <h3>
                      Ratings
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={
                      openRatingsEditor
                    }
                  >
                    {ratings
                      ? 'EDIT'
                      : 'ADD'}
                  </button>
                </div>

                {ratings ? (
                  <div className="rating-display">
                    {(
                      [
                        [
                          'Energy',
                          ratings.energy,
                        ],
                        [
                          'Performance',
                          ratings.performance,
                        ],
                        [
                          'Technique',
                          ratings.technique,
                        ],
                        [
                          'Conditioning',
                          ratings.conditioning,
                        ],
                      ] as const
                    ).map(
                      (
                        [
                          label,
                          value,
                        ]
                      ) => (
                        <div
                          key={
                            label
                          }
                          className="rating-row"
                          style={{
                            borderColor:
                              ratingColor(
                                value
                              ),
                          }}
                        >
                          <span>
                            {
                              label
                            }
                          </span>

                          <strong
                            style={{
                              color:
                                ratingColor(
                                  value
                                ),
                            }}
                          >
                            {
                              value
                            }
                            /5
                          </strong>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="muted">
                    No ratings were recorded for this session.
                  </p>
                )}
              </section>

              {selectedSession.sessionNotes ? (
                <section className="detail-card">
                  <div className="eyebrow">
                    SESSION NOTES
                  </div>

                  <p className="notes-text">
                    {
                      selectedSession.sessionNotes
                    }
                  </p>
                </section>
              ) : null}

              {(selectedSession.averageHr >
                0 ||
                selectedSession.maxHr >
                  0) ? (
                <section className="hr-detail-card">
                  <div className="eyebrow">
                    HEART RATE
                  </div>

                  <div className="hr-detail-stats">
                    <div>
                      <strong>
                        {
                          selectedSession.averageHr
                        }
                      </strong>

                      <span>
                        AVG BPM
                      </span>
                    </div>

                    <div>
                      <strong>
                        {
                          selectedSession.maxHr
                        }
                      </strong>

                      <span>
                        MAX BPM
                      </span>
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="section-heading">
                <div>
                  <h3>
                    Techniques
                  </h3>

                  <span>
                    {
                      selectedSession.techniques?.length ||
                      0
                    }{' '}
                    logged
                  </span>
                </div>
              </div>

              {(selectedSession.techniques?.length ||
                0) ===
              0 ? (
                <div className="empty-inner">
                  No techniques logged.
                </div>
              ) : (
                <div className="detail-list">
                  {selectedSession.techniques?.map(
                    (
                      technique
                    ) => (
                      <button
                        type="button"
                        className="technique-card"
                        style={{
                          borderLeftColor:
                            activityColor(
                              technique.activity
                            ),
                        }}
                        key={
                          technique.id
                        }
                        onClick={() =>
                          openTechniqueEditor(
                            technique
                          )
                        }
                      >
                        <div>
                          <strong>
                            {
                              technique.techniqueName
                            }
                          </strong>

                          <span>
                            {
                              technique.category
                            }
                          </span>

                          {technique.notes ? (
                            <p>
                              {
                                technique.notes
                              }
                            </p>
                          ) : null}
                        </div>

                        <div
                          className="activity-pill"
                          style={{
                            color:
                              activityColor(
                                technique.activity
                              ),

                            borderColor:
                              activityColor(
                                technique.activity
                              ),
                          }}
                        >
                          {
                            technique.activity
                          }
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="section-heading rolls-heading">
                <div>
                  <h3>
                    Rolls
                  </h3>

                  <span>
                    {
                      selectedSession.rolls?.length ||
                      0
                    }{' '}
                    logged ·{' '}
                    {formatDuration(
                      selectedRollSeconds
                    )}
                  </span>
                </div>
              </div>

              {(selectedSession.rolls?.length ||
                0) ===
              0 ? (
                <div className="empty-inner">
                  No individual roll details recorded.
                </div>
              ) : (
                <div className="detail-list">
                  {selectedSession.rolls?.map(
                    (
                      roll,
                      index
                    ) => (
                      <button
                        type="button"
                        className="roll-detail-card"
                        style={{
                          borderLeftColor:
                            difficultyColor(
                              roll.difficulty
                            ),
                        }}
                        key={
                          roll.id
                        }
                        onClick={() =>
                          openRollEditor(
                            roll
                          )
                        }
                      >
                        <div className="roll-detail-top">
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
                                    roll.difficulty
                                  ),
                              }}
                            >
                              {roll.difficulty ||
                                'Competitive'}
                            </em>
                          </div>

                          <div className="roll-detail-right">
                            <strong>
                              {formatDuration(
                                roll.durationSeconds
                              )}
                            </strong>

                            <span>
                              Tap to edit
                            </span>
                          </div>
                        </div>

                        <div className="roll-mini-stats">
                          <div>
                            <span>
                              SUBMISSIONS
                            </span>

                            <strong className="positive">
                              {countSubmissions(
                                roll.submissionsFor
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              CAUGHT
                            </span>

                            <strong className="negative">
                              {countSubmissions(
                                roll.submissionsAgainst
                              )}
                            </strong>
                          </div>
                        </div>

                        {submissionList(
                          roll.submissionsFor
                        ).length >
                        0 ? (
                          <div className="submission-breakdown">
                            <span>
                              YOU GOT
                            </span>

                            <div>
                              {submissionList(
                                roll.submissionsFor
                              ).map(
                                (
                                  [
                                    name,
                                    count,
                                  ]
                                ) => (
                                  <i
                                    key={
                                      name
                                    }
                                  >
                                    {
                                      name
                                    }{' '}
                                    ×
                                    {
                                      count
                                    }
                                  </i>
                                )
                              )}
                            </div>
                          </div>
                        ) : null}

                        {submissionList(
                          roll.submissionsAgainst
                        ).length >
                        0 ? (
                          <div className="submission-breakdown">
                            <span>
                              CAUGHT WITH
                            </span>

                            <div>
                              {submissionList(
                                roll.submissionsAgainst
                              ).map(
                                (
                                  [
                                    name,
                                    count,
                                  ]
                                ) => (
                                  <i
                                    key={
                                      name
                                    }
                                  >
                                    {
                                      name
                                    }{' '}
                                    ×
                                    {
                                      count
                                    }
                                  </i>
                                )
                              )}
                            </div>
                          </div>
                        ) : null}

                        {roll.notes ? (
                          <div className="roll-notes">
                            {
                              roll.notes
                            }
                          </div>
                        ) : null}
                      </button>
                    )
                  )}
                </div>
              )}

              <div className="detail-bottom-space" />
            </div>
          </section>
        </div>
      ) : null}

      {editingSession &&
      selectedSession ? (
        <div className="modal-root editor-layer">
          <div className="modal-backdrop" />

          <section className="editor-panel">
            <div className="editor-scroll">
              <button
                type="button"
                className="back-button"
                onClick={() =>
                  setEditingSession(
                    false
                  )
                }
              >
                ‹ Back
              </button>

              <div className="eyebrow">
                EDIT SESSION
              </div>

              <h2 className="editor-title">
                Session details
              </h2>

              <div className="editor-stack">
                <PickerField
                  label="DATE"
                  value={formatPickerDate(
                    editSessionDate
                  )}
                  onPress={() =>
                    setEditDatePickerVisible(
                      true
                    )
                  }
                />

                <PickerField
                  label="START TIME"
                  value={formatPickerTime(
                    editSessionTime
                  )}
                  onPress={() =>
                    setEditTimePickerVisible(
                      true
                    )
                  }
                />

                <NumberStepper
                  label="SESSION DURATION"
                  value={
                    editSessionMinutes
                  }
                  onChange={
                    setEditSessionMinutes
                  }
                  min={5}
                  max={300}
                  step={5}
                  suffix="minutes"
                  quickValues={[
                    45,
                    60,
                    75,
                    90,
                    120,
                  ]}
                />

                <div>
                  <div className="editor-section-title">
                    Session notes
                  </div>

                  <textarea
                    className="textarea"
                    value={
                      editSessionNotes
                    }
                    onChange={(
                      event
                    ) =>
                      setEditSessionNotes(
                        event.target.value
                      )
                    }
                    placeholder="Session notes..."
                  />
                </div>

                <button
                  type="button"
                  className="save-button"
                  onClick={
                    saveSessionEdits
                  }
                >
                  SAVE SESSION
                </button>
              </div>

              <DateTimePickerSheet
                visible={
                  editDatePickerVisible
                }
                title="Training date"
                value={
                  editSessionDate
                }
                mode="date"
                onChange={
                  setEditSessionDate
                }
                onClose={() =>
                  setEditDatePickerVisible(
                    false
                  )
                }
              />

              <DateTimePickerSheet
                visible={
                  editTimePickerVisible
                }
                title="Start time"
                value={
                  editSessionTime
                }
                mode="time"
                onChange={
                  setEditSessionTime
                }
                onClose={() =>
                  setEditTimePickerVisible(
                    false
                  )
                }
              />
            </div>
          </section>
        </div>
      ) : null}

      {editingRatings &&
      selectedSession ? (
        <div className="modal-root editor-layer">
          <div className="modal-backdrop" />

          <section className="editor-panel">
            <div className="editor-scroll">
              <button
                type="button"
                className="back-button"
                onClick={() =>
                  setEditingRatings(
                    false
                  )
                }
              >
                ‹ Back
              </button>

              <div className="eyebrow">
                EDIT RATINGS
              </div>

              <h2 className="editor-title">
                How was training?
              </h2>

              <div className="editor-stack">
                <RatingSelector
                  label="Energy"
                  value={
                    editRatings.energy
                  }
                  onChange={(
                    value
                  ) =>
                    updateRating(
                      'energy',
                      value
                    )
                  }
                />

                <RatingSelector
                  label="Performance"
                  value={
                    editRatings.performance
                  }
                  onChange={(
                    value
                  ) =>
                    updateRating(
                      'performance',
                      value
                    )
                  }
                />

                <RatingSelector
                  label="Technique"
                  value={
                    editRatings.technique
                  }
                  onChange={(
                    value
                  ) =>
                    updateRating(
                      'technique',
                      value
                    )
                  }
                />

                <RatingSelector
                  label="Conditioning"
                  value={
                    editRatings.conditioning
                  }
                  onChange={(
                    value
                  ) =>
                    updateRating(
                      'conditioning',
                      value
                    )
                  }
                />

                <button
                  type="button"
                  className="save-button"
                  onClick={
                    saveRatings
                  }
                >
                  SAVE RATINGS
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {editingRoll &&
      selectedSession ? (
        <div className="modal-root editor-layer">
          <div className="modal-backdrop" />

          <section className="editor-panel">
            <div className="editor-scroll">
              <button
                type="button"
                className="back-button"
                onClick={() =>
                  setEditingRoll(
                    null
                  )
                }
              >
                ‹ Back
              </button>

              <div className="eyebrow">
                EDIT ROLL
              </div>

              <h2 className="editor-title">
                Roll details
              </h2>

              <div className="editor-stack">
                <div>
                  <div className="editor-section-title">
                    Opponent name
                  </div>

                  <input
                    className="text-input"
                    value={
                      editOpponentName
                    }
                    onChange={(
                      event
                    ) =>
                      setEditOpponentName(
                        event.target.value
                      )
                    }
                    placeholder="Optional"
                  />
                </div>

                <OptionSelector
                  label="OPPONENT BELT"
                  value={
                    editOpponentBelt
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
                    setEditOpponentBelt
                  }
                />

                <OptionSelector
                  label="ROLL DIFFICULTY"
                  value={
                    editDifficulty
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
                    setEditDifficulty(
                      value as
                        RollDifficulty
                    )
                  }
                />

                <div>
                  <div className="submission-title positive">
                    YOU GOT
                  </div>

                  <div className="submission-grid">
                    {SUBMISSIONS.map(
                      (
                        submission
                      ) => {
                        const count =
                          editSubsFor[
                            submission
                          ] ||
                          0;

                        return (
                          <div
                            className="submission-item"
                            key={`edit-for-${submission}`}
                          >
                            <button
                              type="button"
                              className={
                                count >
                                0
                                  ? 'submission-button for active'
                                  : 'submission-button'
                              }
                              onClick={() =>
                                addEditSubmission(
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
                                  removeEditSubmission(
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
                </div>

                <div>
                  <div className="submission-title negative">
                    GOT CAUGHT WITH
                  </div>

                  <div className="submission-grid">
                    {SUBMISSIONS.map(
                      (
                        submission
                      ) => {
                        const count =
                          editSubsAgainst[
                            submission
                          ] ||
                          0;

                        return (
                          <div
                            className="submission-item"
                            key={`edit-against-${submission}`}
                          >
                            <button
                              type="button"
                              className={
                                count >
                                0
                                  ? 'submission-button against active'
                                  : 'submission-button'
                              }
                              onClick={() =>
                                addEditSubmission(
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
                                  removeEditSubmission(
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
                </div>

                <div>
                  <div className="editor-section-title">
                    Notes
                  </div>

                  <textarea
                    className="textarea"
                    value={
                      editRollNotes
                    }
                    onChange={(
                      event
                    ) =>
                      setEditRollNotes(
                        event.target.value
                      )
                    }
                    placeholder="What happened in this roll?"
                  />
                </div>

                <button
                  type="button"
                  className="save-button"
                  onClick={
                    saveRollEdits
                  }
                >
                  SAVE ROLL
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {editingTechnique &&
      selectedSession ? (
        <div className="modal-root editor-layer">
          <div className="modal-backdrop" />

          <section className="editor-panel">
            <div className="editor-scroll">
              <button
                type="button"
                className="back-button"
                onClick={() =>
                  setEditingTechnique(
                    null
                  )
                }
              >
                ‹ Back
              </button>

              <div className="eyebrow">
                EDIT TECHNIQUE
              </div>

              <h2 className="editor-title">
                {
                  editingTechnique.techniqueName
                }
              </h2>

              <p className="editor-description">
                {
                  editingTechnique.category
                }
              </p>

              <div className="editor-stack">
                <OptionSelector
                  label="ACTIVITY"
                  value={
                    editTechniqueActivity
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
                    setEditTechniqueActivity(
                      value as
                        TechniqueActivity
                    )
                  }
                />

                <div>
                  <div className="editor-section-title">
                    Notes
                  </div>

                  <textarea
                    className="textarea"
                    value={
                      editTechniqueNotes
                    }
                    onChange={(
                      event
                    ) =>
                      setEditTechniqueNotes(
                        event.target.value
                      )
                    }
                    placeholder="Technique notes..."
                  />
                </div>

                <button
                  type="button"
                  className="save-button"
                  onClick={
                    saveTechniqueEdits
                  }
                >
                  SAVE TECHNIQUE
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <style jsx>{`
        .journal-page {
          width: 100%;
        }

        .journal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .eyebrow {
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

        .journal-header p {
          margin: 7px 0 0;
          color: #777c85;
          font-size: 12px;
        }

        .total-pill {
          flex: 0 0 auto;
          padding: 8px 11px;
          border: 1px solid #2a2d33;
          border-radius: 999px;
          background: #17191d;
          color: #a9adb4;
          font-size: 10px;
          font-weight: 850;
        }

        .search-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 9px;
          margin-bottom: 12px;
        }

        .search-input,
        .text-input,
        .textarea {
          width: 100%;
          border: 1px solid #2a2e34;
          background: #141619;
          color: #ffffff;
          font: inherit;
          outline: none;
        }

        .search-input {
          min-height: 50px;
          padding: 0 14px;
          border-radius: 15px;
          font-size: 13px;
        }

        .filter-toggle {
          min-height: 50px;
          padding: 0 14px;
          border: 1px solid #343840;
          border-radius: 15px;
          background: #17191d;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .filter-toggle.active {
          background: #ffffff;
          color: #090a0c;
        }

        .filters-card {
          padding: 15px;
          margin-bottom: 14px;
          border: 1px solid #23262b;
          border-radius: 18px;
          background: #141619;
        }

        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .filter-header strong {
          color: #ffffff;
          font-size: 16px;
        }

        .filter-header button {
          background: transparent;
          color: #777c85;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .favorite-filter {
          min-height: 40px;
          margin-bottom: 10px;
          padding: 0 12px;
          border: 1px solid #343840;
          border-radius: 12px;
          background: transparent;
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .favorite-filter.active {
          border-color: #34c759;
          background: rgba(52, 199, 89, 0.12);
          color: #34c759;
        }

        .filter-label {
          margin: 13px 0 7px;
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .filter-chip {
          min-height: 37px;
          padding: 0 11px;
          border: 1px solid #343840;
          border-radius: 11px;
          background: transparent;
          color: #ffffff;
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .filter-chip.active {
          background: #ffffff;
          color: #090a0c;
        }

        .calendar-card {
          padding: 17px;
          margin: 6px 0 24px;
          border: 1px solid #262a30;
          border-radius: 22px;
          background: #121417;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .calendar-header button {
          width: 40px;
          height: 40px;
          border: 1px solid #2b2f36;
          border-radius: 13px;
          background: #1e2126;
          color: #ffffff;
          font-size: 27px;
          cursor: pointer;
        }

        .calendar-header strong {
          color: #ffffff;
          font-size: 17px;
        }

        .week-header,
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .week-header {
          margin-bottom: 6px;
        }

        .week-header div {
          color: #646a72;
          font-size: 10px;
          font-weight: 900;
          text-align: center;
        }

        .day-cell {
          min-width: 0;
          height: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          border: 0;
          border-radius: 13px;
          background: transparent;
          color: #d7d9dd;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .day-cell.today {
          border: 1px solid #4a4f57;
        }

        .day-cell.selected {
          background: #ffffff;
          color: #090a0c;
        }

        .day-cell i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #34c759;
        }

        .list-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .list-heading h2 {
          margin: 0;
          color: #ffffff;
          font-size: 18px;
        }

        .list-heading span {
          display: block;
          margin-top: 3px;
          color: #777c85;
          font-size: 11px;
        }

        .list-heading button {
          padding: 8px 12px;
          border: 1px solid #343840;
          border-radius: 11px;
          background: transparent;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .session-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .session-card {
          border: 1px solid #282b31;
          border-radius: 22px;
          background: #141619;
          overflow: hidden;
        }

        .session-card.favorite {
          border-color: #2d663d;
          background: rgba(52, 199, 89, 0.055);
        }

        .session-top {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
        }

        .session-open {
          border: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .session-top .session-open {
          min-height: 84px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 17px 5px 12px 18px;
        }

        .session-weekday {
          color: #ffffff;
          font-size: 17px;
          font-weight: 850;
        }

        .session-date {
          margin-top: 5px;
          color: #777c85;
          font-size: 11px;
        }

        .session-duration {
          color: #ffffff;
          font-size: 16px;
          font-weight: 850;
        }

        .star {
          width: 52px;
          height: 70px;
          background: transparent;
          color: #656a72;
          font-size: 25px;
          cursor: pointer;
        }

        .star.active,
        .detail-star.active {
          color: #34c759;
        }

        .session-bottom {
          width: 100%;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 18px 17px;
          color: #777c85;
          font-size: 10px;
        }

        .style-pill {
          padding: 5px 8px;
          border: 1px solid #343840;
          border-radius: 8px;
          color: #ffffff;
          font-weight: 800;
        }

        .empty-card,
        .empty-inner {
          border: 1px solid #23262b;
          background: #141619;
          color: #777c85;
          text-align: center;
        }

        .empty-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px;
          border-radius: 20px;
        }

        .empty-card > div {
          font-size: 34px;
        }

        .empty-card strong {
          margin-top: 10px;
          color: #ffffff;
          font-size: 17px;
        }

        .empty-card span {
          margin-top: 5px;
          font-size: 12px;
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

        .editor-layer {
          z-index: 1100;
        }

        .modal-backdrop {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .detail-panel,
        .editor-panel {
          position: relative;
          z-index: 1;
          width: min(100%, 760px);
          max-height: calc(100vh - 24px);
          overflow: hidden;
          border: 1px solid #292d33;
          border-radius: 24px 24px 18px 18px;
          background: #090a0c;
        }

        .detail-scroll,
        .editor-scroll {
          max-height: calc(100vh - 24px);
          overflow-y: auto;
          padding: 20px;
        }

        .detail-topbar {
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .detail-topbar button,
        .back-button {
          background: transparent;
          color: #ffffff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .detail-star {
          font-size: 25px !important;
          color: #666b73 !important;
        }

        .detail-title,
        .editor-title {
          margin: 5px 0 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .detail-date,
        .editor-description {
          margin-top: 8px;
          color: #777c85;
          font-size: 12px;
        }

        .detail-actions {
          display: flex;
          gap: 8px;
          margin: 20px 0;
        }

        .detail-actions button {
          min-height: 40px;
          padding: 0 12px;
          border: 1px solid #343840;
          border-radius: 11px;
          background: #17191d;
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .detail-actions .danger {
          color: #ff6970;
        }

        .main-stats {
          display: grid;
          grid-template-columns: 1fr 1px 1fr 1px 1fr;
          align-items: center;
          padding: 20px 8px;
          margin-bottom: 12px;
          border: 1px solid #292c32;
          border-radius: 20px;
          background: #141619;
        }

        .main-stats > div:not(:nth-child(2)):not(:nth-child(4)) {
          text-align: center;
        }

        .main-stats > div:nth-child(2),
        .main-stats > div:nth-child(4) {
          height: 35px;
          background: #292c32;
        }

        .main-stats strong {
          display: block;
          color: #ffffff;
          font-size: 20px;
          font-weight: 900;
        }

        .main-stats span {
          display: block;
          margin-top: 6px;
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
        }

        .positive {
          color: #34c759 !important;
        }

        .negative {
          color: #ff453a !important;
        }

        .detail-card,
        .hr-detail-card {
          padding: 18px;
          margin-bottom: 12px;
          border: 1px solid #23262b;
          border-radius: 20px;
          background: #141619;
        }

        .hr-detail-card {
          border-color: #49282d;
          background: rgba(255, 90, 96, 0.055);
        }

        .card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .card-heading h3 {
          margin: 4px 0 0;
          color: #ffffff;
          font-size: 17px;
        }

        .card-heading button {
          padding: 8px 11px;
          border: 1px solid #343840;
          border-radius: 10px;
          background: transparent;
          color: #ffffff;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }

        .rating-display {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 14px;
        }

        .rating-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 13px;
          border: 1px solid;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.018);
        }

        .rating-row span {
          color: #a5a9b0;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .rating-row strong {
          font-size: 14px;
        }

        .muted {
          color: #777c85;
          font-size: 12px;
        }

        .notes-text {
          margin: 8px 0 0;
          color: #d7d9dd;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .hr-detail-stats {
          display: flex;
          gap: 50px;
          margin-top: 14px;
        }

        .hr-detail-stats strong {
          display: block;
          color: #ff5a60;
          font-size: 30px;
          font-weight: 950;
        }

        .hr-detail-stats span {
          display: block;
          margin-top: 4px;
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
        }

        .section-heading {
          margin: 28px 0 12px;
        }

        .section-heading h3 {
          margin: 0;
          color: #ffffff;
          font-size: 20px;
        }

        .section-heading span {
          display: block;
          margin-top: 3px;
          color: #777c85;
          font-size: 11px;
        }

        .rolls-heading {
          margin-top: 30px;
        }

        .detail-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .technique-card,
        .roll-detail-card {
          width: 100%;
          border: 1px solid #23262b;
          border-left: 3px solid;
          border-radius: 17px;
          background: #141619;
          color: #ffffff;
          text-align: left;
          cursor: pointer;
        }

        .technique-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 13px;
          padding: 15px;
        }

        .technique-card strong,
        .technique-card span {
          display: block;
        }

        .technique-card strong {
          font-size: 15px;
        }

        .technique-card span {
          margin-top: 3px;
          color: #777c85;
          font-size: 10px;
        }

        .technique-card p {
          margin: 10px 0 0;
          color: #c9ccd1;
          font-size: 12px;
          line-height: 1.5;
        }

        .activity-pill {
          flex: 0 0 auto;
          padding: 7px 10px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 850;
        }

        .empty-inner {
          padding: 16px;
          border-radius: 16px;
          font-size: 12px;
        }

        .roll-detail-card {
          padding: 17px;
        }

        .roll-detail-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .roll-detail-top strong,
        .roll-detail-top small,
        .roll-detail-top span,
        .roll-detail-top em {
          display: block;
        }

        .roll-detail-top strong {
          font-size: 17px;
        }

        .roll-detail-top small {
          margin-top: 5px;
          color: #9a9fa7;
          font-size: 10px;
        }

        .roll-detail-top span {
          margin-top: 4px;
          color: #777c85;
          font-size: 12px;
        }

        .roll-detail-top em {
          margin-top: 7px;
          font-size: 10px;
          font-style: normal;
          font-weight: 900;
          text-transform: uppercase;
        }

        .roll-detail-right {
          text-align: right;
        }

        .roll-detail-right strong {
          font-size: 16px;
        }

        .roll-detail-right span {
          font-size: 10px;
        }

        .roll-mini-stats {
          display: flex;
          gap: 44px;
          margin-top: 18px;
        }

        .roll-mini-stats span {
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
        }

        .roll-mini-stats strong {
          display: block;
          margin-top: 4px;
          font-size: 20px;
        }

        .submission-breakdown {
          padding-top: 13px;
          margin-top: 15px;
          border-top: 1px solid #292c32;
        }

        .submission-breakdown > span {
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
        }

        .submission-breakdown > div {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 8px;
        }

        .submission-breakdown i {
          padding: 7px 9px;
          border-radius: 9px;
          background: #22252a;
          color: #ffffff;
          font-size: 10px;
          font-style: normal;
        }

        .roll-notes {
          padding-top: 13px;
          margin-top: 15px;
          border-top: 1px solid #292c32;
          color: #d7d9dd;
          font-size: 12px;
          line-height: 1.5;
        }

        .detail-bottom-space {
          height: 50px;
        }

        .editor-scroll {
          padding-top: 22px;
          padding-bottom: 50px;
        }

        .back-button {
          margin-bottom: 20px;
        }

        .editor-description {
          margin-bottom: 20px;
        }

        .editor-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-top: 22px;
        }

        .editor-section-title,
        .submission-title {
          margin-bottom: 9px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 850;
        }

        .text-input {
          min-height: 54px;
          padding: 0 15px;
          border-radius: 15px;
          font-size: 14px;
        }

        .textarea {
          min-height: 120px;
          padding: 15px;
          border-radius: 16px;
          resize: vertical;
          font-size: 14px;
        }

        .search-input:focus,
        .text-input:focus,
        .textarea:focus {
          border-color: #50555e;
        }

        .save-button {
          min-height: 56px;
          border-radius: 17px;
          background: #ffffff;
          color: #090a0c;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.04em;
          cursor: pointer;
        }

        .submission-title {
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        .submission-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
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
          font-size: 11px;
          font-weight: 750;
          cursor: pointer;
        }

        .submission-button.for.active {
          border-color: #34c759;
          background: #12331b;
          color: #34c759;
        }

        .submission-button.against.active {
          border-color: #ff453a;
          background: #371719;
          color: #ff453a;
        }

        .minus-button {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #292c32;
          color: #ffffff;
          font-size: 17px;
          cursor: pointer;
        }

        @media (min-width: 760px) {
          .modal-root {
            align-items: center;
            padding: 30px;
          }

          .detail-panel,
          .editor-panel {
            max-height: calc(100vh - 60px);
            border-radius: 24px;
          }

          .detail-scroll,
          .editor-scroll {
            max-height: calc(100vh - 60px);
          }
        }

        @media (max-width: 520px) {
          .search-row {
            grid-template-columns: 1fr;
          }

          .main-stats {
            padding-left: 3px;
            padding-right: 3px;
          }

          .main-stats strong {
            font-size: 17px;
          }

          .technique-card {
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}

