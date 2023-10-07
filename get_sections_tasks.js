// 全てのタスクを取得
function getAllTasks() {
  deleteTrigger_("getAllTasks");

  const token =
    PropertiesService.getScriptProperties().getProperty("TODOIST_API_TOKEN");
  const headers = {
    Authorization: "Bearer " + token,
  };
  const options = {
    method: "GET",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: headers,
  };
  const endPointUrl = "https://api.todoist.com/sync/v9/sync";
  const url =
    endPointUrl +
    "?sync_token=*" +
    "&resource_types=[%22sections%22%2C %22items%22]";

  // タスク、セクションを取得
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("GetAllTasksErrorOccurred:" + e);
    return;
  }
  const data = JSON.parse(res.getContentText("UTF-8"));

  // タスクがない場合終了
  const items = getUncheckedItems_(data);
  if (items.length == 0) {
    Logger.log("There is no items.");
    return;
  }

  const sections = getUncheckedSections_(data);
  const sectionedItems = getSectionedItems_(sections, items);
  sendSlack_(sectionedItems);
}

// 終了していないタスクを取得
function getUncheckedItems_(data) {
  if (data.items == 0) {
    return; // 何も返さない
  }
  const uncheckedItems = data.items.filter(
    (item) => item.is_deleted === false && item.checked === false
  );

  // 連想配列の配列を生成
  let items = [];
  for (const item of uncheckedItems) {
    items.push({
      content: item.content,
      due: item.due,
      sectionId: item.section_id,
    });
  }
  return items;
}

// 終了していないセクションを取得
function getUncheckedSections_(data) {
  return data.sections.filter(
    (section) => section.is_deleted === false && section.is_archived === false
  );
}

// セクション名に対するタスクの連想配列の配列を生成する
function getSectionedItems_(sections, items) {
  let sectionedItems = [];

  for (const section of sections) {
    // sectionIDが一致するitemのみを選択
    const filteredItems = items.filter((item) => item.sectionId === section.id);

    // sectionに該当するアイテムがない場合スキップ
    if (filteredItems.length == 0) {
      break;
    }

    // itemsからセクションIDを取り除く
    const formattedItems = filteredItems.map((item) => {
      let newItem = { ...item }; // オブジェクトのコピーを作成
      delete newItem["sectionId"]; // 指定のキーを削除
      return newItem;
    });

    sectionedItems.push({ [section.name]: formattedItems });
  }
}
