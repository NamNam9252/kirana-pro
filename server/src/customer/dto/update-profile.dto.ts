import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateCustomerProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  fullName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  alternatePhone?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  @MaxLength(500)
  avatarUrl?: string;
}
