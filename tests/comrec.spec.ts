import { Page, test, expect } from '@playwright/test';

const fs = require('fs');
const fileID = (process.env.FILE_IDS || '').split(',');
const feedID = process.env.FEED_ID || '';

async function screenshot(page: Page, fileName: string) {
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  await page.screenshot({
    path: `screenshots/${fileName}.png`,
    fullPage: true
  });
}

test.setTimeout(12000000);
test('DATAFEEDS', async ({ page }) => {

  await test.step('Login to Ayhpdev', async () => {
  await page.goto('https://ayhpdev.agencyhomeport.com/login');
  await page.locator('input[name="email"]').fill(process.env.USERNAME_COMREC!);
  await page.locator('input[name="password"]').fill(process.env.PASSWORD_COMREC!);
  await page.getByRole('button', { name: 'Log in' }).click();
  });

    for (const id of fileID) {
        await test.step('File ID: ' + id, async () => {
        await page.goto('https://ayhpdev.agencyhomeport.com/carrier-management/datafeeds');
        await test.step(`Search for Feed ID: ${feedID} and File ID: ${id}`, async () => {
        await page.getByRole('spinbutton', { name: 'Feed ID:' }).fill(feedID);
        await page.getByRole('button', { name: 'Search' }).click();
        await page.waitForLoadState('networkidle');
        await screenshot(page, 'Feed-header');
        });
        
        await test.step(`Verify file status File ID: ${id}`, async () => {
        await page.getByRole('cell', { name: feedID }).first().click();
        await page.getByRole('button', { name: 'Files' }).click();
        await page.getByRole('searchbox', { name: 'Search...' }).fill(id);
        await expect(page.locator(`[id="${id}"]`)).toContainText('GOOD');
        await page.getByRole('link', { name: id }).click();
        await screenshot(page, `Status-${id}`);
        });

        await test.step(`Download file and verify content File ID: ${id}`, async () => {
        await page.getByRole('button', { name: 'ECS Header' }).click();
        

        const ecsButton = page.getByRole('button', { name: 'ECS Details' });
        try {
          await ecsButton.waitFor({ state: 'visible', timeout: 5000 });
          await page.locator(`[id="${id}-table"]`).getByRole('cell', { name: id }).click();
          await ecsButton.click();
        } catch {
        }

        
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Export' }).click();
        const download = await downloadPromise;
        expect(download).toBeTruthy();
        const fileName = download.suggestedFilename();
        await download.saveAs(`downloads/${fileName}`);
        expect(require('fs').existsSync(`downloads/${fileName}`)).toBeTruthy();
        await screenshot(page, `details-${id}`);
        
        });

        await test.step(`Verify ECS Header content File ID: ${id}`, async () => {
        await page.getByRole('tab', { name: `Feed: ${feedID} ` }).click();
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.screenshot({ path: `screenshots/ECS-HEADER-${id}.png` });
        const table = page.locator(`[id="${id}-table"]`);
        await expect(table).not.toHaveJSProperty('textContent', null);
        await expect(table).not.toHaveText(/^\s*$/);
        });
      });
};

});