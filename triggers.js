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

// トリガーを設定
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