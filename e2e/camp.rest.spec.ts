import { test, expect, type Page } from '@playwright/test';

/**
 * CAMP E2E: мастер объявляет привал — игрок видит то же состояние в своей сессии.
 *
 * Сценарий (Этап 4 плана лагеря): ГМ разбивает лагерь → начинает привал → объявляет
 * длинный отдых → применяет отдых per-character. Игрок в отдельном контексте браузера
 * всё это время смотрит на тот же экран и получает изменения по вебсокету, без
 * управляющих элементов.
 *
 * СТАТУС: как и tactical-battle.happy-path.spec.ts — сценарий против поднятого локального
 * стека (core + frontend) с засеянными аккаунтами, поэтому помечен `test.skip`.
 * Селекторы стабильные (`data-testid`), заглушек в шагах нет.
 *
 * Что нужно для запуска (см. e2e/README.md):
 *  - стек поднят на E2E_BASE_URL;
 *  - E2E_CAMPAIGN_ID — кампания, где есть хотя бы один персонаж игрока;
 *  - E2E_GM_STORAGE / E2E_PLAYER_STORAGE — файлы storageState с сессиями ГМ и игрока;
 *  - в кампании НЕТ незавершённого привала (инвариант "один открытый привал на кампанию").
 */

const campaignId = process.env.E2E_CAMPAIGN_ID ?? '';
const gmStorage = process.env.E2E_GM_STORAGE ?? '';
const playerStorage = process.env.E2E_PLAYER_STORAGE ?? '';

/** Ждём, пока экран лагеря покажет ожидаемый статус (обновление прилетает по WS). */
async function expectCampStatus(page: Page, status: string) {
  await expect(page.getByTestId('camp-status')).toHaveAttribute('data-status', status, {
    timeout: 15_000,
  });
}

test.describe('Лагерь — привал глазами мастера и игрока', () => {
  test.skip('ГМ объявляет привал, игрок видит его в реальном времени', async ({ browser }) => {
    expect(campaignId, 'задайте E2E_CAMPAIGN_ID').not.toBe('');
    expect(gmStorage, 'задайте E2E_GM_STORAGE').not.toBe('');
    expect(playerStorage, 'задайте E2E_PLAYER_STORAGE').not.toBe('');

    const gmContext = await browser.newContext({ storageState: gmStorage });
    const playerContext = await browser.newContext({ storageState: playerStorage });
    const gm = await gmContext.newPage();
    const player = await playerContext.newPage();

    try {
      await test.step('оба открывают экран лагеря: привала ещё нет', async () => {
        await gm.goto(`/campaigns/${campaignId}/camp`);
        await player.goto(`/campaigns/${campaignId}/camp`);
        await expect(gm.getByTestId('camp-page')).toHaveAttribute('data-camp', 'none');
        await expect(player.getByTestId('camp-page')).toHaveAttribute('data-camp', 'none');
        // Игроку кнопки разбивки лагеря не показываются вовсе.
        await expect(player.getByTestId('camp-setup-open')).toHaveCount(0);
      });

      await test.step('ГМ разбивает лагерь с составом отряда', async () => {
        await gm.getByTestId('camp-setup-open').click();
        await gm.getByTestId('camp-setup-name').fill('Привал у Серой ложбины');
        await gm.getByTestId('camp-setup-character').first().click();
        await gm.getByTestId('camp-setup-submit').click();
        await expectCampStatus(gm, 'SETTING_UP');
      });

      await test.step('игрок видит тот же привал, но без управления', async () => {
        await expectCampStatus(player, 'SETTING_UP');
        await expect(player.getByTestId('camp-gm-only')).toBeVisible();
        await expect(player.getByTestId('camp-action-start')).toHaveCount(0);
      });

      await test.step('ГМ начинает привал: SETTING_UP → ACTIVE', async () => {
        await gm.getByTestId('camp-action-start').click();
        await expectCampStatus(gm, 'ACTIVE');
        await expectCampStatus(player, 'ACTIVE');
      });

      await test.step('ГМ объявляет длинный отдых: ACTIVE → RESTING', async () => {
        await gm.getByTestId('camp-action-rest-long').click();
        await expectCampStatus(gm, 'RESTING');
        await expectCampStatus(player, 'RESTING');
        // Отдых объявлен, но листы ещё не тронуты.
        await expect(gm.getByTestId('camp-member').first()).toHaveAttribute('data-state', 'RESTING');
      });

      await test.step('ГМ применяет отдых — участники получают состояние RESTED', async () => {
        await gm.getByTestId('camp-rest-apply').click();
        await expect(gm.getByTestId('camp-member').first())
          .toHaveAttribute('data-state', 'RESTED', { timeout: 15_000 });
        await expect(player.getByTestId('camp-member').first())
          .toHaveAttribute('data-state', 'RESTED', { timeout: 15_000 });
      });

      await test.step('ГМ сворачивает лагерь: привал уходит в архив', async () => {
        await gm.getByTestId('camp-action-end').click();
        // Завершённый привал перестаёт быть текущим, поэтому экран у обоих
        // возвращается к пустому состоянию: COMPLETED живёт только в истории привалов.
        await expect(gm.getByTestId('camp-page'))
          .toHaveAttribute('data-camp', 'none', { timeout: 15_000 });
        await expect(player.getByTestId('camp-page'))
          .toHaveAttribute('data-camp', 'none', { timeout: 15_000 });
      });
    } finally {
      await gmContext.close();
      await playerContext.close();
    }
  });
});
