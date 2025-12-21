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

// Sections Management
export * from './sections';

// Register all ticketing components
import { registerTicketingComponent } from './registry';

// Component registrations will go here
export * from './event-types';
