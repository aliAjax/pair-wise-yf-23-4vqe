import type { TimelineTrack } from "../types/TimelineTrack";
import { STORE_KEYS } from "../constants/storageKeys";
import { idbGetAll, idbPut, idbDelete, idbPutMany, ensureSeedData } from "../utils/db";

export async function listTimelineTrack(): Promise<TimelineTrack[]> {
  await ensureSeedData();
  return idbGetAll<TimelineTrack>(STORE_KEYS.timelineTrack);
}

export async function saveTimelineTrack(payload: TimelineTrack): Promise<TimelineTrack> {
  return idbPut(STORE_KEYS.timelineTrack, payload);
}

export async function saveTimelineTrackMany(payload: TimelineTrack[]): Promise<void> {
  return idbPutMany(STORE_KEYS.timelineTrack, payload);
}

export async function deleteTimelineTrack(id: string): Promise<void> {
  return idbDelete(STORE_KEYS.timelineTrack, id);
}
