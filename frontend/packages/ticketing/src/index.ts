/**
 * @truths/ticketing
 * 
 * A comprehensive ticketing management package.
 */

// Registry
export * from './registry';
export * from './types';

// Feature exports will go here

// Venues Management
export * from './venues';

// Organizers Management
export * from './organizers';

// Seats Management
export * from './seats';

// Layouts Management
export * from './layouts';

// Sections Management (Section from layouts vs sections - use explicit exports to avoid conflict)
export { sectionService } from './sections';
export type { Section as VenueSection, CreateSectionInput, UpdateSectionInput } from './sections/types';

// Shows Management
export * from './shows';

// Events Management
export * from './events';

// Register all ticketing components
import { registerTicketingComponent } from './registry';

// Component registrations will go here
export * from './event-types';
export * from './venue-types';
