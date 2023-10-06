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

  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log("GetAllTasksErrorOccurred:" + e);
    return;
  }

  const data = JSON.parse(res.getContentText("UTF-8"));
  const items = getUncheckedItemMaps_(data);
  const sections = getUncheckedSections_(data);
  const sectionedItems = getSectionedItems_(sections, items);

  if (items) {
    sendSlack_(items);
  }
}

// 終了していないタスクを取得
function getUncheckedItemMaps_(data) {
  if (!data.items) {
    return; // 何も返さない
  }

  const items = data.items.filter((item) => {
    return item.is_deleted === false && item.checked === false;
  });

  // 連想配列の配列を生成
  let itemMaps = [];
  for (const item of items) {
    itemMaps.push({
      content: item.content,
      due: item.due,
      sectionId: item.section_id,
    });
  }
  return itemMaps;
}

// 終了していないセクションを取得
function getUncheckedSections_(data) {
  if (!data.sections) {
    return; // 何も返さない
  }

  const sections = data.sections.filter((section) => {
    return section.is_deleted === false && section.is_archived === false;
  });
  return sections;
}

// セクション名に対するタスクの連想配列の配列を生成する
function getSectionedItems_(sections, items) {
  let sectionedItems = [];

  for (const section of sections) {
    // 連想配列をfilterできない気がするので修正！！！！
    // sectionIDが一致するitemのみを選択
    let sectionHasItems = items.filter((item) => item.sectionId === section.id);

    // sectionに該当するアイテムがない場合スキップ
    if (!sectionHasItems) {
      break;
    }
    delete sectionHasItems.section_id;

    const sectionName = section.name;
    sectionedItems.push({ [sectionName]: sectionHasItems });
  }
}
