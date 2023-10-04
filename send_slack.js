// slackに送信
function sendSlack_(items) {
  const template = "🌟 *Today's Todo list*\n\n" + `%{items}` + "\n今日も一日がんばるぞい❣️:partygopher:";

  let itemList = "";
  for (let item of items) {
    const due = item.due
    if (due) {
      const date = due.date.slice(5).replace("-","/");
      itemList += "• " + `${date}：${item.content}` + "\n"
    } else {
      itemList += "• " + `${item.content}` + "\n"
    }
  }
  const message = template.replace(/%{items}/g, itemList);

  Logger.log(`[debug] ${message}`)

  // see: https://api.slack.com/reference/block-kit/block-elements#button
  const payload = {
    "blocks" : [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": message
        }
      },
    ]
  };

  const options = {
    "method" : "POST",
    "contentType": "application/json",
    "payload" : JSON.stringify(payload)
  };

  // Slackに送信
  const url = PropertiesService.getScriptProperties().getProperty("INCOMING_WEBHOOK_URL");
  try {
    UrlFetchApp.fetch(url, options);
  } catch(e) {
    Logger.log('Error:' + e);
  }
}
