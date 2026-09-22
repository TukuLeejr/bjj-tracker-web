'use client';

import {
  useEffect,
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

type QuickLogModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type ScreenMode =
  | 'session'
  | 'technique'
  | 'roll';

type RatingKey =
  | 'energy'
  | 'performance'
  | 'technique'
  | 'conditioning';

const TECHNIQUE_ACTIVITIES: TechniqueActivity[] = [
  'Drilled',
  'Attempted',
  'Hit',
];

const BELTS = [
  'White',
  'Blue',
  'Purple',
  'Brown',
  'Black',
  'Unknown',
];

const ROLL_DIFFICULTIES: RollDifficulty[] = [
  'Easy',
  'Competitive',
  'Hard',
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

const DEFAULT_RATINGS: SessionRatings = {
  energy: 3,
  performance: 3,
  technique: 3,
  conditioning: 3,
};

function formatDateForDisplay(
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

function formatTimeForDisplay(
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

function mergeDateAndTime(
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

function countSubmissionMap(
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

function difficultyColor(
  difficulty: RollDifficulty
) {
  if (
    difficulty === 'Easy'
  ) {
    return '#34C759';
  }

  if (
    difficulty === 'Hard'
  ) {
    return '#FF453A';
  }

  return '#FFD60A';
}

function activityColor(
  activity: TechniqueActivity
) {
  if (
    activity === 'Drilled'
  ) {
    return '#64D2FF';
  }

  if (
    activity === 'Attempted'
  ) {
    return '#FF9F0A';
  }

  return '#34C759';
}

function confidenceColor(
  confidence: number
) {
  if (
    confidence <= 1
  ) {
    return '#FF453A';
  }

  if (
    confidence === 2
  ) {
    return '#FF9F0A';
  }

  if (
    confidence === 3
  ) {
    return '#FFD60A';
  }

  if (
    confidence === 4
  ) {
    return '#34C759';
  }

  return '#30D158';
}

export default function QuickLogModal({
  visible,
  onClose,
  onSaved,
}: QuickLogModalProps) {
  const [
    screenMode,
    setScreenMode,
  ] =
    useState<ScreenMode>(
      'session'
    );

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
    sessionDate,
    setSessionDate,
  ] =
    useState(
      new Date()
    );

  const [
    sessionTime,
    setSessionTime,
  ] =
    useState(
      new Date()
    );

  const [
    datePickerVisible,
    setDatePickerVisible,
  ] =
    useState(
      false
    );

  const [
    timePickerVisible,
    setTimePickerVisible,
  ] =
    useState(
      false
    );

  const [
    dateTimeTouched,
    setDateTimeTouched,
  ] =
    useState(
      false
    );

  const [
    durationMinutes,
    setDurationMinutes,
  ] =
    useState(
      90
    );

  const [
    rollCount,
    setRollCount,
  ] =
    useState(
      0
    );

  const [
    submissionsFor,
    setSubmissionsFor,
  ] =
    useState(
      0
    );

  const [
    submissionsAgainst,
    setSubmissionsAgainst,
  ] =
    useState(
      0
    );

  const [
    sessionNotes,
    setSessionNotes,
  ] =
    useState(
      ''
    );

  const [
    ratings,
    setRatings,
  ] =
    useState<SessionRatings>({
      ...DEFAULT_RATINGS,
    });

  const [
    techniques,
    setTechniques,
  ] =
    useState<
      Technique[]
    >([]);

  const [
    techniqueLogs,
    setTechniqueLogs,
  ] =
    useState<
      TechniqueLog[]
    >([]);

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
    individualRolls,
    setIndividualRolls,
  ] =
    useState<
      Roll[]
    >([]);

  const [
    editingRollId,
    setEditingRollId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    rollDurationMinutes,
    setRollDurationMinutes,
  ] =
    useState(
      5
    );

  const [
    rollOpponentName,
    setRollOpponentName,
  ] =
    useState(
      ''
    );

  const [
    rollOpponentBelt,
    setRollOpponentBelt,
  ] =
    useState(
      'Unknown'
    );

  const [
    rollDifficulty,
    setRollDifficulty,
  ] =
    useState<RollDifficulty>(
      'Competitive'
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
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  useEffect(() => {
    if (
      !visible
    ) {
      return;
    }

    loadTechniques();
  }, [
    visible,
  ]);

  async function loadTechniques() {
    const data =
      await getTechniques();

    setTechniques(
      data
    );
  }

  function resetRollDraft() {
    setEditingRollId(
      null
    );

    setRollDurationMinutes(
      5
    );

    setRollOpponentName(
      ''
    );

    setRollOpponentBelt(
      'Unknown'
    );

    setRollDifficulty(
      'Competitive'
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
  }

  function resetForm() {
    const now =
      new Date();

    setScreenMode(
      'session'
    );

    setStyle(
      'No-Gi'
    );

    setSessionDate(
      now
    );

    setSessionTime(
      now
    );

    setDatePickerVisible(
      false
    );

    setTimePickerVisible(
      false
    );

    setDateTimeTouched(
      false
    );

    setDurationMinutes(
      90
    );

    setRollCount(
      0
    );

    setSubmissionsFor(
      0
    );

    setSubmissionsAgainst(
      0
    );

    setSessionNotes(
      ''
    );

    setRatings({
      ...DEFAULT_RATINGS,
    });

    setTechniqueLogs(
      []
    );

    setSelectedTechnique(
      null
    );

    setSelectedActivity(
      'Drilled'
    );

    setTechniqueNotes(
      ''
    );

    setIndividualRolls(
      []
    );

    resetRollDraft();

    setSaving(
      false
    );
  }

  function hasUnsavedData() {
    return (
      dateTimeTouched ||
      durationMinutes !==
        90 ||
      rollCount !==
        0 ||
      submissionsFor !==
        0 ||
      submissionsAgainst !==
        0 ||
      sessionNotes.trim()
        .length >
        0 ||
      techniqueLogs.length >
        0 ||
      individualRolls.length >
        0 ||
      style !==
        'No-Gi' ||
      ratings.energy !==
        3 ||
      ratings.performance !==
        3 ||
      ratings.technique !==
        3 ||
      ratings.conditioning !==
        3
    );
  }

  function closeModal() {
    if (
      screenMode ===
      'roll'
    ) {
      resetRollDraft();

      setScreenMode(
        'session'
      );

      return;
    }

    if (
      screenMode ===
      'technique'
    ) {
      setScreenMode(
        'session'
      );

      return;
    }

    if (
      hasUnsavedData()
    ) {
      const confirmed =
        window.confirm(
          'Discard your unsaved quick log?'
        );

      if (
        !confirmed
      ) {
        return;
      }
    }

    resetForm();

    onClose();
  }

  function updateRating(
    key: RatingKey,
    value: number
  ) {
    setRatings(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );
  }

  function openTechniqueLogger() {
    if (
      techniques.length ===
      0
    ) {
      window.alert(
        'No techniques yet. Add techniques from Profile first.'
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

    setScreenMode(
      'technique'
    );
  }

  function cancelTechniqueLogger() {
    setSelectedTechnique(
      null
    );

    setSelectedActivity(
      'Drilled'
    );

    setTechniqueNotes(
      ''
    );

    setScreenMode(
      'session'
    );
  }

  function addTechniqueLog() {
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

    setTechniqueLogs(
      (
        current
      ) => [
        ...current,
        log,
      ]
    );

    setSelectedTechnique(
      null
    );

    setSelectedActivity(
      'Drilled'
    );

    setTechniqueNotes(
      ''
    );

    setScreenMode(
      'session'
    );
  }

  function removeTechniqueLog(
    id: string
  ) {
    const confirmed =
      window.confirm(
        'Remove this technique from the session?'
      );

    if (
      !confirmed
    ) {
      return;
    }

    setTechniqueLogs(
      (
        current
      ) =>
        current.filter(
          (
            item
          ) =>
            item.id !==
            id
        )
    );
  }

  function openRollLogger() {
    resetRollDraft();

    setScreenMode(
      'roll'
    );
  }

  function openRollEditor(
    roll: Roll
  ) {
    setEditingRollId(
      roll.id
    );

    setRollDurationMinutes(
      Math.max(
        1,
        Math.round(
          roll.durationSeconds /
            60
        )
      )
    );

    setRollOpponentName(
      roll.opponentName ||
        ''
    );

    setRollOpponentBelt(
      roll.opponentBelt ||
        'Unknown'
    );

    setRollDifficulty(
      roll.difficulty ||
        'Competitive'
    );

    setRollSubsFor({
      ...roll.submissionsFor,
    });

    setRollSubsAgainst({
      ...roll.submissionsAgainst,
    });

    setRollNotes(
      roll.notes ||
        ''
    );

    setScreenMode(
      'roll'
    );
  }

  function cancelRollLogger() {
    resetRollDraft();

    setScreenMode(
      'session'
    );
  }

  function addRollSubmission(
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

  function removeRollSubmission(
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
        const count =
          current[
            submission
          ] ||
          0;

        if (
          count <= 1
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

  function saveIndividualRoll() {
    const roll: Roll =
      {
        id:
          editingRollId ||
          `${Date.now()}-${Math.random()}`,

        durationSeconds:
          Math.round(
            rollDurationMinutes *
              60
          ),

        opponentName:
          rollOpponentName.trim(),

        opponentBelt:
          rollOpponentBelt,

        difficulty:
          rollDifficulty,

        submissionsFor:
          rollSubsFor,

        submissionsAgainst:
          rollSubsAgainst,

        notes:
          rollNotes.trim(),
      };

    if (
      editingRollId
    ) {
      setIndividualRolls(
        (
          current
        ) =>
          current.map(
            (
              item
            ) =>
              item.id ===
              editingRollId
                ? roll
                : item
          )
      );
    } else {
      setIndividualRolls(
        (
          current
        ) => [
          ...current,
          roll,
        ]
      );
    }

    resetRollDraft();

    setScreenMode(
      'session'
    );
  }

  function removeIndividualRoll(
    id: string
  ) {
    const confirmed =
      window.confirm(
        'Remove this roll?'
      );

    if (
      !confirmed
    ) {
      return;
    }

    setIndividualRolls(
      (
        current
      ) =>
        current.filter(
          (
            roll
          ) =>
            roll.id !==
            id
        )
    );
  }

  async function saveQuickSession() {
    if (
      saving
    ) {
      return;
    }

    if (
      durationMinutes <=
      0
    ) {
      window.alert(
        'Add session duration first.'
      );

      return;
    }

    const individualRollSeconds =
      individualRolls.reduce(
        (
          total,
          roll
        ) =>
          total +
          roll.durationSeconds,
        0
      );

    if (
      individualRollSeconds >
      durationMinutes *
        60
    ) {
      window.alert(
        'Your individual roll time is longer than the full session. Increase session duration or shorten the rolls.'
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const date =
        mergeDateAndTime(
          sessionDate,
          sessionTime
        );

      const usingIndividualRolls =
        individualRolls.length >
        0;

      const finalRollCount =
        usingIndividualRolls
          ? individualRolls.length
          : rollCount;

      const finalSubmissionsFor =
        usingIndividualRolls
          ? individualRolls.reduce(
              (
                total,
                roll
              ) =>
                total +
                countSubmissionMap(
                  roll.submissionsFor
                ),
              0
            )
          : submissionsFor;

      const finalSubmissionsAgainst =
        usingIndividualRolls
          ? individualRolls.reduce(
              (
                total,
                roll
              ) =>
                total +
                countSubmissionMap(
                  roll.submissionsAgainst
                ),
              0
            )
          : submissionsAgainst;

      const session: TrainingSession =
        {
          id:
            Date.now().toString(),

          date:
            date.toISOString(),

          style,

          durationSeconds:
            Math.round(
              durationMinutes *
                60
            ),

          rollCount:
            finalRollCount,

          rolls:
            usingIndividualRolls
              ? individualRolls
              : [],

          submissionsFor:
            finalSubmissionsFor,

          submissionsAgainst:
            finalSubmissionsAgainst,

          averageHr:
            0,

          maxHr:
            0,

          techniques:
            techniqueLogs.map(
              (
                log
              ) => ({
                ...log,

                createdAt:
                  date.toISOString(),
              })
            ),

          sessionNotes:
            sessionNotes.trim(),

          ratings: {
            ...ratings,
          },
        };

      await saveSession(
        session
      );

      resetForm();

      await onSaved();

      onClose();

      window.alert(
        `${style} session saved.`
      );
    } catch (
      error
    ) {
      console.error(
        'QUICK LOG SAVE ERROR:',
        error
      );

      setSaving(
        false
      );

      window.alert(
        'Could not save session. Please try again.'
      );
    }
  }

  if (
    !visible
  ) {
    return null;
  }

  function renderRollScreen() {
    return (
      <>
        <div className="modal-topbar">
          <button
            type="button"
            className="text-button"
            onClick={
              cancelRollLogger
            }
          >
            ‹ Back
          </button>
        </div>

        <div className="eyebrow">
          QUICK LOG
        </div>

        <h2>
          {editingRollId
            ? 'Edit roll'
            : 'Add roll'}
        </h2>

        <p className="description">
          {editingRollId
            ? 'Update the details for this roll, then save your changes.'
            : 'Add the details you remember. Everything except duration can be left simple.'}
        </p>

        <div className="stack">
          <NumberStepper
            label="ROLL DURATION"
            value={
              rollDurationMinutes
            }
            onChange={
              setRollDurationMinutes
            }
            min={1}
            max={30}
            step={1}
            suffix="minutes"
            quickValues={[
              3,
              4,
              5,
              6,
              8,
              10,
            ]}
          />

          <div>
            <div className="section-title">
              Opponent name
            </div>

            <input
              className="text-input"
              value={
                rollOpponentName
              }
              onChange={(
                event
              ) =>
                setRollOpponentName(
                  event.target.value
                )
              }
              placeholder="Optional — name or nickname"
            />
          </div>

          <OptionSelector
            label="OPPONENT BELT"
            value={
              rollOpponentBelt
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
              setRollOpponentBelt
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

          <div>
            <div className="section-title">
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
                          addRollSubmission(
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
                            removeRollSubmission(
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
                          addRollSubmission(
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
                            removeRollSubmission(
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
            <div className="section-title">
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
            className="primary-action"
            onClick={
              saveIndividualRoll
            }
          >
            {editingRollId
              ? 'SAVE CHANGES'
              : 'ADD ROLL'}
          </button>
        </div>
      </>
    );
  }

  function renderTechniqueScreen() {
    return (
      <>
        <div className="modal-topbar">
          <button
            type="button"
            className="text-button"
            onClick={
              cancelTechniqueLogger
            }
          >
            ‹ Back
          </button>
        </div>

        <div className="eyebrow">
          QUICK LOG
        </div>

        <h2>
          Add technique
        </h2>

        <p className="description">
          Pick a technique and how you used it during this session.
        </p>

        <div className="section-title">
          Technique
        </div>

        <div className="technique-list">
          {techniques.map(
            (
              technique
            ) => {
              const active =
                selectedTechnique?.id ===
                technique.id;

              return (
                <button
                  key={
                    technique.id
                  }
                  type="button"
                  className={
                    active
                      ? 'technique-choice active'
                      : 'technique-choice'
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

        <div className="stack">
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

          <div>
            <div className="section-title">
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
              placeholder="Optional technique note..."
            />
          </div>

          <button
            type="button"
            className="primary-action"
            onClick={
              addTechniqueLog
            }
          >
            ADD TECHNIQUE
          </button>
        </div>
      </>
    );
  }

  function renderSessionScreen() {
    return (
      <>
        <div className="modal-topbar">
          <button
            type="button"
            className="text-button"
            onClick={
              closeModal
            }
          >
            Cancel
          </button>
        </div>

        <div className="eyebrow">
          MANUAL SESSION
        </div>

        <h2>
          Quick Log
        </h2>

        <p className="description">
          Add a completed training session without running the live timer.
        </p>

        <div className="stack">
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

          <PickerField
            label="DATE"
            value={formatDateForDisplay(
              sessionDate
            )}
            onPress={() =>
              setDatePickerVisible(
                true
              )
            }
          />

          <PickerField
            label="START TIME"
            value={formatTimeForDisplay(
              sessionTime
            )}
            onPress={() =>
              setTimePickerVisible(
                true
              )
            }
          />

          <NumberStepper
            label="SESSION DURATION"
            value={
              durationMinutes
            }
            onChange={
              setDurationMinutes
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

          <div className="section-block">
            <div className="section-title">
              Rolls
            </div>

            <div className="section-description">
              Use quick totals, or add each roll individually.
            </div>
          </div>

          {individualRolls.length ===
          0 ? (
            <>
              <NumberStepper
                label="ROLLS"
                value={
                  rollCount
                }
                onChange={
                  setRollCount
                }
                min={0}
                max={30}
                step={1}
                quickValues={[
                  3,
                  4,
                  5,
                  6,
                  8,
                  10,
                ]}
              />

              <NumberStepper
                label="SUBMISSIONS"
                value={
                  submissionsFor
                }
                onChange={
                  setSubmissionsFor
                }
                min={0}
                max={30}
                step={1}
                quickValues={[
                  0,
                  1,
                  2,
                  3,
                  4,
                  5,
                ]}
              />

              <NumberStepper
                label="CAUGHT"
                value={
                  submissionsAgainst
                }
                onChange={
                  setSubmissionsAgainst
                }
                min={0}
                max={30}
                step={1}
                quickValues={[
                  0,
                  1,
                  2,
                  3,
                  4,
                  5,
                ]}
              />
            </>
          ) : (
            <div className="roll-summary-card">
              <strong>
                Using individual rolls
              </strong>

              <span>
                {
                  individualRolls.length
                }{' '}
                {individualRolls.length ===
                1
                  ? 'roll'
                  : 'rolls'}{' '}
                ·{' '}
                {individualRolls.reduce(
                  (
                    total,
                    roll
                  ) =>
                    total +
                    countSubmissionMap(
                      roll.submissionsFor
                    ),
                  0
                )}{' '}
                submissions ·{' '}
                {individualRolls.reduce(
                  (
                    total,
                    roll
                  ) =>
                    total +
                    countSubmissionMap(
                      roll.submissionsAgainst
                    ),
                  0
                )}{' '}
                caught
              </span>
            </div>
          )}

          <div className="subheader-row">
            <div>
              <div className="section-title">
                Individual rolls
              </div>

              <div className="section-description">
                Optional · tap to edit
              </div>
            </div>

            <button
              type="button"
              className="secondary-action"
              onClick={
                openRollLogger
              }
            >
              + ADD ROLL
            </button>
          </div>

          <div className="logged-list">
            {individualRolls.map(
              (
                roll,
                index
              ) => (
                <div
                  className="logged-roll"
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
                  <button
                    type="button"
                    className="logged-main"
                    onClick={() =>
                      openRollEditor(
                        roll
                      )
                    }
                  >
                    <div>
                      <strong>
                        {roll.opponentName ||
                          `Roll ${index + 1}`}
                      </strong>

                      <span>
                        {roll.opponentName
                          ? `Roll ${index + 1} · `
                          : ''}
                        {
                          roll.opponentBelt
                        }{' '}
                        belt ·{' '}
                        {Math.round(
                          roll.durationSeconds /
                            60
                        )}
                        m
                      </span>

                      <small
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
                      </small>
                    </div>

                    <div className="roll-stats">
                      <strong>
                        {countSubmissionMap(
                          roll.submissionsFor
                        )}{' '}
                        for
                      </strong>

                      <span>
                        {countSubmissionMap(
                          roll.submissionsAgainst
                        )}{' '}
                        against
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="remove-button"
                    onClick={() =>
                      removeIndividualRoll(
                        roll.id
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              )
            )}
          </div>

          <div className="subheader-row">
            <div>
              <div className="section-title">
                Techniques
              </div>

              <div className="section-description">
                Optional
              </div>
            </div>

            <button
              type="button"
              className="secondary-action"
              onClick={
                openTechniqueLogger
              }
            >
              + ADD
            </button>
          </div>

          {techniqueLogs.length ===
          0 ? (
            <div className="empty-mini">
              No techniques added.
            </div>
          ) : (
            <div className="logged-list">
              {techniqueLogs.map(
                (
                  log
                ) => (
                  <div
                    className="logged-technique"
                    style={{
                      borderLeftColor:
                        activityColor(
                          log.activity
                        ),
                    }}
                    key={
                      log.id
                    }
                  >
                    <div>
                      <strong>
                        {
                          log.techniqueName
                        }
                      </strong>

                      <span>
                        {
                          log.category
                        }
                      </span>
                    </div>

                    <div className="technique-right">
                      <span
                        className="activity-badge"
                        style={{
                          color:
                            activityColor(
                              log.activity
                            ),

                          borderColor:
                            activityColor(
                              log.activity
                            ),
                        }}
                      >
                        {
                          log.activity
                        }
                      </span>

                      <button
                        type="button"
                        className="remove-button"
                        onClick={() =>
                          removeTechniqueLog(
                            log.id
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="section-block">
            <div className="section-title">
              How was training?
            </div>

            <div className="section-description">
              These ratings feed your long-term Stats trends.
            </div>
          </div>

          <RatingSelector
            label="Energy"
            value={
              ratings.energy
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
              ratings.performance
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
              ratings.technique
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
              ratings.conditioning
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

          <div>
            <div className="section-title">
              Session notes
            </div>

            <textarea
              className="textarea"
              value={
                sessionNotes
              }
              onChange={(
                event
              ) =>
                setSessionNotes(
                  event.target.value
                )
              }
              placeholder="What happened in class? What felt good? What needs work?"
            />
          </div>

          <button
            type="button"
            className="primary-action"
            disabled={
              saving
            }
            onClick={
              saveQuickSession
            }
          >
            {saving
              ? 'SAVING...'
              : 'SAVE SESSION'}
          </button>

          <div className="save-help">
            This will appear in Journal and Stats immediately.
          </div>
        </div>

        <DateTimePickerSheet
          visible={
            datePickerVisible
          }
          title="Training date"
          value={
            sessionDate
          }
          mode="date"
          onChange={(
            value
          ) => {
            setSessionDate(
              value
            );

            setDateTimeTouched(
              true
            );
          }}
          onClose={() =>
            setDatePickerVisible(
              false
            )
          }
        />

        <DateTimePickerSheet
          visible={
            timePickerVisible
          }
          title="Start time"
          value={
            sessionTime
          }
          mode="time"
          onChange={(
            value
          ) => {
            setSessionTime(
              value
            );

            setDateTimeTouched(
              true
            );
          }}
          onClose={() =>
            setTimePickerVisible(
              false
            )
          }
        />
      </>
    );
  }

  return (
    <div
      className="quick-modal-root"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="quick-modal-backdrop"
        aria-label="Close quick log"
        onClick={
          closeModal
        }
      />

      <div className="quick-modal-panel">
        <div className="quick-modal-handle" />

        <div className="quick-modal-scroll">
          {screenMode ===
          'technique'
            ? renderTechniqueScreen()
            : screenMode ===
                'roll'
              ? renderRollScreen()
              : renderSessionScreen()}

          <div className="bottom-space" />
        </div>
      </div>

      <style jsx>{`
        .quick-modal-root {
          position: fixed;
          inset: 0;
          z-index: 900;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 12px;
        }

        .quick-modal-backdrop {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .quick-modal-panel {
          position: relative;
          z-index: 1;
          width: min(100%, 720px);
          max-height: calc(100vh - 24px);
          overflow: hidden;
          border: 1px solid #292d33;
          border-radius: 24px 24px 18px 18px;
          background: #090a0c;
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.65);
        }

        .quick-modal-handle {
          width: 42px;
          height: 5px;
          margin: 9px auto 2px;
          border-radius: 999px;
          background: #41464e;
        }

        .quick-modal-scroll {
          max-height: calc(100vh - 45px);
          overflow-y: auto;
          padding: 12px 20px 30px;
        }

        .modal-topbar {
          min-height: 42px;
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .text-button {
          padding: 0;
          background: transparent;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .eyebrow {
          color: #777c85;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        h2 {
          margin: 5px 0 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.045em;
        }

        .description {
          margin: 9px 0 18px;
          color: #777c85;
          font-size: 13px;
          line-height: 1.55;
        }

        .stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .section-block {
          margin-top: 6px;
        }

        .section-title {
          margin-bottom: 9px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 850;
          letter-spacing: -0.02em;
        }

        .section-description {
          margin-top: -3px;
          color: #777c85;
          font-size: 11px;
          line-height: 1.5;
        }

        .subheader-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 6px;
        }

        .secondary-action {
          flex: 0 0 auto;
          min-height: 39px;
          padding: 0 13px;
          border: 1px solid #343840;
          border-radius: 12px;
          background: #17191d;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .primary-action {
          min-height: 56px;
          border-radius: 17px;
          background: #ffffff;
          color: #090a0c;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.05em;
          cursor: pointer;
        }

        .primary-action:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .save-help {
          margin-top: -7px;
          color: #555b63;
          font-size: 10px;
          line-height: 1.5;
          text-align: center;
        }

        .submission-heading {
          margin: 8px 0 10px;
          font-size: 10px;
          font-weight: 900;
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
          margin-bottom: 22px;
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

        .technique-list,
        .logged-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 18px;
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

        .technique-choice.active {
          background: #ffffff;
          color: #090a0c;
        }

        .technique-choice strong,
        .technique-choice span {
          display: block;
        }

        .technique-choice span {
          margin-top: 4px;
          color: #777c85;
          font-size: 9px;
        }

        .technique-choice.active span {
          color: #62666d;
        }

        .confidence {
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 900;
        }

        .roll-summary-card {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 15px;
          border: 1px solid #234c2b;
          border-radius: 16px;
          background: #111a14;
        }

        .roll-summary-card strong {
          color: #ffffff;
          font-size: 13px;
        }

        .roll-summary-card span {
          color: #777c85;
          font-size: 11px;
        }

        .logged-roll,
        .logged-technique {
          border: 1px solid #23262b;
          border-left: 3px solid;
          border-radius: 16px;
          background: #141619;
          overflow: hidden;
        }

        .logged-main {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 14px;
          background: transparent;
          color: #ffffff;
          text-align: left;
          cursor: pointer;
        }

        .logged-main strong,
        .logged-main span,
        .logged-main small {
          display: block;
        }

        .logged-main strong {
          font-size: 14px;
        }

        .logged-main span {
          margin-top: 4px;
          color: #777c85;
          font-size: 10px;
        }

        .logged-main small {
          margin-top: 5px;
          font-size: 10px;
          font-weight: 900;
        }

        .roll-stats {
          flex: 0 0 auto;
          text-align: right;
        }

        .roll-stats strong {
          color: #34c759;
          font-size: 11px;
        }

        .roll-stats span {
          color: #ff453a;
          font-size: 10px;
        }

        .remove-button {
          padding: 8px 12px;
          background: transparent;
          color: #ff6970;
          font-size: 10px;
          font-weight: 850;
          cursor: pointer;
        }

        .logged-technique {
          min-height: 66px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 13px 14px;
        }

        .logged-technique strong,
        .logged-technique span {
          display: block;
        }

        .logged-technique strong {
          color: #ffffff;
          font-size: 14px;
        }

        .logged-technique span {
          margin-top: 4px;
          color: #777c85;
          font-size: 9px;
        }

        .technique-right {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .activity-badge {
          margin: 0 !important;
          padding: 6px 8px;
          border: 1px solid;
          border-radius: 9px;
          font-size: 9px !important;
          font-weight: 900;
        }

        .empty-mini {
          padding: 15px;
          border: 1px solid #23262b;
          border-radius: 15px;
          background: #141619;
          color: #666b73;
          font-size: 12px;
        }

        .bottom-space {
          height: 50px;
        }

        @media (min-width: 760px) {
          .quick-modal-root {
            align-items: center;
            padding: 30px;
          }

          .quick-modal-panel {
            max-height: calc(100vh - 60px);
            border-radius: 24px;
          }

          .quick-modal-scroll {
            max-height: calc(100vh - 85px);
          }
        }
      `}</style>
    </div>
  );
}

