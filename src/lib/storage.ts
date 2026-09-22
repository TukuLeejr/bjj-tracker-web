'use client';

import {
  createBrowserClient,
} from '@supabase/ssr';

export type SubmissionCounts = {
  [submission: string]: number;
};

export type RollDifficulty =
  | 'Easy'
  | 'Competitive'
  | 'Hard';

export type Roll = {
  id: string;
  durationSeconds: number;
  opponentName?: string;
  opponentBelt: string;
  submissionsFor: SubmissionCounts;
  submissionsAgainst: SubmissionCounts;
  notes: string;
  difficulty?: RollDifficulty;
};

export type TechniqueActivity =
  | 'Drilled'
  | 'Attempted'
  | 'Hit';

export type TechniqueLog = {
  id: string;
  techniqueId: string;
  techniqueName: string;
  category: string;
  activity: TechniqueActivity;
  notes: string;
  createdAt: string;
};

export type SessionRatings = {
  energy: number;
  performance: number;
  technique: number;
  conditioning: number;
};

export type TrainingSession = {
  id: string;
  date: string;
  style: 'Gi' | 'No-Gi';
  durationSeconds: number;
  rollCount: number;
  rolls: Roll[];
  submissionsFor: number;
  submissionsAgainst: number;
  averageHr: number;
  maxHr: number;
  techniques?: TechniqueLog[];
  sessionNotes?: string;
  isFavorite?: boolean;
  ratings?: SessionRatings;
};

export type UserProfile = {
  belt: string;
  weightKg: string;
  gym: string;
  preferredStyle:
    | 'Gi'
    | 'No-Gi'
    | 'Both';
  weeklySessionGoal: number;
  weeklyMatMinutesGoal: number;
};

export type Technique = {
  id: string;
  name: string;
  category:
    | 'Submission'
    | 'Guard'
    | 'Pass'
    | 'Sweep'
    | 'Escape'
    | 'Takedown'
    | 'Position'
    | 'Other';
  confidence: number;
  practiceCount: number;
  notes: string;
  createdAt: string;
};

export type BackupData = {
  app: 'BJJ Tracker';
  version: 1;
  exportedAt: string;
  profile: UserProfile;
  techniques: Technique[];
  sessions: TrainingSession[];
};

type CloudRow = {
  user_id: string;
  profile: unknown;
  techniques: unknown;
  sessions: unknown;
  updated_at?: string;
};

const SESSION_KEY =
  'bjj_sessions_v3';

const PROFILE_KEY =
  'bjj_profile_v1';

const TECHNIQUE_KEY =
  'bjj_techniques_v1';

const MIGRATION_KEY =
  'bjj_supabase_migration_v1';

const DEFAULT_PROFILE: UserProfile = {
  belt: 'White',
  weightKg: '',
  gym: '',
  preferredStyle: 'Both',
  weeklySessionGoal: 4,
  weeklyMatMinutesGoal: 360,
};

const TECHNIQUE_CATEGORIES: Technique['category'][] = [
  'Submission',
  'Guard',
  'Pass',
  'Sweep',
  'Escape',
  'Takedown',
  'Position',
  'Other',
];

function createSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function stringValue(
  value: unknown,
  fallback = ''
) {
  return typeof value === 'string'
    ? value
    : fallback;
}

function finiteNumber(
  value: unknown,
  fallback = 0
) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
    ? value
    : fallback;
}

function nonNegativeNumber(
  value: unknown,
  fallback = 0
) {
  return Math.max(
    0,
    finiteNumber(
      value,
      fallback
    )
  );
}

function wholeNumber(
  value: unknown,
  fallback = 0
) {
  return Math.round(
    nonNegativeNumber(
      value,
      fallback
    )
  );
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}

function validDateString(
  value: unknown
) {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const timestamp =
    new Date(
      value
    ).getTime();

  return Number.isFinite(
    timestamp
  )
    ? value
    : null;
}

function normalizeSubmissionCounts(
  value: unknown
): SubmissionCounts {
  if (
    !isRecord(
      value
    )
  ) {
    return {};
  }

  const result: SubmissionCounts = {};

  Object.entries(
    value
  ).forEach(
    ([
      submission,
      count,
    ]) => {
      const normalizedCount =
        wholeNumber(
          count
        );

      if (
        normalizedCount > 0
      ) {
        result[
          submission
        ] =
          normalizedCount;
      }
    }
  );

  return result;
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
      total + count,
    0
  );
}

function normalizeDifficulty(
  value: unknown
): RollDifficulty | undefined {
  if (
    value === 'Easy' ||
    value === 'Competitive' ||
    value === 'Hard'
  ) {
    return value;
  }

  return undefined;
}

function normalizeActivity(
  value: unknown
): TechniqueActivity {
  if (
    value === 'Attempted' ||
    value === 'Hit'
  ) {
    return value;
  }

  return 'Drilled';
}

function normalizeRatings(
  value: unknown
): SessionRatings | undefined {
  if (
    !isRecord(
      value
    )
  ) {
    return undefined;
  }

  return {
    energy:
      clamp(
        wholeNumber(
          value.energy,
          3
        ),
        1,
        5
      ),

    performance:
      clamp(
        wholeNumber(
          value.performance,
          3
        ),
        1,
        5
      ),

    technique:
      clamp(
        wholeNumber(
          value.technique,
          3
        ),
        1,
        5
      ),

    conditioning:
      clamp(
        wholeNumber(
          value.conditioning,
          3
        ),
        1,
        5
      ),
  };
}

function normalizeRoll(
  value: unknown,
  fallbackId: string
): Roll | null {
  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  const id =
    stringValue(
      value.id
    ).trim() ||
    fallbackId;

  const opponentName =
    stringValue(
      value.opponentName
    ).trim();

  const difficulty =
    normalizeDifficulty(
      value.difficulty
    );

  return {
    id,

    durationSeconds:
      wholeNumber(
        value.durationSeconds
      ),

    ...(opponentName
      ? {
          opponentName,
        }
      : {}),

    opponentBelt:
      stringValue(
        value.opponentBelt,
        'Unknown'
      ) || 'Unknown',

    submissionsFor:
      normalizeSubmissionCounts(
        value.submissionsFor
      ),

    submissionsAgainst:
      normalizeSubmissionCounts(
        value.submissionsAgainst
      ),

    notes:
      stringValue(
        value.notes
      ),

    ...(difficulty
      ? {
          difficulty,
        }
      : {}),
  };
}

function normalizeTechniqueLog(
  value: unknown,
  fallbackId: string
): TechniqueLog | null {
  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  const techniqueName =
    stringValue(
      value.techniqueName
    ).trim();

  if (
    !techniqueName
  ) {
    return null;
  }

  return {
    id:
      stringValue(
        value.id
      ).trim() ||
      fallbackId,

    techniqueId:
      stringValue(
        value.techniqueId
      ),

    techniqueName,

    category:
      stringValue(
        value.category,
        'Other'
      ) || 'Other',

    activity:
      normalizeActivity(
        value.activity
      ),

    notes:
      stringValue(
        value.notes
      ),

    createdAt:
      validDateString(
        value.createdAt
      ) ||
      new Date().toISOString(),
  };
}

function normalizeSession(
  value: unknown,
  index = 0
): TrainingSession | null {
  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  const date =
    validDateString(
      value.date
    );

  if (
    !date
  ) {
    return null;
  }

  const id =
    stringValue(
      value.id
    ).trim() ||
    `legacy-session-${index}-${new Date(
      date
    ).getTime()}`;

  const rolls =
    Array.isArray(
      value.rolls
    )
      ? value.rolls
          .map(
            (
              roll,
              rollIndex
            ) =>
              normalizeRoll(
                roll,
                `${id}-roll-${rollIndex}`
              )
          )
          .filter(
            (
              roll
            ): roll is Roll =>
              roll !== null
          )
      : [];

  const techniques =
    Array.isArray(
      value.techniques
    )
      ? value.techniques
          .map(
            (
              technique,
              techniqueIndex
            ) =>
              normalizeTechniqueLog(
                technique,
                `${id}-technique-${techniqueIndex}`
              )
          )
          .filter(
            (
              technique
            ): technique is TechniqueLog =>
              technique !== null
          )
      : [];

  const detailedRollsPresent =
    rolls.length > 0;

  const submissionsFor =
    detailedRollsPresent
      ? rolls.reduce(
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
      : wholeNumber(
          value.submissionsFor
        );

  const submissionsAgainst =
    detailedRollsPresent
      ? rolls.reduce(
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
      : wholeNumber(
          value.submissionsAgainst
        );

  const sessionNotes =
    stringValue(
      value.sessionNotes
    );

  const ratings =
    normalizeRatings(
      value.ratings
    );

  return {
    id,
    date,

    style:
      value.style === 'Gi'
        ? 'Gi'
        : 'No-Gi',

    durationSeconds:
      wholeNumber(
        value.durationSeconds
      ),

    rollCount:
      detailedRollsPresent
        ? rolls.length
        : wholeNumber(
            value.rollCount
          ),

    rolls,

    submissionsFor,

    submissionsAgainst,

    averageHr:
      wholeNumber(
        value.averageHr
      ),

    maxHr:
      wholeNumber(
        value.maxHr
      ),

    ...(techniques.length > 0
      ? {
          techniques,
        }
      : {}),

    ...(sessionNotes
      ? {
          sessionNotes,
        }
      : {}),

    ...(typeof value.isFavorite === 'boolean'
      ? {
          isFavorite:
            value.isFavorite,
        }
      : {}),

    ...(ratings
      ? {
          ratings,
        }
      : {}),
  };
}

function normalizeSessions(
  value: unknown
): TrainingSession[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .map(
      (
        session,
        index
      ) =>
        normalizeSession(
          session,
          index
        )
    )
    .filter(
      (
        session
      ): session is TrainingSession =>
        session !== null
    );
}

function normalizeProfile(
  value: unknown
): UserProfile {
  if (
    !isRecord(
      value
    )
  ) {
    return {
      ...DEFAULT_PROFILE,
    };
  }

  const preferredStyle =
    value.preferredStyle === 'Gi' ||
    value.preferredStyle === 'No-Gi' ||
    value.preferredStyle === 'Both'
      ? value.preferredStyle
      : DEFAULT_PROFILE.preferredStyle;

  return {
    belt:
      stringValue(
        value.belt,
        DEFAULT_PROFILE.belt
      ) ||
      DEFAULT_PROFILE.belt,

    weightKg:
      stringValue(
        value.weightKg,
        DEFAULT_PROFILE.weightKg
      ),

    gym:
      stringValue(
        value.gym,
        DEFAULT_PROFILE.gym
      ),

    preferredStyle,

    weeklySessionGoal:
      clamp(
        wholeNumber(
          value.weeklySessionGoal,
          DEFAULT_PROFILE.weeklySessionGoal
        ),
        1,
        14
      ),

    weeklyMatMinutesGoal:
      clamp(
        wholeNumber(
          value.weeklyMatMinutesGoal,
          DEFAULT_PROFILE.weeklyMatMinutesGoal
        ),
        30,
        1200
      ),
  };
}

function normalizeTechnique(
  value: unknown,
  index = 0
): Technique | null {
  if (
    !isRecord(
      value
    )
  ) {
    return null;
  }

  const name =
    stringValue(
      value.name
    ).trim();

  if (
    !name
  ) {
    return null;
  }

  const category =
    TECHNIQUE_CATEGORIES.includes(
      value.category as Technique['category']
    )
      ? (
          value.category as Technique['category']
        )
      : 'Other';

  return {
    id:
      stringValue(
        value.id
      ).trim() ||
      `legacy-technique-${index}-${name}`,

    name,

    category,

    confidence:
      clamp(
        wholeNumber(
          value.confidence,
          1
        ),
        1,
        5
      ),

    practiceCount:
      wholeNumber(
        value.practiceCount
      ),

    notes:
      stringValue(
        value.notes
      ),

    createdAt:
      validDateString(
        value.createdAt
      ) ||
      new Date().toISOString(),
  };
}

function normalizeTechniques(
  value: unknown
): Technique[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .map(
      (
        technique,
        index
      ) =>
        normalizeTechnique(
          technique,
          index
        )
    )
    .filter(
      (
        technique
      ): technique is Technique =>
        technique !== null
    );
}

function calculateTechniquePracticeCounts(
  techniques: Technique[],
  sessions: TrainingSession[]
) {
  const counts: {
    [techniqueId: string]: number;
  } = {};

  sessions.forEach(
    (
      session
    ) => {
      session.techniques?.forEach(
        (
          log
        ) => {
          if (
            !log.techniqueId
          ) {
            return;
          }

          counts[
            log.techniqueId
          ] =
            (
              counts[
                log.techniqueId
              ] || 0
            ) + 1;
        }
      );
    }
  );

  return techniques.map(
    (
      technique
    ) => ({
      ...technique,

      practiceCount:
        counts[
          technique.id
        ] || 0,
    })
  );
}

function isValidBackup(
  value: unknown
): value is BackupData {
  if (
    !isRecord(
      value
    )
  ) {
    return false;
  }

  return (
    value.app === 'BJJ Tracker' &&
    value.version === 1 &&
    typeof value.exportedAt === 'string' &&
    isRecord(
      value.profile
    ) &&
    Array.isArray(
      value.techniques
    ) &&
    Array.isArray(
      value.sessions
    )
  );
}

function getLocalJson(
  key: string
): unknown {
  try {
    const raw =
      window.localStorage.getItem(
        key
      );

    return raw
      ? JSON.parse(
          raw
        )
      : null;
  } catch {
    return null;
  }
}

function setLocalJson(
  key: string,
  value: unknown
) {
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(
        value
      )
    );
  } catch {
    // Local cache is optional.
  }
}

function cacheAll(
  profile: UserProfile,
  techniques: Technique[],
  sessions: TrainingSession[]
) {
  setLocalJson(
    PROFILE_KEY,
    profile
  );

  setLocalJson(
    TECHNIQUE_KEY,
    techniques
  );

  setLocalJson(
    SESSION_KEY,
    sessions
  );
}

async function getCurrentUserId() {
  const supabase =
    createSupabase();

  const {
    data,
    error,
  } =
    await supabase.auth.getUser();

  if (
    error
  ) {
    throw error;
  }

  if (
    !data.user
  ) {
    throw new Error(
      'You are not signed in.'
    );
  }

  return {
    supabase,
    userId:
      data.user.id,
  };
}

async function ensureCloudRow(): Promise<CloudRow> {
  const {
    supabase,
    userId,
  } =
    await getCurrentUserId();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        'bjj_user_data'
      )
      .select(
        'user_id, profile, techniques, sessions, updated_at'
      )
      .eq(
        'user_id',
        userId
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  if (
    data
  ) {
    const normalizedProfile =
      normalizeProfile(
        data.profile
      );

    const normalizedSessions =
      normalizeSessions(
        data.sessions
      );

    const normalizedTechniques =
      normalizeTechniques(
        data.techniques
      );

    cacheAll(
      normalizedProfile,
      normalizedTechniques,
      normalizedSessions
    );

    return {
      user_id:
        userId,
      profile:
        normalizedProfile,
      techniques:
        normalizedTechniques,
      sessions:
        normalizedSessions,
      updated_at:
        data.updated_at,
    };
  }

  const localProfile =
    normalizeProfile(
      getLocalJson(
        PROFILE_KEY
      )
    );

  const localSessions =
    normalizeSessions(
      getLocalJson(
        SESSION_KEY
      )
    );

  const localTechniques =
    normalizeTechniques(
      getLocalJson(
        TECHNIQUE_KEY
      )
    );

  const {
    data:
      inserted,
    error:
      insertError,
  } =
    await supabase
      .from(
        'bjj_user_data'
      )
      .insert({
        user_id:
          userId,
        profile:
          localProfile,
        techniques:
          localTechniques,
        sessions:
          localSessions,
      })
      .select(
        'user_id, profile, techniques, sessions, updated_at'
      )
      .single();

  if (
    insertError
  ) {
    throw insertError;
  }

  try {
    window.localStorage.setItem(
      MIGRATION_KEY,
      'done'
    );
  } catch {
    // Ignore.
  }

  cacheAll(
    localProfile,
    localTechniques,
    localSessions
  );

  return inserted as CloudRow;
}

async function writeCloudData(
  updates: {
    profile?: UserProfile;
    techniques?: Technique[];
    sessions?: TrainingSession[];
  }
) {
  const {
    supabase,
    userId,
  } =
    await getCurrentUserId();

  const {
    error,
  } =
    await supabase
      .from(
        'bjj_user_data'
      )
      .update({
        ...updates,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'user_id',
        userId
      );

  if (
    error
  ) {
    throw error;
  }
}

async function readAllCloud() {
  const row =
    await ensureCloudRow();

  return {
    profile:
      normalizeProfile(
        row.profile
      ),

    techniques:
      normalizeTechniques(
        row.techniques
      ),

    sessions:
      normalizeSessions(
        row.sessions
      ),
  };
}

export async function getSessions(): Promise<
  TrainingSession[]
> {
  try {
    const {
      sessions,
    } =
      await readAllCloud();

    return sessions;
  } catch (
    error
  ) {
    console.error(
      'Failed to load sessions from Supabase',
      error
    );

    return normalizeSessions(
      getLocalJson(
        SESSION_KEY
      )
    );
  }
}

export async function saveSession(
  session: TrainingSession
) {
  const normalizedSession =
    normalizeSession(
      session
    );

  if (
    !normalizedSession
  ) {
    throw new Error(
      'The training session is not valid.'
    );
  }

  const sessions =
    await getSessions();

  const updated = [
    normalizedSession,
    ...sessions.filter(
      (
        item
      ) =>
        item.id !==
        normalizedSession.id
    ),
  ];

  setLocalJson(
    SESSION_KEY,
    updated
  );

  await ensureCloudRow();

  await writeCloudData({
    sessions:
      updated,
  });

  return updated;
}

export async function updateSession(
  session: TrainingSession
) {
  const normalizedSession =
    normalizeSession(
      session
    );

  if (
    !normalizedSession
  ) {
    throw new Error(
      'The training session is not valid.'
    );
  }

  const sessions =
    await getSessions();

  const updated =
    sessions.map(
      (
        item
      ) =>
        item.id ===
        normalizedSession.id
          ? normalizedSession
          : item
    );

  setLocalJson(
    SESSION_KEY,
    updated
  );

  await writeCloudData({
    sessions:
      updated,
  });

  return updated;
}

export async function toggleSessionFavorite(
  id: string
) {
  const sessions =
    await getSessions();

  const updated =
    sessions.map(
      (
        session
      ) =>
        session.id ===
        id
          ? {
              ...session,

              isFavorite:
                !session.isFavorite,
            }
          : session
    );

  setLocalJson(
    SESSION_KEY,
    updated
  );

  await writeCloudData({
    sessions:
      updated,
  });

  return updated;
}

export async function deleteSession(
  id: string
) {
  const sessions =
    await getSessions();

  const updated =
    sessions.filter(
      (
        session
      ) =>
        session.id !==
        id
    );

  setLocalJson(
    SESSION_KEY,
    updated
  );

  await writeCloudData({
    sessions:
      updated,
  });

  return updated;
}

export async function clearSessions() {
  setLocalJson(
    SESSION_KEY,
    []
  );

  await ensureCloudRow();

  await writeCloudData({
    sessions: [],
  });
}

export async function getProfile(): Promise<
  UserProfile
> {
  try {
    const {
      profile,
    } =
      await readAllCloud();

    return profile;
  } catch (
    error
  ) {
    console.error(
      'Failed to load profile from Supabase',
      error
    );

    return normalizeProfile(
      getLocalJson(
        PROFILE_KEY
      )
    );
  }
}

export async function saveProfile(
  profile: UserProfile
) {
  const normalizedProfile =
    normalizeProfile(
      profile
    );

  setLocalJson(
    PROFILE_KEY,
    normalizedProfile
  );

  await ensureCloudRow();

  await writeCloudData({
    profile:
      normalizedProfile,
  });
}

export async function getTechniques(): Promise<
  Technique[]
> {
  try {
    const {
      techniques,
      sessions,
    } =
      await readAllCloud();

    return calculateTechniquePracticeCounts(
      techniques,
      sessions
    );
  } catch (
    error
  ) {
    console.error(
      'Failed to load techniques from Supabase',
      error
    );

    const techniques =
      normalizeTechniques(
        getLocalJson(
          TECHNIQUE_KEY
        )
      );

    const sessions =
      normalizeSessions(
        getLocalJson(
          SESSION_KEY
        )
      );

    return calculateTechniquePracticeCounts(
      techniques,
      sessions
    );
  }
}

export async function saveTechniques(
  techniques: Technique[]
) {
  const normalizedTechniques =
    normalizeTechniques(
      techniques
    );

  setLocalJson(
    TECHNIQUE_KEY,
    normalizedTechniques
  );

  await ensureCloudRow();

  await writeCloudData({
    techniques:
      normalizedTechniques,
  });
}

export async function addTechnique(
  technique: Technique
) {
  const {
    techniques,
  } =
    await readAllCloud();

  const normalizedTechnique =
    normalizeTechnique({
      ...technique,
      practiceCount: 0,
    });

  if (
    !normalizedTechnique
  ) {
    throw new Error(
      'The technique is not valid.'
    );
  }

  const duplicate =
    techniques.some(
      (
        item
      ) =>
        item.name
          .trim()
          .toLowerCase() ===
        normalizedTechnique.name
          .trim()
          .toLowerCase()
    );

  if (
    duplicate
  ) {
    throw new Error(
      'You already have a technique with this name.'
    );
  }

  const updated = [
    normalizedTechnique,
    ...techniques,
  ];

  await saveTechniques(
    updated
  );

  return getTechniques();
}

export async function deleteTechnique(
  id: string
) {
  const {
    techniques,
  } =
    await readAllCloud();

  const updated =
    techniques.filter(
      (
        technique
      ) =>
        technique.id !==
        id
    );

  await saveTechniques(
    updated
  );

  return getTechniques();
}

export async function incrementTechniquePractice(
  _id: string
) {
  return getTechniques();
}

export async function exportBackupData(): Promise<
  BackupData
> {
  const [
    sessions,
    profile,
    techniques,
  ] =
    await Promise.all([
      getSessions(),
      getProfile(),
      getTechniques(),
    ]);

  return {
    app:
      'BJJ Tracker',
    version:
      1,
    exportedAt:
      new Date().toISOString(),
    profile,
    techniques,
    sessions,
  };
}

export async function exportBackupJson(): Promise<
  string
> {
  const backup =
    await exportBackupData();

  return JSON.stringify(
    backup,
    null,
    2
  );
}

export async function importBackupJson(
  json: string
): Promise<BackupData> {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        json
      );
  } catch {
    throw new Error(
      'This file is not valid JSON.'
    );
  }

  if (
    !isValidBackup(
      parsed
    )
  ) {
    throw new Error(
      'This is not a valid BJJ Tracker backup.'
    );
  }

  const normalizedBackup: BackupData =
    {
      app:
        'BJJ Tracker',

      version:
        1,

      exportedAt:
        validDateString(
          parsed.exportedAt
        ) ||
        new Date().toISOString(),

      profile:
        normalizeProfile(
          parsed.profile
        ),

      techniques:
        normalizeTechniques(
          parsed.techniques
        ),

      sessions:
        normalizeSessions(
          parsed.sessions
        ),
    };

  cacheAll(
    normalizedBackup.profile,
    normalizedBackup.techniques,
    normalizedBackup.sessions
  );

  await ensureCloudRow();

  await writeCloudData({
    profile:
      normalizedBackup.profile,

    techniques:
      normalizedBackup.techniques,

    sessions:
      normalizedBackup.sessions,
  });

  return {
    ...normalizedBackup,

    techniques:
      calculateTechniquePracticeCounts(
        normalizedBackup.techniques,
        normalizedBackup.sessions
      ),
  };
}


