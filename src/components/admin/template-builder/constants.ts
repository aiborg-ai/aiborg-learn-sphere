import { TemplateField } from './types';

export const COURSE_FIELDS: TemplateField[] = [
  {
    name: 'title',
    label: 'Course Title',
    type: 'text',
    required: true,
    placeholder: 'e.g., Advanced React Development',
    description: 'The main title of the course'
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Detailed course description...',
    description: 'Comprehensive description of what the course covers'
  },
  {
    name: 'audiences',
    label: 'Target Audiences',
    type: 'multiselect',
    required: true,
    options: ['Student', 'Professional', 'Entrepreneur', 'Freelancer', 'Corporate', 'Researcher'],
    description: 'Who this course is designed for'
  },
  {
    name: 'mode',
    label: 'Course Mode',
    type: 'select',
    required: true,
    options: ['Online', 'Offline', 'Hybrid', 'Self-paced', 'Instructor-led'],
    description: 'How the course will be delivered'
  },
  {
    name: 'duration',
    label: 'Duration',
    type: 'text',
    required: true,
    placeholder: 'e.g., 8 weeks, 3 months',
    description: 'Length of the course'
  },
  {
    name: 'price',
    label: 'Price',
    type: 'price',
    required: true,
    placeholder: '₹15000 or Free',
    description: 'Course fee in local currency'
  },
  {
    name: 'level',
    label: 'Difficulty Level',
    type: 'select',
    required: true,
    options: ['Beginner', 'Intermediate', 'Advanced'],
    description: 'Course difficulty level'
  },
  {
    name: 'start_date',
    label: 'Start Date',
    type: 'date',
    required: true,
    description: 'When the course begins'
  },
  {
    name: 'features',
    label: 'Course Features',
    type: 'array',
    required: true,
    maxItems: 10,
    description: 'Key features and offerings'
  },
  {
    name: 'keywords',
    label: 'Keywords',
    type: 'array',
    required: true,
    maxItems: 15,
    description: 'Search keywords for better discovery'
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: ['Technology', 'Business', 'Design', 'Marketing', 'Finance', 'Health', 'Education', 'Arts', 'Science', 'Engineering'],
    description: 'Primary category classification'
  },
  {
    name: 'is_featured',
    label: 'Featured Course',
    type: 'boolean',
    required: false,
    description: 'Display prominently on homepage'
  },
  {
    name: 'is_active',
    label: 'Active',
    type: 'boolean',
    required: false,
    description: 'Whether the course is currently active'
  }
];

export const EVENT_FIELDS: TemplateField[] = [
  {
    name: 'name',
    label: 'Event Name',
    type: 'text',
    required: true,
    placeholder: 'e.g., AI Summit 2025',
    description: 'The main title of the event'
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Detailed event description...',
    description: 'What the event is about'
  },
  {
    name: 'event_type',
    label: 'Event Type',
    type: 'select',
    required: true,
    options: ['workshop', 'webinar', 'conference', 'seminar', 'bootcamp', 'meetup'],
    description: 'Type of event'
  },
  {
    name: 'date',
    label: 'Event Date',
    type: 'date',
    required: true,
    description: 'When the event will occur'
  },
  {
    name: 'time',
    label: 'Start Time',
    type: 'text',
    required: false,
    placeholder: 'e.g., 10:00 AM',
    description: 'Event start time'
  },
  {
    name: 'duration',
    label: 'Duration',
    type: 'text',
    required: false,
    placeholder: 'e.g., 3 hours, 2 days',
    description: 'How long the event lasts'
  },
  {
    name: 'location',
    label: 'Location',
    type: 'text',
    required: false,
    placeholder: 'e.g., Mumbai, Online',
    description: 'Where the event takes place'
  },
  {
    name: 'venue',
    label: 'Venue',
    type: 'text',
    required: false,
    placeholder: 'e.g., Tech Hub, Zoom',
    description: 'Specific venue or platform'
  },
  {
    name: 'max_attendees',
    label: 'Max Attendees',
    type: 'number',
    required: false,
    placeholder: '100',
    description: 'Maximum number of participants'
  },
  {
    name: 'price',
    label: 'Price',
    type: 'price',
    required: true,
    placeholder: '₹5000 or Free',
    description: 'Event registration fee'
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    options: ['Technology', 'Business', 'Design', 'Marketing', 'Finance', 'Health', 'Education', 'Arts', 'Science', 'Engineering'],
    description: 'Event category'
  },
  {
    name: 'speakers',
    label: 'Speakers',
    type: 'array',
    required: false,
    maxItems: 30,
    description: 'List of speakers/presenters'
  },
  {
    name: 'agenda',
    label: 'Agenda',
    type: 'array',
    required: false,
    maxItems: 20,
    description: 'Event schedule and sessions'
  },
  {
    name: 'tags',
    label: 'Tags',
    type: 'array',
    required: false,
    maxItems: 15,
    description: 'Event tags for search'
  }
];
