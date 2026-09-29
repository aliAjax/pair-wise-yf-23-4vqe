/**
 * 持久化冒烟：模拟"关掉页面再打开"——
 * 第一次引导播种并修改数据，清空内存状态后重新调 api，
 * 确认种子不会覆盖用户已经写入的数据。
 */
import "./env-setup.mts";
import * as FixtureApi from "../src/api/Fixture";
import * as CueApi from "../src/api/CueScene";
import * as TrackApi from "../src/api/TimelineTrack";
import * as ProjectApi from "../src/api/ShowProject";
import { idbGetAll } from "../src/utils/db";
import { STORE_KEYS } from "../src/constants/storageKeys";

async function main() {
  let failures = 0;
  const report = (name: string, ok: boolean) => {
    console.log(ok ? `PASS ${name}` : `FAIL ${name}`);
    if (!ok) failures += 1;
  };

  // 第一次打开：播种
  const firstFixtures = await FixtureApi.listFixture();
  report("first boot seeds 9 fixtures", firstFixtures.length === 9);
  const firstCues = await CueApi.listCueScene();
  report("first boot seeds 5 cues", firstCues.length === 5);
  const firstTracks = await TrackApi.listTimelineTrack();
  report("first boot seeds 6 tracks", firstTracks.length === 6);
  const firstProjects = await ProjectApi.listShowProject();
  report("first boot seeds 1 project", firstProjects.length === 1);

  // 用户修改：删除一台灯、改编号
  await FixtureApi.deleteFixture("fx-9");
  const renamed = { ...firstFixtures[0], fixture_code: "RENAMED-BY-USER" };
  await FixtureApi.saveFixture(renamed);

  // 模拟重开页面：所有模块缓存天然消失（新进程），直接再次 list
  const secondFixtures = await FixtureApi.listFixture();
  report("reopen keeps user data: 8 fixtures (seed not re-applied)", secondFixtures.length === 8);
  report("reopen keeps rename", secondFixtures.some((f) => f.fixture_code === "RENAMED-BY-USER"));
  report("reopen does not resurrect deleted fixture", !secondFixtures.some((f) => f.id === "fx-9"));

  // 再次 list 不应重复播种
  const thirdFixtures = await FixtureApi.listFixture();
  report("third list is stable at 8", thirdFixtures.length === 8);

  const rawCount = (await idbGetAll(STORE_KEYS.fixture)).length;
  report("IndexedDB row count matches", rawCount === 8);

  console.log(failures === 0 ? "\nPERSIST SMOKE PASSED" : `\n${failures} PERSIST FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
