import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign', description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: 'WEB',
    pattern: '^[A-Z0-9]+$',
    minLength: 3,
    maxLength: 10,
    description: 'Unique project key (uppercase letters and digits)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  @Matches(/^[A-Z0-9]+$/, {
    message: 'key must contain only uppercase letters and digits',
  })
  key!: string;

  @ApiProperty({
    example: 'Redesign the company website',
    required: false,
    description: 'Project description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
