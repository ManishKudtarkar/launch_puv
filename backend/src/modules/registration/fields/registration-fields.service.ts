import { Injectable } from '@nestjs/common';
import { REGISTRATION_FIELDS } from './registration-fields.catalog';

@Injectable()
export class RegistrationFieldsService {
  findAll() {
    return REGISTRATION_FIELDS;
  }
}
