import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListCustomerAddressesQueryDto {
  @IsString()
  @IsOptional()
  @IsIn(['true', 'false'])
  includeInactive?: string;
}
