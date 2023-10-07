// slackに送信
function sendSlack_(sectionedItems) {
  const template =
    "🌟 *Today's Todo list*\n" +
    `%{items}` +
    "\n今日も一日がんばるぞい❣️:partygopher:";

  let itemList = "";
  for (const section of sectionedItems) {
    itemList += "\n" + Object.keys(section) + "\n";

    for (const item of Object.values(section)[0]) {
      if (item.due) {
        const date = item.due.slice(5).replace("-", "/");
        itemList += "　• 〜" + `${date}：${item.content}` + "\n";
      } else {
        itemList += "　• " + `${item.content}` + "\n";
      }
    }
  }
  const message = template.replace(/%{items}/g, itemList);

  Logger.log(`[debug] Slack message is ${message}`);

  // see: https://api.slack.com/reference/block-kit/block-elements#button
  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: message,
        },
      },
    ],
  };

  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  };

  // Slackに送信
  const url = PropertiesService.getScriptProperties().getProperty(
    "INCOMING_WEBHOOK_URL"
  );
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("Error:" + e);
  }
}
