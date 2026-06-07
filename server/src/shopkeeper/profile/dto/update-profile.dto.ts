import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KycStatus } from 'src/enum/kyc-status.enum';

export class UpdateShopkeeperProfileDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  gstNumber?: string;

  @IsString()
  @IsOptional()
  panNumber?: string;

  @IsEnum(KycStatus)
  @IsOptional()
  kycStatus?: KycStatus;

  @IsString()
  @IsOptional()
  kycDocumentUrl?: string;
}
