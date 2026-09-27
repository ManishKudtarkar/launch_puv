import { IsNotEmpty, IsString } from 'class-validator';

export class ScanQrDto {
  @IsString()
  @IsNotEmpty()
  ticketToken!: string;
}
