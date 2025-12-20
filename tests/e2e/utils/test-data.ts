/**
 * Test Data Factories and Generators
 * Provides reusable test data generation for E2E tests
 */

import { faker } from '@faker-js/faker';

/**
 * User role types matching the application's role system
 */
export type UserRole = 'student' | 'instructor' | 'admin' | 'super_admin' | 'company_admin';

/**
 * Generate a random test user with specified role
 */
export function generateUser(role: UserRole = 'student', overrides?: Partial<TestUser>): TestUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password: 'TestPassword123!',
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    role,
    phone: faker.phone.number(),
    ...overrides,
  };
}

/**
 * Generate a vault subscription claim request
 */
export function generateVaultClaim(overrides?: Partial<VaultClaimData>): VaultClaimData {
  const user = generateUser('student');

  return {
    userName: user.fullName,
    userEmail: user.email,
    vaultEmail: faker.internet.email().toLowerCase(),
    vaultSubscriptionEndDate: faker.date.future({ years: 1 }).toISOString().split('T')[0],
    familyMembers: [],
    ...overrides,
  };
}

/**
 * Generate family members for vault claim
 */
export function generateFamilyMembers(count: number = 3): FamilyMember[] {
  const relationships = ['spouse', 'child', 'parent', 'sibling'];

  return Array.from({ length: count }, () => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    relationship: faker.helpers.arrayElement(relationships),
  }));
}

/**
 * Generate a course
 */
export function generateCourse(overrides?: Partial<TestCourse>): TestCourse {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    duration: faker.number.int({ min: 30, max: 180 }),
    level: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
    category: faker.helpers.arrayElement([
      'Programming',
      'Data Science',
      'Business',
      'Design',
      'Marketing',
    ]),
    instructor: faker.person.fullName(),
    price: faker.number.int({ min: 29, max: 199 }),
    published: true,
    ...overrides,
  };
}

/**
 * Generate an event
 */
export function generateEvent(overrides?: Partial<TestEvent>): TestEvent {
  const startDate = faker.date.future();
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 2);

  return {
    id: faker.string.uuid(),
    title: faker.lorem.words(4),
    description: faker.lorem.paragraph(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    location: faker.helpers.arrayElement(['Online', faker.location.city()]),
    maxAttendees: faker.number.int({ min: 10, max: 100 }),
    published: true,
    ...overrides,
  };
}

/**
 * Generate an assessment
 */
export function generateAssessment(overrides?: Partial<TestAssessment>): TestAssessment {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    description: faker.lorem.sentence(),
    courseId: faker.string.uuid(),
    duration: faker.number.int({ min: 15, max: 60 }),
    passingScore: 70,
    questionCount: faker.number.int({ min: 10, max: 30 }),
    ...overrides,
  };
}

/**
 * Generate payment details
 */
export function generatePayment(overrides?: Partial<TestPayment>): TestPayment {
  return {
    id: faker.string.uuid(),
    amount: faker.number.int({ min: 29, max: 199 }),
    currency: 'USD',
    status: 'succeeded',
    cardNumber: '4242424242424242',
    cardExpiry: '12/25',
    cardCvc: '123',
    billingName: faker.person.fullName(),
    billingEmail: faker.internet.email().toLowerCase(),
    ...overrides,
  };
}

/**
 * Pre-defined test users for consistent testing
 */
export const TEST_USERS = {
  student: generateUser('student', {
    email: 'test.student@example.com',
    password: 'TestStudent123!',
  }),
  instructor: generateUser('instructor', {
    email: 'test.instructor@example.com',
    password: 'TestInstructor123!',
  }),
  admin: generateUser('admin', {
    email: 'test.admin@example.com',
    password: 'TestAdmin123!',
  }),
  superAdmin: generateUser('super_admin', {
    email: 'test.superadmin@example.com',
    password: 'TestSuperAdmin123!',
  }),
  companyAdmin: generateUser('company_admin', {
    email: 'test.companyadmin@example.com',
    password: 'TestCompanyAdmin123!',
  }),
};

/**
 * Type definitions
 */
export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  phone: string;
}

export interface VaultClaimData {
  userName: string;
  userEmail: string;
  vaultEmail: string;
  vaultSubscriptionEndDate: string;
  familyMembers: FamilyMember[];
  metadata?: Record<string, unknown>;
}

export interface FamilyMember {
  name: string;
  email: string;
  relationship: string;
}

export interface TestCourse {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: string;
  category: string;
  instructor: string;
  price: number;
  published: boolean;
}

export interface TestEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxAttendees: number;
  published: boolean;
}

export interface TestAssessment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  duration: number;
  passingScore: number;
  questionCount: number;
}

export interface TestPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  billingName: string;
  billingEmail: string;
}
