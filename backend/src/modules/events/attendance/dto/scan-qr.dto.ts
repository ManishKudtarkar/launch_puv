import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ScanQrDto {
  @IsString()
  @IsNotEmpty()
  ticketToken!: string;

  /** Optional: ID of the EventDay to record per-day attendance against */
  @IsOptional()
  @IsString()
  @IsUUID()
  eventDayId?: string;
}
