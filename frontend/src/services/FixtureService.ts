import type { Fixture } from "../types/Fixture";
import * as fixtureApi from "../api/Fixture";
import {
  createFixtureFromDraft,
  type FixtureDraft
} from "../constructors/FixtureConstructor";
import { assertDmxAvailable } from "../utils/dmx";
import { ERROR_CODES } from "../constants/errorCodes";
import { ServiceError } from "../utils/errors";
import { writeLog } from "../utils/logger";
import { clampPercent } from "../utils/color";

function validateDraft(draft: FixtureDraft): void {
  if (!draft.fixture_code.trim()) {
    throw new ServiceError(ERROR_CODES.VALIDATION_FAILED, { field: "灯具编号不能为空" });
  }
}

export async function listFixtures(): Promise<Fixture[]> {
  return fixtureApi.listFixture();
}

export async function createFixture(draft: FixtureDraft, existing: Fixture[]): Promise<Fixture> {
  validateDraft(draft);
  const fixture = createFixtureFromDraft({
    ...draft,
    position_x: clampPercent(draft.position_x),
    position_y: clampPercent(draft.position_y),
    dmx_address: Math.max(1, Math.round(draft.dmx_address))
  });
  // 新灯具的 DMX 地址不能压到已有通道
  assertDmxAvailable(fixture, existing);
  await fixtureApi.saveFixture(fixture);
  await writeLog("Fixture", "CREATE", { name: fixture.fixture_code });
  return fixture;
}

export async function updateFixture(fixture: Fixture, existing: Fixture[]): Promise<Fixture> {
  if (!fixture.fixture_code.trim()) {
    throw new ServiceError(ERROR_CODES.VALIDATION_FAILED, { field: "灯具编号不能为空" });
  }
  const normalized: Fixture = {
    ...fixture,
    dmx_address: Math.max(1, Math.round(fixture.dmx_address)),
    channel_count: Math.max(1, Math.round(fixture.channel_count)),
    position_x: clampPercent(fixture.position_x),
    position_y: clampPercent(fixture.position_y)
  };
  assertDmxAvailable(normalized, existing);
  await fixtureApi.saveFixture(normalized);
  await writeLog("Fixture", "UPDATE", { name: normalized.fixture_code });
  return normalized;
}

export async function removeFixture(fixture: Fixture): Promise<void> {
  await fixtureApi.deleteFixture(fixture.id);
  await writeLog("Fixture", "DELETE", { name: fixture.fixture_code });
}

export async function replaceAllFixtures(rows: Fixture[]): Promise<void> {
  await fixtureApi.saveFixtureMany(rows);
}
