import { expect, test } from '@playwright/test';

const actors = ['guest', 'dev', 'ana', 'ops', 'pm'] as const;

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).__officeV2));
}

async function send(page: import('@playwright/test').Page, actor: string, destination: string) {
  await page.locator('#character').selectOption(actor);
  await page.locator(`[data-destination="${destination}"]`).click();
}

async function waitForState(page: import('@playwright/test').Page, actor: string, state: string) {
  await page.waitForFunction(([id, expected]) => (window as any).__officeV2.actors.get(id)?.state === expected, [actor, state]);
}

test('complete lounge and arcade journeys for every character', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const actor of actors) {
    await ready(page);
    await send(page, actor, 'lounge');
    await waitForState(page, actor, 'seated');
    await page.locator('#game canvas').screenshot({ path: testInfo.outputPath(`${actor}-lounge.png`) });
    await send(page, actor, 'arcade');
    await waitForState(page, actor, 'seated');
    await page.locator('#game canvas').screenshot({ path: testInfo.outputPath(`${actor}-arcade.png`) });
  }
  expect(errors).toEqual([]);
});

test('seated actor can stand, return to entrance, and pause safely', async ({ page }) => {
  await ready(page);
  await send(page, 'guest', 'lounge');
  await waitForState(page, 'guest', 'seated');
  await send(page, 'guest', 'entrance');
  await waitForState(page, 'guest', 'idle');
  const position = await page.evaluate(() => {
    const actor = (window as any).__officeV2.actors.get('guest').sprite;
    return { x: actor.x, y: actor.y };
  });
  expect(position).toEqual({ x: 850, y: 840 });
  await send(page, 'guest', 'arcade');
  await waitForState(page, 'guest', 'walking');
  await page.locator('#pause').click();
  expect(await page.locator('#pause').getAttribute('aria-pressed')).toBe('true');
  const frozen = await page.evaluate(() => {
    const actor = (window as any).__officeV2.actors.get('guest').sprite;
    return { x: actor.x, y: actor.y };
  });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => {
    const actor = (window as any).__officeV2.actors.get('guest').sprite;
    return { x: actor.x, y: actor.y };
  })).toEqual(frozen);

  await page.locator('#pause').click();
  await waitForState(page, 'guest', 'entering');
  await page.locator('#pause').click();
  const frozenTransition = await page.evaluate(() => {
    const actor = (window as any).__officeV2.actors.get('guest').sprite;
    return { x: actor.x, y: actor.y, frame: actor.frame.name };
  });
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => {
    const actor = (window as any).__officeV2.actors.get('guest').sprite;
    return { x: actor.x, y: actor.y, frame: actor.frame.name };
  })).toEqual(frozenTransition);
  await page.locator('#pause').click();
  await waitForState(page, 'guest', 'seated');
});

test('mobile layout stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('two characters occupy distinct sofa cushions', async ({ page }, testInfo) => {
  await ready(page);
  await send(page, 'guest', 'lounge');
  await waitForState(page, 'guest', 'seated');
  await send(page, 'dev', 'lounge');
  await waitForState(page, 'dev', 'seated');
  const positions = await page.evaluate(() => ['guest', 'dev'].map(id => {
    const sprite = (window as any).__officeV2.actors.get(id).sprite;
    return { x: sprite.x, y: sprite.y };
  }));
  expect(positions).toEqual([{ x: 640, y: 485 }, { x: 755, y: 480 }]);
  await page.locator('#game canvas').screenshot({ path: testInfo.outputPath('lounge-pair.png') });
});
