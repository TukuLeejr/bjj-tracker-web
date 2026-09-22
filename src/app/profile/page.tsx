'use client';

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  NumberStepper,
  OptionSelector,
  RatingSelector,
} from '@/components/input-controls';

import {
  addTechnique,
  deleteTechnique,
  exportBackupJson,
  getProfile,
  getTechniques,
  importBackupJson,
  saveProfile,
} from '@/lib/storage';

import type {
  Technique,
  UserProfile,
} from '@/lib/storage';

const BELTS = [
  'White',
  'Blue',
  'Purple',
  'Brown',
  'Black',
];

const STYLES: UserProfile['preferredStyle'][] = [
  'Gi',
  'No-Gi',
  'Both',
];

const CATEGORIES: Technique['category'][] = [
  'Submission',
  'Guard',
  'Pass',
  'Sweep',
  'Escape',
  'Takedown',
  'Position',
  'Other',
];

function confidenceText(
  level: number
) {
  if (level === 1) return 'Learning';
  if (level === 2) return 'Basic';
  if (level === 3) return 'Comfortable';
  if (level === 4) return 'Strong';
  return 'A-game';
}

function confidenceColor(
  level: number
) {
  if (level === 1) return '#FF453A';
  if (level === 2) return '#FF9F0A';
  if (level === 3) return '#FFD60A';
  if (level === 4) return '#34C759';
  return '#30D158';
}

function confidenceTint(
  level: number
) {
  if (level === 1) return 'rgba(255, 69, 58, 0.08)';
  if (level === 2) return 'rgba(255, 159, 10, 0.08)';
  if (level === 3) return 'rgba(255, 214, 10, 0.08)';
  if (level === 4) return 'rgba(52, 199, 89, 0.08)';
  return 'rgba(48, 209, 88, 0.08)';
}

function formatCreatedDate(
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

export default function ProfilePage() {
  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile>({
      belt: 'White',
      weightKg: '',
      gym: '',
      preferredStyle: 'Both',
      weeklySessionGoal: 4,
      weeklyMatMinutesGoal: 360,
    });

  const [
    techniquesOpen,
    setTechniquesOpen,
  ] =
    useState(false);

  const [
    techniques,
    setTechniques,
  ] =
    useState<Technique[]>([]);

  const [
    addingTechnique,
    setAddingTechnique,
  ] =
    useState(false);

  const [
    selectedTechnique,
    setSelectedTechnique,
  ] =
    useState<Technique | null>(
      null
    );

  const [
    techniqueName,
    setTechniqueName,
  ] =
    useState('');

  const [
    techniqueCategory,
    setTechniqueCategory,
  ] =
    useState<Technique['category']>(
      'Submission'
    );

  const [
    techniqueConfidence,
    setTechniqueConfidence,
  ] =
    useState(1);

  const [
    techniqueNotes,
    setTechniqueNotes,
  ] =
    useState('');

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const loadProfile =
    useCallback(
      async () => {
        const data =
          await getProfile();

        setProfile(
          data
        );
      },
      []
    );

  const loadTechniques =
    useCallback(
      async () => {
        const data =
          await getTechniques();

        setTechniques(
          data
        );
      },
      []
    );

  useEffect(() => {
    loadProfile();
    loadTechniques();

    function refresh() {
      loadProfile();
      loadTechniques();
    }

    window.addEventListener(
      'focus',
      refresh
    );

    return () => {
      window.removeEventListener(
        'focus',
        refresh
      );
    };
  }, [
    loadProfile,
    loadTechniques,
  ]);

  const parsedWeight =
    Number(
      profile.weightKg
    );

  const weightValue =
    Number.isFinite(
      parsedWeight
    ) &&
    parsedWeight >
      0
      ? parsedWeight
      : 0;

  const weeklyMatHours =
    profile.weeklyMatMinutesGoal /
    60;

  function updateWeight(
    value: number
  ) {
    if (
      value <=
      0
    ) {
      setProfile(
        (
          current
        ) => ({
          ...current,
          weightKg: '',
        })
      );

      return;
    }

    setProfile(
      (
        current
      ) => ({
        ...current,

        weightKg:
          Number.isInteger(
            value
          )
            ? String(
                value
              )
            : value.toFixed(
                1
              ),
      })
    );
  }

  function updateMatHours(
    hours: number
  ) {
    setProfile(
      (
        current
      ) => ({
        ...current,

        weeklyMatMinutesGoal:
          Math.round(
            hours *
              60
          ),
      })
    );
  }

  async function handleSave() {
    try {
      setSaving(
        true
      );

      await saveProfile(
        profile
      );

      window.alert(
        'Your profile and goals were updated.'
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function handleExportBackup() {
    try {
      await saveProfile(
        profile
      );

      const json =
        await exportBackupJson();

      const blob =
        new Blob(
          [
            json,
          ],
          {
            type: 'application/json',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          'a'
        );

      const stamp =
        new Date()
          .toISOString()
          .replace(
            /[:.]/g,
            '-'
          );

      anchor.href =
        url;

      anchor.download =
        `bjj-tracker-backup-${stamp}.json`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        url
      );
    } catch (
      error
    ) {
      console.error(
        'BACKUP EXPORT ERROR:',
        error
      );

      window.alert(
        error instanceof
        Error
          ? error.message
          : 'Could not export backup.'
      );
    }
  }

  async function handleImportBackup(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value =
      '';

    if (
      !file
    ) {
      return;
    }

    try {
      const json =
        await file.text();

      const confirmed =
        window.confirm(
          'Restore this backup? This will replace your current profile, techniques and training history.'
        );

      if (
        !confirmed
      ) {
        return;
      }

      await importBackupJson(
        json
      );

      setTechniquesOpen(
        false
      );

      setSelectedTechnique(
        null
      );

      setAddingTechnique(
        false
      );

      await Promise.all([
        loadProfile(),
        loadTechniques(),
      ]);

      window.alert(
        'Backup restored.'
      );
    } catch (
      error
    ) {
      console.error(
        'BACKUP IMPORT ERROR:',
        error
      );

      window.alert(
        error instanceof
        Error
          ? error.message
          : 'Could not restore this backup.'
      );
    }
  }

  function resetTechniqueForm() {
    setTechniqueName(
      ''
    );

    setTechniqueCategory(
      'Submission'
    );

    setTechniqueConfidence(
      1
    );

    setTechniqueNotes(
      ''
    );
  }

  async function handleSaveTechnique() {
    const cleanName =
      techniqueName.trim();

    if (
      !cleanName
    ) {
      window.alert(
        'Give the technique a name first.'
      );

      return;
    }

    const duplicate =
      techniques.some(
        (
          technique
        ) =>
          technique.name
            .trim()
            .toLowerCase() ===
          cleanName.toLowerCase()
      );

    if (
      duplicate
    ) {
      window.alert(
        'You already have a technique with this name.'
      );

      return;
    }

    const technique: Technique =
      {
        id:
          `${Date.now()}-${Math.random()}`,

        name:
          cleanName,

        category:
          techniqueCategory,

        confidence:
          techniqueConfidence,

        practiceCount:
          0,

        notes:
          techniqueNotes.trim(),

        createdAt:
          new Date().toISOString(),
      };

    const updated =
      await addTechnique(
        technique
      );

    setTechniques(
      updated
    );

    resetTechniqueForm();

    setAddingTechnique(
      false
    );
  }

  async function handleDeleteTechnique(
    technique: Technique
  ) {
    const confirmed =
      window.confirm(
        `Delete "${technique.name}"?`
      );

    if (
      !confirmed
    ) {
      return;
    }

    const updated =
      await deleteTechnique(
        technique.id
      );

    setTechniques(
      updated
    );

    if (
      selectedTechnique?.id ===
      technique.id
    ) {
      setSelectedTechnique(
        null
      );
    }
  }

  function closeTechniqueLibrary() {
    if (
      selectedTechnique
    ) {
      setSelectedTechnique(
        null
      );

      return;
    }

    if (
      addingTechnique
    ) {
      resetTechniqueForm();

      setAddingTechnique(
        false
      );

      return;
    }

    setTechniquesOpen(
      false
    );
  }

  return (
    <>
      <main className="profile-page">
        <div className="eyebrow">
          YOUR PROFILE
        </div>

        <h1>
          Profile
        </h1>

        <p className="subtitle">
          Set your BJJ details, goals and technique library.
        </p>

        <OptionSelector
          label="BELT"
          value={
            profile.belt
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
          onChange={(
            belt
          ) =>
            setProfile(
              (
                current
              ) => ({
                ...current,
                belt,
              })
            )
          }
        />

        <div className="spacer-small" />

        <OptionSelector
          label="PREFERRED STYLE"
          value={
            profile.preferredStyle
          }
          options={
            STYLES.map(
              (
                item
              ) => ({
                label:
                  item,

                value:
                  item,
              })
            )
          }
          onChange={(
            value
          ) =>
            setProfile(
              (
                current
              ) => ({
                ...current,

                preferredStyle:
                  value as
                    UserProfile['preferredStyle'],
              })
            )
          }
        />

        <h2>
          Details
        </h2>

        <div className="weight-card">
          <div className="card-top">
            <div>
              <div className="detail-eyebrow">
                BODY WEIGHT
              </div>

              <div className="detail-description">
                Track your current weight
              </div>
            </div>

            {weightValue >
            0 ? (
              <button
                type="button"
                className="clear-button"
                onClick={() =>
                  updateWeight(
                    0
                  )
                }
              >
                CLEAR
              </button>
            ) : null}
          </div>

          {weightValue >
          0 ? (
            <NumberStepper
              value={
                weightValue
              }
              onChange={
                updateWeight
              }
              min={30}
              max={200}
              step={0.5}
              suffix="kg"
            />
          ) : (
            <button
              type="button"
              className="set-weight-button"
              onClick={() =>
                updateWeight(
                  90
                )
              }
            >
              <strong>
                SET WEIGHT
              </strong>

              <span>
                Starts at 90 kg, then use − / +
              </span>
            </button>
          )}
        </div>

        <div className="gym-card">
          <div className="detail-eyebrow">
            GYM
          </div>

          <input
            className="gym-input"
            placeholder="Your gym"
            value={
              profile.gym
            }
            onChange={(
              event
            ) =>
              setProfile(
                (
                  current
                ) => ({
                  ...current,

                  gym:
                    event.target.value,
                })
              )
            }
          />
        </div>

        <h2>
          Weekly goals
        </h2>

        <div className="goal-card">
          <NumberStepper
            label="SESSIONS PER WEEK"
            value={
              profile.weeklySessionGoal
            }
            onChange={(
              weeklySessionGoal
            ) =>
              setProfile(
                (
                  current
                ) => ({
                  ...current,

                  weeklySessionGoal,
                })
              )
            }
            min={1}
            max={14}
            step={1}
            quickValues={[
              3,
              4,
              5,
              6,
              7,
            ]}
          />
        </div>

        <div className="goal-card">
          <NumberStepper
            label="MAT TIME PER WEEK"
            value={
              weeklyMatHours
            }
            onChange={
              updateMatHours
            }
            min={0.5}
            max={20}
            step={0.5}
            suffix="hours"
            quickValues={[
              3,
              4,
              5,
              6,
              8,
              10,
            ]}
          />

          <div className="goal-help">
            Adjusts in 30 minute increments
          </div>
        </div>

        <h2>
          Technique library
        </h2>

        <button
          type="button"
          className="library-button"
          onClick={() => {
            loadTechniques();

            setTechniquesOpen(
              true
            );
          }}
        >
          <div>
            <strong>
              My Techniques
            </strong>

            <span>
              Track your game, notes and confidence
            </span>
          </div>

          <b>
            ›
          </b>
        </button>

        <h2>
          Backup & data
        </h2>

        <div className="data-card">
          <button
            type="button"
            className="data-action"
            onClick={
              handleExportBackup
            }
          >
            <div>
              <strong>
                Export Backup
              </strong>

              <span>
                Save all BJJ Tracker data to a JSON file
              </span>
            </div>

            <b>
              ›
            </b>
          </button>

          <div className="data-divider" />

          <label className="data-action import-label">
            <div>
              <strong>
                Import Backup
              </strong>

              <span>
                Restore from a previous BJJ Tracker backup
              </span>
            </div>

            <b>
              ›
            </b>

            <input
              type="file"
              accept=".json,application/json"
              onChange={
                handleImportBackup
              }
            />
          </label>
        </div>

        <p className="data-warning">
          Importing a backup replaces your current profile, techniques and training history.
        </p>

        <button
          type="button"
          className="save-profile"
          disabled={
            saving
          }
          onClick={
            handleSave
          }
        >
          {saving
            ? 'SAVING...'
            : 'SAVE PROFILE'}
        </button>

        <div className="bottom-space" />
      </main>

      {techniquesOpen ? (
        <div
          className="technique-modal-root"
          role="dialog"
          aria-modal="true"
        >
          <div className="technique-backdrop" />

          <section className="technique-panel">
            <div className="technique-topbar">
              <button
                type="button"
                onClick={
                  closeTechniqueLibrary
                }
              >
                {selectedTechnique ||
                addingTechnique
                  ? '‹ Back'
                  : 'Close'}
              </button>

              {!addingTechnique &&
              !selectedTechnique ? (
                <button
                  type="button"
                  className="add-technique-top"
                  onClick={() =>
                    setAddingTechnique(
                      true
                    )
                  }
                >
                  + Add
                </button>
              ) : null}
            </div>

            <div className="technique-scroll">
              {selectedTechnique ? (
                <TechniqueDetail
                  technique={
                    selectedTechnique
                  }
                  onDelete={() =>
                    handleDeleteTechnique(
                      selectedTechnique
                    )
                  }
                />
              ) : (
                <>
                  <div className="eyebrow">
                    YOUR GAME
                  </div>

                  <h2 className="library-title">
                    Techniques
                  </h2>

                  <p className="library-subtitle">
                    Track what you're learning and build your own BJJ game over time.
                  </p>

                  {addingTechnique ? (
                    <div className="technique-form">
                      <h3>
                        New technique
                      </h3>

                      <div className="field-label">
                        TECHNIQUE NAME
                      </div>

                      <input
                        className="technique-name-input"
                        placeholder="e.g. Triangle choke"
                        value={
                          techniqueName
                        }
                        onChange={(
                          event
                        ) =>
                          setTechniqueName(
                            event.target.value
                          )
                        }
                      />

                      <OptionSelector
                        label="CATEGORY"
                        value={
                          techniqueCategory
                        }
                        options={
                          CATEGORIES.map(
                            (
                              item
                            ) => ({
                              label:
                                item,

                              value:
                                item,
                            })
                          )
                        }
                        onChange={(
                          value
                        ) =>
                          setTechniqueCategory(
                            value as
                              Technique['category']
                          )
                        }
                      />

                      <RatingSelector
                        label="Confidence"
                        value={
                          techniqueConfidence
                        }
                        onChange={
                          setTechniqueConfidence
                        }
                      />

                      <div
                        className="confidence-summary"
                        style={{
                          borderColor:
                            confidenceColor(
                              techniqueConfidence
                            ),

                          background:
                            confidenceTint(
                              techniqueConfidence
                            ),
                        }}
                      >
                        <span>
                          CURRENT LEVEL
                        </span>

                        <strong
                          style={{
                            color:
                              confidenceColor(
                                techniqueConfidence
                              ),
                          }}
                        >
                          {confidenceText(
                            techniqueConfidence
                          )}
                        </strong>
                      </div>

                      <div className="field-label">
                        NOTES
                      </div>

                      <textarea
                        className="technique-notes-input"
                        placeholder="Details, cues, setups, things to remember..."
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
                      />

                      <button
                        type="button"
                        className="save-technique"
                        onClick={
                          handleSaveTechnique
                        }
                      >
                        SAVE TECHNIQUE
                      </button>

                      <button
                        type="button"
                        className="cancel-technique"
                        onClick={() => {
                          resetTechniqueForm();

                          setAddingTechnique(
                            false
                          );
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : techniques.length ===
                    0 ? (
                    <div className="technique-empty">
                      <div>
                        🎯
                      </div>

                      <strong>
                        No techniques yet
                      </strong>

                      <span>
                        Start building your personal BJJ technique library.
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setAddingTechnique(
                            true
                          )
                        }
                      >
                        ADD FIRST TECHNIQUE
                      </button>
                    </div>
                  ) : (
                    <div className="technique-list">
                      {techniques.map(
                        (
                          technique
                        ) => {
                          const color =
                            confidenceColor(
                              technique.confidence
                            );

                          return (
                            <button
                              key={
                                technique.id
                              }
                              type="button"
                              className="technique-card"
                              style={{
                                borderLeftColor:
                                  color,

                                background:
                                  confidenceTint(
                                    technique.confidence
                                  ),
                              }}
                              onClick={() =>
                                setSelectedTechnique(
                                  technique
                                )
                              }
                            >
                              <div className="technique-card-top">
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
                                  className="confidence-badge"
                                  style={{
                                    borderColor:
                                      color,
                                  }}
                                >
                                  <i
                                    style={{
                                      background:
                                        color,
                                    }}
                                  />

                                  <strong
                                    style={{
                                      color,
                                    }}
                                  >
                                    {
                                      technique.confidence
                                    }
                                  </strong>

                                  <span>
                                    /5
                                  </span>
                                </div>
                              </div>

                              <div className="technique-meta">
                                <strong
                                  style={{
                                    color,
                                  }}
                                >
                                  {confidenceText(
                                    technique.confidence
                                  )}
                                </strong>

                                <span>
                                  Practiced{' '}
                                  {
                                    technique.practiceCount
                                  }{' '}
                                  {technique.practiceCount ===
                                  1
                                    ? 'time'
                                    : 'times'}
                                </span>
                              </div>

                              {technique.notes ? (
                                <div className="notes-preview">
                                  <small>
                                    NOTES
                                  </small>

                                  <p>
                                    {
                                      technique.notes
                                    }
                                  </p>
                                </div>
                              ) : null}

                              <div className="open-technique">
                                OPEN ›
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="technique-bottom-space" />
            </div>
          </section>
        </div>
      ) : null}

      <style jsx>{`
        .profile-page {
          width: 100%;
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

        .subtitle {
          margin: 7px 0 22px;
          color: #777c85;
          font-size: 13px;
        }

        .spacer-small {
          height: 5px;
        }

        h2 {
          margin: 28px 0 12px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 900;
        }

        .weight-card,
        .gym-card,
        .goal-card {
          border: 1px solid #2a2d33;
          border-radius: 20px;
          background: #141619;
        }

        .weight-card,
        .goal-card {
          padding: 17px;
        }

        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .detail-eyebrow {
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .detail-description {
          margin-top: 4px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 850;
        }

        .clear-button {
          padding: 7px 10px;
          border: 1px solid #343840;
          border-radius: 9px;
          background: transparent;
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
          cursor: pointer;
        }

        .set-weight-button {
          width: 100%;
          min-height: 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: 15px;
          border: 1px solid #343840;
          border-radius: 14px;
          background: transparent;
          cursor: pointer;
        }

        .set-weight-button strong {
          color: #ffffff;
          font-size: 12px;
        }

        .set-weight-button span {
          margin-top: 5px;
          color: #777c85;
          font-size: 9px;
        }

        .gym-card {
          padding: 17px 17px 8px;
          margin-top: 12px;
        }

        .gym-input {
          width: 100%;
          min-height: 48px;
          padding: 8px 0;
          border: 0;
          background: transparent;
          color: #ffffff;
          font-size: 19px;
          font-weight: 850;
          outline: none;
        }

        .goal-card {
          margin-bottom: 12px;
        }

        .goal-help {
          margin-top: 11px;
          color: #646a72;
          font-size: 10px;
          text-align: center;
        }

        .library-button {
          width: 100%;
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 18px;
          border: 1px solid #34c759;
          border-radius: 20px;
          background: #141619;
          text-align: left;
          cursor: pointer;
        }

        .library-button strong,
        .library-button span {
          display: block;
        }

        .library-button strong {
          color: #ffffff;
          font-size: 17px;
        }

        .library-button span {
          margin-top: 4px;
          color: #777c85;
          font-size: 12px;
        }

        .library-button b {
          color: #777c85;
          font-size: 30px;
        }

        .data-card {
          overflow: hidden;
          border: 1px solid #1d2024;
          border-radius: 18px;
          background: #101214;
        }

        .data-action {
          width: 100%;
          min-height: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 17px;
          border: 0;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        .data-action strong,
        .data-action span {
          display: block;
        }

        .data-action strong {
          color: #d7d9dd;
          font-size: 15px;
        }

        .data-action span {
          margin-top: 4px;
          color: #777c85;
          font-size: 11px;
          line-height: 1.5;
        }

        .data-action b {
          color: #777c85;
          font-size: 30px;
        }

        .data-divider {
          height: 1px;
          margin-left: 17px;
          background: #23262b;
        }

        .import-label {
          position: relative;
        }

        .import-label input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }

        .data-warning {
          margin: 9px 4px 0;
          color: #646a72;
          font-size: 10px;
          line-height: 1.6;
        }

        .save-profile {
          width: 100%;
          min-height: 58px;
          margin-top: 18px;
          border-radius: 18px;
          background: #ffffff;
          color: #090a0c;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.05em;
          cursor: pointer;
        }

        .save-profile:disabled {
          opacity: 0.5;
        }

        .bottom-space {
          height: 70px;
        }

        .technique-modal-root {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 12px;
        }

        .technique-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .technique-panel {
          position: relative;
          z-index: 1;
          width: min(100%, 760px);
          max-height: calc(100vh - 24px);
          overflow: hidden;
          border: 1px solid #292d33;
          border-radius: 24px 24px 18px 18px;
          background: #090a0c;
        }

        .technique-topbar {
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-bottom: 1px solid #1f2227;
        }

        .technique-topbar button {
          background: transparent;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .technique-topbar .add-technique-top {
          color: #34c759;
        }

        .technique-scroll {
          max-height: calc(100vh - 82px);
          overflow-y: auto;
          padding: 20px;
        }

        .library-title {
          margin: 5px 0 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .library-subtitle {
          margin: 8px 0 24px;
          color: #777c85;
          font-size: 13px;
          line-height: 1.55;
        }

        .technique-form {
          padding: 18px;
          border: 1px solid #23262b;
          border-radius: 20px;
          background: #141619;
        }

        .technique-form h3 {
          margin: 0 0 18px;
          color: #ffffff;
          font-size: 21px;
        }

        .field-label {
          margin: 20px 0 9px;
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .technique-name-input,
        .technique-notes-input {
          width: 100%;
          border: 1px solid #2b2f35;
          border-radius: 16px;
          background: #090a0c;
          color: #ffffff;
          outline: none;
        }

        .technique-name-input {
          min-height: 55px;
          padding: 0 15px;
          font-size: 17px;
          font-weight: 800;
        }

        .technique-notes-input {
          min-height: 118px;
          padding: 14px;
          resize: vertical;
          font-size: 14px;
        }

        .confidence-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 11px 13px;
          margin-top: 8px;
          border: 1px solid;
          border-radius: 13px;
        }

        .confidence-summary span {
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .confidence-summary strong {
          font-size: 13px;
        }

        .save-technique {
          width: 100%;
          min-height: 54px;
          margin-top: 18px;
          border-radius: 17px;
          background: #ffffff;
          color: #090a0c;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
        }

        .cancel-technique {
          width: 100%;
          min-height: 46px;
          background: transparent;
          color: #777c85;
          font-weight: 750;
          cursor: pointer;
        }

        .technique-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px;
          border: 1px solid #23262b;
          border-radius: 20px;
          background: #141619;
          text-align: center;
        }

        .technique-empty > div {
          font-size: 35px;
        }

        .technique-empty strong {
          margin-top: 12px;
          color: #ffffff;
          font-size: 18px;
        }

        .technique-empty span {
          margin-top: 5px;
          color: #777c85;
          font-size: 13px;
        }

        .technique-empty button {
          min-height: 42px;
          padding: 0 16px;
          margin-top: 18px;
          border-radius: 13px;
          background: #ffffff;
          color: #090a0c;
          font-size: 12px;
          font-weight: 950;
          cursor: pointer;
        }

        .technique-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .technique-card {
          width: 100%;
          padding: 18px;
          border: 1px solid #23262b;
          border-left: 4px solid;
          border-radius: 20px;
          color: #ffffff;
          text-align: left;
          cursor: pointer;
        }

        .technique-card-top,
        .technique-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .technique-card-top > div:first-child strong,
        .technique-card-top > div:first-child span {
          display: block;
        }

        .technique-card-top > div:first-child strong {
          font-size: 18px;
        }

        .technique-card-top > div:first-child span {
          margin-top: 4px;
          color: #777c85;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .confidence-badge {
          min-width: 67px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 10px;
          border: 1px solid;
          border-radius: 12px;
        }

        .confidence-badge i {
          width: 8px;
          height: 8px;
          margin-right: 3px;
          border-radius: 50%;
        }

        .confidence-badge strong {
          font-size: 18px;
        }

        .confidence-badge span {
          color: #777c85;
          font-size: 10px;
          font-weight: 800;
        }

        .technique-meta {
          margin-top: 14px;
        }

        .technique-meta strong {
          font-size: 12px;
        }

        .technique-meta span {
          color: #666b73;
          font-size: 11px;
        }

        .notes-preview {
          padding: 13px;
          margin-top: 12px;
          border-radius: 13px;
          background: #0e1012;
        }

        .notes-preview small {
          color: #5f646b;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .notes-preview p {
          margin: 5px 0 0;
          color: #c9ccd1;
          font-size: 13px;
          line-height: 1.5;
        }

        .open-technique {
          margin-top: 13px;
          color: #a4a9b0;
          font-size: 10px;
          font-weight: 900;
          text-align: right;
        }

        .technique-bottom-space {
          height: 50px;
        }

        @media (min-width: 760px) {
          .technique-modal-root {
            align-items: center;
            padding: 30px;
          }

          .technique-panel {
            max-height: calc(100vh - 60px);
            border-radius: 24px;
          }

          .technique-scroll {
            max-height: calc(100vh - 118px);
          }
        }
      `}</style>
    </>
  );
}

function TechniqueDetail({
  technique,
  onDelete,
}: {
  technique: Technique;
  onDelete: () => void;
}) {
  const color =
    confidenceColor(
      technique.confidence
    );

  return (
    <div>
      <div className="detail-eyebrow-local">
        TECHNIQUE
      </div>

      <h2 className="detail-title-local">
        {technique.name}
      </h2>

      <div className="detail-meta-local">
        <span>
          {technique.category}
        </span>

        <b
          style={{
            color,
            borderColor:
              color,
            background:
              confidenceTint(
                technique.confidence
              ),
          }}
        >
          {technique.confidence}/5
        </b>
      </div>

      <div
        className="confidence-card-local"
        style={{
          borderColor:
            color,
          background:
            confidenceTint(
              technique.confidence
            ),
        }}
      >
        <span>
          CONFIDENCE
        </span>

        <strong
          style={{
            color,
          }}
        >
          {confidenceText(
            technique.confidence
          )}
        </strong>

        <div className="scale-local">
          {[
            1,
            2,
            3,
            4,
            5,
          ].map(
            (
              level
            ) => (
              <div
                key={
                  level
                }
              >
                <i
                  style={{
                    background:
                      level <=
                      technique.confidence
                        ? confidenceColor(
                            level
                          )
                        : '#2b2e33',
                  }}
                />

                <small>
                  {
                    level
                  }
                </small>
              </div>
            )
          )}
        </div>
      </div>

      <div className="stats-local">
        <div>
          <strong>
            {
              technique.practiceCount
            }
          </strong>

          <span>
            PRACTICES
          </span>
        </div>

        <div>
          <strong>
            {formatCreatedDate(
              technique.createdAt
            )}
          </strong>

          <span>
            ADDED
          </span>
        </div>
      </div>

      <h3 className="notes-heading-local">
        Notes
      </h3>

      <div className="notes-card-local">
        {technique.notes ? (
          technique.notes
        ) : (
          <span>
            No notes added for this technique yet.
          </span>
        )}
      </div>

      <button
        type="button"
        className="delete-local"
        onClick={
          onDelete
        }
      >
        DELETE TECHNIQUE
      </button>

      <style jsx>{`
        .detail-eyebrow-local {
          color: #777c85;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
        }

        .detail-title-local {
          margin: 5px 0 0;
          color: #ffffff;
          font-size: 34px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .detail-meta-local {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 15px 0 24px;
        }

        .detail-meta-local > span {
          padding: 8px 11px;
          border-radius: 10px;
          background: #1c1f23;
          color: #a3a7ae;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .detail-meta-local b {
          padding: 8px 11px;
          border: 1px solid;
          border-radius: 10px;
          font-size: 11px;
        }

        .confidence-card-local {
          padding: 18px;
          border: 1px solid;
          border-radius: 20px;
        }

        .confidence-card-local > span {
          color: #777c85;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .confidence-card-local > strong {
          display: block;
          margin-top: 10px;
          font-size: 21px;
        }

        .scale-local {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          margin-top: 18px;
        }

        .scale-local div {
          text-align: center;
        }

        .scale-local i {
          display: block;
          height: 5px;
          border-radius: 999px;
        }

        .scale-local small {
          display: block;
          margin-top: 6px;
          color: #686d75;
          font-size: 9px;
          font-weight: 800;
        }

        .stats-local {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .stats-local div {
          min-height: 90px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 15px;
          border: 1px solid #23262b;
          border-radius: 18px;
          background: #141619;
        }

        .stats-local strong {
          color: #ffffff;
          font-size: 20px;
          font-weight: 900;
        }

        .stats-local span {
          margin-top: 5px;
          color: #666b73;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .notes-heading-local {
          margin: 28px 0 10px;
          color: #ffffff;
          font-size: 18px;
        }

        .notes-card-local {
          min-height: 130px;
          padding: 17px;
          border: 1px solid #23262b;
          border-radius: 18px;
          background: #141619;
          color: #d4d6da;
          font-size: 15px;
          line-height: 1.55;
        }

        .notes-card-local span {
          color: #686d75;
          font-size: 13px;
        }

        .delete-local {
          width: 100%;
          min-height: 50px;
          margin-top: 24px;
          border: 1px solid #4a2324;
          border-radius: 16px;
          background: #1b1112;
          color: #ff453a;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}


