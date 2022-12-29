import { test } from "@playwright/test";
import dotenv from "dotenv";
import { sleep } from "../utils/sleep";

dotenv.config();

test("fill meckano", async ({ page }) => {
  await page.goto("https://www.meckano.co.il/");
  await page.waitForLoadState("domcontentloaded");
  await page
    .locator("#header")
    .getByRole("listitem")
    .filter({ hasText: "כניסה" })
    .click();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("שם משתמש").click();
  await page.getByLabel("שם משתמש").fill(process.env.USERNAME!);
  await page.getByLabel("סיסמה").click();
  await page.getByLabel("סיסמה").fill(process.env.PASSWORD!);
  const navigationPromise = page.waitForNavigation();
  await page.locator("input.send.login", { hasText: "התחברות" }).click();
  await navigationPromise;
  const monthly = page.locator("#li-monthly-employee-report");

  while (page.url().includes("dashboard")) {
    await monthly.click();
  }

  await page
    .locator(
      "table.sortable-list.editable-report.employee-report > tbody > tr:nth-child(2)"
    )
    .waitFor({ state: "visible" });

  const rows = await page
    .locator("table.sortable-list.editable-report.employee-report > tbody > tr")
    .all();

  for (const row of rows) {
    if (
      await row.evaluate(
        (node) =>
          node.classList.contains("no-pointer") ||
          node.classList.contains("highlightingRestDays")
      )
    ) {
      continue;
    }
    // const rowInnerText = await row
    //   .locator("td:nth-child(2) .employee-information p")
    //   .innerText();
    // await row.screenshot({
    //   path: `./screenshots/screenshot${rowInnerText}.png`,
    // });

    const event = row.locator(".text-center > .missing.center");
    const eventInnerHtml = await event.evaluate((node) => node.innerHTML);
    if (!eventInnerHtml.includes("+")) {
      continue;
    }

    const checkIn = row.locator(".center > div > .checkin");
    let checkInInput = row.locator(".center > div > .report-entry");
    if (checkIn) {
      await checkIn.click();
      while (!(await checkInInput.isVisible())) {
        await sleep(200);
        await checkIn.click();
        checkInInput = row.locator(".center > div > .report-entry");
      }
      if ((await checkInInput.inputValue()) === "__:__") {
        await checkInInput.fill("09:00");
      }
      // await checkInInput.clear();
      let checkoutBox = row.locator("td:nth-child(4) > div > .checkout");

      if (checkoutBox) {
        await row.locator("td:nth-child(4) > div > .checkout").click();
      } else {
        checkoutBox = row.locator(
          ".worning-missingEntrie > td:nth-child(4) > div > .checkout"
        );
        await checkoutBox.click();
      }
      let checkOutInput = row.locator("td > div > input").last();
      while (!(await checkOutInput.isVisible())) {
        await sleep(200);
        await checkoutBox.click();
        checkOutInput = row.locator("td > div > input").last();
      }

      if ((await checkOutInput.inputValue()) === "__:__") {
        await checkOutInput.fill("18:00");
      }
      // await checkOutInput.clear();

      await page.keyboard.press("Enter");
    }
  }
});
