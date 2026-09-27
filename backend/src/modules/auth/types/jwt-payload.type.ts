export interface JwtPayload {
  sub: string;
  sessionId: string;
  tokenType: 'access';
}
