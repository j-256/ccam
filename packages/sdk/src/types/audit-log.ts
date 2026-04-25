import type { Link } from './common.js';

/**
 * Audit log record capturing an event in the Account Manager system.
 * Tracks user actions, system events, and administrative changes.
 */
export interface AuditLogRecord {
  /** User ID of the event author (null for system-generated events) */
  authorId: string | null;

  /** Display name of the event author (e.g. "John Doe" or "System") */
  authorDisplayName: string;

  /** Email address of the event author (null for system-generated events) */
  authorEmail: string | null;

  /** Type of event that occurred (e.g. "USER_CREATED", "PASSWORD_EXPIRED") */
  eventType: string;

  /** Human-readable message describing the event */
  eventMessage: string;

  /** Support ticket ID associated with the event. Null when no ticket is associated. */
  supportTicketId: string | null;

  /** ISO-8601 timestamp when the event occurred */
  timestamp: string;

  /** Additional structured arguments related to the event (null if none) */
  arguments: string[] | null;

  /** HATEOAS links for related resources */
  links: Link[];
}
