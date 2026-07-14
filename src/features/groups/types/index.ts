import type {
  GroupActivity,
  GroupMember,
  GroupRole,
  UserProfile,
  UUID,
} from "@/types";

export interface GroupMemberWithProfile extends GroupMember {
  profile: UserProfile;
}

export interface GroupActivityFeedItem extends GroupActivity {
  actorName: string;
  actorAvatarUrl: string | null;
  exerciseName: string | null;
  showWeights: boolean;
}

export interface GroupMemberWeeklyStats {
  userId: UUID;
  displayName: string;
  avatarUrl: string | null;
  role: GroupRole;
  sessionsThisWeek: number | null;
  scheduledThisWeek: number | null;
  adherencePercent: number | null;
  personalRecordsCount: number | null;
  lastWorkoutAt: string | null;
  shareWorkoutSummary: boolean;
  sharePersonalRecords: boolean;
  shareWeights: boolean;
}

export interface GroupSplitSyncStatus {
  groupId: UUID;
  groupVersion: number;
  seenVersion: number;
  updatedAt: string;
  hasUpdate: boolean;
}
