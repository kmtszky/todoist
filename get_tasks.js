// 全てのタスクを取得
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

  const url = endPointUrl + "?sync_token=*" + '&resource_types=[%22sections%22%2C %22items%22]'

  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() == 200) {
    const data = JSON.parse(res.getContentText("UTF-8"));
    const items = getUncheckedItems_(data);

    if (items) {
      sendSlack_(items);
    }
  }
}

// 終了していないタスクを取得
function getUncheckedItems_(data) {
  if (!data) {
    return // 何も返さない
  }

  const items = data.items.filter(item => {
    return (item.is_deleted === false && item.checked === false);
  });

  return items;
}
