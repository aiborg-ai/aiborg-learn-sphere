/**
 * User Factory
 * Generates test user data using faker
 */

import { faker } from '@faker-js/faker';

export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin' | 'super_admin' | 'company_admin';
}

export function generateUser(role: TestUser['role'] = 'student'): TestUser {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'TestPassword123!',
    role,
  };
}

export function generateMultipleUsers(
  count: number,
  role: TestUser['role'] = 'student'
): TestUser[] {
  return Array.from({ length: count }, () => generateUser(role));
}
