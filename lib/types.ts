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
export interface Session {
  accessToken: string;
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
}
export interface Group {
  groupId: string;
  name: string;
  participants: Player[];
}
