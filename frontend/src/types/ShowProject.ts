import type { FixtureId } from "./Fixture";
import type { TimelineTrackId } from "./TimelineTrack";

export type ShowProjectId = string;

export interface ShowProject {
  id: ShowProjectId;
  title: string;
  venue_name: string;
  fixture_ids: FixtureId[];
  track_ids: TimelineTrackId[];
  updated_at: string;
}
