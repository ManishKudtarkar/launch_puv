import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegistrationFieldsService } from './registration-fields.service';

@ApiTags('Registration Fields')
@Controller('registration-fields')
export class RegistrationFieldsController {
  constructor(
    private readonly registrationFieldsService: RegistrationFieldsService,
  ) {}

  @Get()
  findAll() {
    return this.registrationFieldsService.findAll();
  }
}
