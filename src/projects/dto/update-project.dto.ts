import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Website Redesign', description: 'Project name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 'WEB',
    pattern: '^[A-Z0-9]+$',
    minLength: 3,
    maxLength: 10,
    description: 'Unique project key (uppercase letters and digits)',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'key must contain only uppercase letters and digits',
  })
  key?: string;

  @ApiPropertyOptional({
    example: 'Redesign the company website',
    description: 'Project description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
