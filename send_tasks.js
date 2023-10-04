// see: https://github.com/fukuiretu/gas-todoist-to-slack/blob/master/src/Code.ts

// 関数実行時間測定用コード
function countExecutionTime() {
  const label = 'time';
  console.time(label);
  getAllTask();
  console.timeEnd(label);
}

// 翌日0時0分0秒に実行
function setTriggerDay() {
  let triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 1);  // 次の日をセット

  ScriptApp.newTrigger("setTriggerTimer")
    .timeBased()
    .atDate(triggerDate.getFullYear(), triggerDate.getMonth()+1, triggerDate.getDate())
    .create();
}

function setTriggerTimer() {
  deleteTrigger_("setTriggerTimer");

  let arrayTrigger = [];
  const sendTiming = 30600000; // am8:30 = 8*60*60*1000 + 30*60*1000 = 30600000

  // 休日ではなく、かつトリガーが設定されていない場合、8:30にgetAllTaskをトリガーする
  if (!isBlockOutDate_() && !triggerExists_(arrayTrigger, sendTiming)) {
    arrayTrigger.push(sendTiming);

    ScriptApp.newTrigger("getAllTask")
    .timeBased()
    .after(sendTiming)
    .create();
  }
}

function getAllTask() {
  deleteTrigger_("getAllTask");

  const token = PropertiesService.getScriptProperties().getProperty("TODOIST_API_TOKEN");
  const headers = {
    'Authorization': 'Bearer '+ token
  }

  const options = {
    method: "GET",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: headers,
  }

  const endPointUrl = "https://api.todoist.com/sync/v9/sync"
  const url = endPointUrl + "?sync_token=*" + '&resource_types=[%22sections%22%2C %22items%22]'

  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() == 200) {
    const data = JSON.parse(res.getContentText("UTF-8"));
    const items = getUncheckedItems_(data);

    if (items) {
      sendSlack_(items)
    }
  }
}

//
function getUncheckedItems_(data) {
  if (!data) {
    return // 何も返さない
  }

  const items = data.items.filter(item => {
    return (item.is_deleted === false && item.checked === false);
  });

  return items;
}

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

// 送信しない日チェック（送信しない日の場合true）
function isBlockOutDate_() {
  const today = new Date();
  const day = today.getDay();

  if (day == 0 || day == 6) { // 日曜（0）、土曜（6）
    Logger.log("today is holiday");
    return true;
  }

  const holidayCalendar = CalendarApp.getCalendarById("ja.japanese#holiday@group.v.calendar.google.com");  // [日本の祝日]を取得
  const holidayCount =  holidayCalendar.getEventsForDay(today).length;

  if (holidayCount != 0){
    Logger.log("today is national holiday");
    return true;
  }
  return false;
}

// トリガーを削除
function deleteTrigger_(name) {
  const triggers = ScriptApp.getProjectTriggers();
  for(let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == name) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

// トリガーが設定済みかチェック
function triggerExists_(array, value) {
  for (let i = 0, len = array.length; i < len; i++) {
    if (value == array[i]) {
      return true;
    }
  }
  return false;
}