export type Role = "USER" | "ADMIN";
export type Status = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MatchFormat = "SINGLES" | "DOUBLES" | "TEAM";
export interface Player {
  userId: string;
  name: string;
  nickname: string;
  club: string;
  gender: "M" | "F";
  birthDate?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  openDivision?: string;
  localDivision?: string;
  totalMatches: number;
  winRate: number;
  averageScore?: number;
}
export interface LoginResponseData {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  user?: Player & { role: Role };
}
export interface Session {
  accessToken: string;
  refreshToken?: string;
  user: Player & { role: Role };
}
export interface MatchSet {
  setId?: string;
  setNumber: number;
  sideAScore: number;
  sideBScore: number;
}
export interface Match {
  matchId: string;
  competitionId: string;
  matchFormat: MatchFormat;
  sideA: Player[];
  sideB: Player[];
  scheduledAt: string;
  venue: string;
  matchRound: string;
  courtNumber?: number;
  notes?: string;
  status: Status;
  sideAWins: number;
  sideBWins: number;
  winnerSide?: "A" | "B" | null;
  bestOf: number;
  durationSeconds?: number;
}
export interface Competition {
  competitionId: string;
  name: string;
  matchFormat: MatchFormat;
  bestOf: number;
}
export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  history: { date: string; winRate: number }[];
}
export interface Ranking extends Player {
  rank: number;
  averageScore: number;
}
export interface Post {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  views: number;
}
export interface Comment {
  commentId: string;
  content: string;
  authorName: string;
  createdAt: string;
  parentCommentId?: string | null;
  comment_depth: number;
}
export interface Tournament {
  tournamentId: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  status: Status;
  description?: string;
  competitions: Competition[];
  capacity?: number;
  registrationStart?: string;
  registrationEnd?: string;
  isClosed?: "Y" | "N" | string;
  currentParticipants?: number;
}
export interface Group {
  groupId: string;
  name: string;
  participants: Player[];
}

export type TeamType = "CLUB" | "COMPANY" | "PUBLIC";

export interface TeamMember {
  userId: number | string;
  name?: string;
  realName?: string;
  nickname?: string;
  role?: "CAPTAIN" | "MEMBER" | string;
  isCaptain?: boolean;
  joinedAt?: string;
  regDate?: string;
}

export interface Team {
  teamId?: number | string;
  id?: number | string;
  teamName?: string;
  name?: string;
  teamType?: TeamType;
  type?: TeamType;
  description?: string;
  logoImage?: string;
  captainId?: number | string;
  captainUserId?: number | string;
  captainName?: string;
  captain?: {
    userId: number | string;
    realName?: string;
    userName?: string;
    name?: string;
  };
  memberCount?: number;
  members?: TeamMember[];
  tournaments?: { tournamentName?: string; name?: string; status?: string }[];
  regDate?: string;
  createdAt?: string;
}

export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TournamentTeamRegistration {
  registrationId?: number | string;
  id?: number | string;
  teamId: number | string;
  teamName?: string;
  teamType?: TeamType;
  captainName?: string;
  rosterUserIds?: (number | string)[];
  rosterMembers?: { userId: number | string; name?: string; realName?: string }[];
  status: RegistrationStatus;
  notes?: string;
  registeredAt?: string;
  regDate?: string;
}

export interface PlayerTitle {
  userId: number | string;
  userName?: string;
  realName?: string;
  clubName?: string;
  profileImage?: string;
  winRate?: number;
  totalMatches?: number;
  wins?: number;
  averagePoints?: number;
  averageScore?: number;
}

export interface RankingTitles {
  winRateKing?: PlayerTitle | null;
  mostMatchesKing?: PlayerTitle | null;
  avgScoreKing?: PlayerTitle | null;
}

export interface PlayerStatsHistoryItem {
  period?: string;
  date?: string;
  yearMonth?: string;
  winRate?: number;
  averagePoints?: number;
  averageScore?: number;
  totalMatches?: number;
  wins?: number;
  losses?: number;
}

export interface AutoAssignRequest {
  groupCount: number;
  seedByRanking: boolean;
}


