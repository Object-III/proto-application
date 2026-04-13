var FORM_AUTO_POST_CONFIG = {
  timezone: 'Asia/Tokyo',
  boardPageUrl: 'https://bbs1.sekkaku.net/bbs/objectIII/',
  responseSheetName: 'フォーム自動投稿',
  debugSheetName: 'フォーム自動投稿ログ',
  responseStartRow: 3,
  posterName: '管理人',
  titleText: '匿名さんからの回答',
  defaultTextColor: '#FFFFFF'
};

var FORM_AUTO_POST_COLUMNS = {
  posted: 1,
  timestamp: 2,
  answer: 3,
  imageUrl: 4
};

function runAutoBoardPostImportRows() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FORM_AUTO_POST_CONFIG.responseSheetName);
    if (!sheet) {
      throw new Error('Sheet not found: ' + FORM_AUTO_POST_CONFIG.responseSheetName);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < FORM_AUTO_POST_CONFIG.responseStartRow) {
      return;
    }

    var rowCount = lastRow - FORM_AUTO_POST_CONFIG.responseStartRow + 1;
    var values = sheet.getRange(
      FORM_AUTO_POST_CONFIG.responseStartRow,
      1,
      rowCount,
      FORM_AUTO_POST_COLUMNS.imageUrl
    ).getValues();

    var formInfo = fetchAutoBoardFormInfo_();

    for (var index = 0; index < values.length; index++) {
      var row = FORM_AUTO_POST_CONFIG.responseStartRow + index;
      var payload = extractImportRowPayload_(values[index], row);
      if (!payload) {
        continue;
      }

      try {
        postAutoBoardMessage_({
          postUrl: formInfo.postUrl,
          pot: formInfo.pot,
          boardId: formInfo.boardId,
          title: FORM_AUTO_POST_CONFIG.titleText,
          name: FORM_AUTO_POST_CONFIG.posterName,
          body: payload.body,
          imageUrl: payload.imageUrl
        });

        sheet.getRange(row, FORM_AUTO_POST_COLUMNS.posted).setValue(true);
        logAutoBoardDebug_('SUCCESS', row, '投稿成功', payload.imageUrl, '');
      } catch (error) {
        logAutoBoardDebug_('ERROR', row, '投稿失敗', payload.imageUrl, error.message);
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function extractImportRowPayload_(rowValues, rowNumber) {
  var posted = rowValues[FORM_AUTO_POST_COLUMNS.posted - 1];
  var timestamp = rowValues[FORM_AUTO_POST_COLUMNS.timestamp - 1];
  var answer = String(rowValues[FORM_AUTO_POST_COLUMNS.answer - 1] || '').trim();
  var imageUrl = String(rowValues[FORM_AUTO_POST_COLUMNS.imageUrl - 1] || '').trim();

  if (posted === true) {
    return null;
  }

  if (!answer) {
    return null;
  }

  return {
    row: rowNumber,
    timestamp: timestamp,
    answer: answer,
    imageUrl: imageUrl,
    body: answer
  };
}

function installAutoBoardTimeTrigger() {
  removeAutoBoardTimeTriggers();
  ScriptApp.newTrigger('runAutoBoardPostImportRows')
    .timeBased()
    .everyMinutes(1)
    .create();
}

function removeAutoBoardTimeTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runAutoBoardPostImportRows') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function fetchAutoBoardFormInfo_() {
  var response = UrlFetchApp.fetch(FORM_AUTO_POST_CONFIG.boardPageUrl, {
    followRedirects: true,
    muteHttpExceptions: true
  });
  var statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Failed to fetch board page. HTTP ' + statusCode);
  }

  var html = response.getContentText('UTF-8');
  var formMatch = html.match(/<form\b[^>]*\bname=["']f1["'][^>]*>[\s\S]*?<\/form>/i);
  if (!formMatch) {
    throw new Error('Could not parse the board post form.');
  }

  var formHtml = formMatch[0];
  var actionMatch = formHtml.match(/\baction=["']([^"']+)["']/i);
  var potMatch = formHtml.match(/\bname=["']pot["'][^>]*\bvalue=["']([^"']+)["']/i);
  var idMatch = formHtml.match(/\bname=["']id["'][^>]*\bvalue=["']([^"']+)["']/i);

  if (!actionMatch || !potMatch || !idMatch) {
    throw new Error('Could not parse action/pot/id from the board post form.');
  }

  return {
    postUrl: resolveAutoBoardUrl_(FORM_AUTO_POST_CONFIG.boardPageUrl, actionMatch[1]),
    pot: potMatch[1],
    boardId: idMatch[1]
  };
}

function postAutoBoardMessage_(post) {
  var driveFile = null;
  var payload = {
    mode: 'msg',
    pot: post.pot,
    id: post.boardId,
    name: post.name,
    sub: post.title,
    mes: post.body,
    ccheck: 'on',
    op1: FORM_AUTO_POST_CONFIG.defaultTextColor
  };

  if (post.imageUrl) {
    var imageResult = fetchImageBlob_(post.imageUrl);
    var imageBlob = imageResult.blob;
    driveFile = imageResult.driveFile;
    payload.file = imageBlob;
  }

  try {
    var response = UrlFetchApp.fetch(post.postUrl, {
      method: 'post',
      payload: payload,
      followRedirects: true,
      muteHttpExceptions: true
    });

    var statusCode = response.getResponseCode();
    var responseText = response.getContentText('UTF-8');
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error('Board post failed. HTTP ' + statusCode + ' body: ' + truncateAutoBoardText_(responseText, 300));
    }

    if (!wasAutoBoardPostAccepted_(responseText, post)) {
      throw new Error('Board post may not have been accepted. Response snippet: ' + truncateAutoBoardText_(responseText, 300));
    }
  } finally {
    if (driveFile) {
      try {
        driveFile.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
        logAutoBoardDebug_('INFO', '', 'Drive画像を非公開へ戻しました', driveFile.getUrl(), driveFile.getName());
      } catch (error) {
        logAutoBoardDebug_('WARN', '', 'Drive画像を非公開へ戻せませんでした', driveFile.getUrl(), error.message);
      }
    }
  }
}

function fetchImageBlob_(imageUrl) {
  var driveFileId = extractDriveFileId_(imageUrl);
  if (driveFileId) {
    logAutoBoardDebug_('INFO', '', 'Drive画像取得開始', imageUrl, 'fileId=' + driveFileId);
    try {
      var driveFile = DriveApp.getFileById(driveFileId);
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var driveBlob = driveFile.getBlob();
      driveBlob.setName(driveFile.getName());
      logAutoBoardDebug_('INFO', '', 'Drive画像取得成功', imageUrl, driveFile.getName() + ' / 公開設定済み');
      return {
        blob: driveBlob,
        driveFile: driveFile
      };
    } catch (error) {
      logAutoBoardDebug_('WARN', '', 'Drive画像取得失敗。URL取得へフォールバック', imageUrl, error.message);
    }
  }

  imageUrl = normalizeImageUrl_(imageUrl);
  logAutoBoardDebug_('INFO', '', '画像取得開始', imageUrl, '');

  var response = UrlFetchApp.fetch(imageUrl, {
    followRedirects: true,
    muteHttpExceptions: true
  });

  var statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Image fetch failed. HTTP ' + statusCode + ' url: ' + imageUrl);
  }

  var blob = response.getBlob();
  var contentType = blob.getContentType() || '';
  if (contentType.indexOf('image/') !== 0) {
    throw new Error('Fetched URL is not an image. contentType: ' + contentType + ' url: ' + imageUrl);
  }

  blob.setName(buildImageFileName_(imageUrl, contentType));
  logAutoBoardDebug_('INFO', '', '画像取得成功', imageUrl, blob.getName() + ' / ' + contentType);
  return {
    blob: blob,
    driveFile: null
  };
}

function extractDriveFileId_(imageUrl) {
  var value = String(imageUrl || '').trim();

  var openMatch = value.match(/^https:\/\/drive\.google\.com\/open\?id=([^&]+)/i);
  if (openMatch) {
    return openMatch[1];
  }

  var fileMatch = value.match(/^https:\/\/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (fileMatch) {
    return fileMatch[1];
  }

  var ucMatch = value.match(/^https:\/\/drive\.google\.com\/uc\?(?:.*&)?id=([^&]+)/i);
  if (ucMatch) {
    return ucMatch[1];
  }

  return '';
}

function normalizeImageUrl_(imageUrl) {
  var value = String(imageUrl || '').trim();

  var openMatch = value.match(/^https:\/\/drive\.google\.com\/open\?id=([^&]+)/i);
  if (openMatch) {
    return 'https://drive.google.com/uc?export=download&id=' + openMatch[1];
  }

  var fileMatch = value.match(/^https:\/\/drive\.google\.com\/file\/d\/([^/]+)/i);
  if (fileMatch) {
    return 'https://drive.google.com/uc?export=download&id=' + fileMatch[1];
  }

  return value;
}

function buildImageFileName_(imageUrl, contentType) {
  var lastSegment = String(imageUrl || '').split('/').pop().split('?')[0];
  if (lastSegment) {
    return lastSegment;
  }

  var extensionMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
  };
  return 'upload' + (extensionMap[contentType] || '.img');
}

function wasAutoBoardPostAccepted_(responseText, post) {
  var normalized = String(responseText || '');
  if (!normalized) {
    return false;
  }

  var title = escapeAutoBoardRegex_(post.title);
  var name = escapeAutoBoardRegex_(post.name);
  var bodyHead = escapeAutoBoardRegex_(String(post.body || '').slice(0, 20));

  if (title && new RegExp(title).test(normalized)) {
    return true;
  }
  if (name && bodyHead && new RegExp(name + '[\\s\\S]*' + bodyHead).test(normalized)) {
    return true;
  }
  if (/mode=back|<hr size="2">|<blockquote>/i.test(normalized) && !/error|reject|forbidden/i.test(normalized)) {
    return true;
  }
  return false;
}

function logAutoBoardDebug_(level, row, message, imageUrl, detail) {
  var sheet = getOrCreateAutoBoardDebugSheet_();
  var timestamp = Utilities.formatDate(new Date(), FORM_AUTO_POST_CONFIG.timezone, 'yyyy/MM/dd HH:mm:ss');
  sheet.appendRow([timestamp, level, row, message, imageUrl || '', detail || '']);
}

function getOrCreateAutoBoardDebugSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FORM_AUTO_POST_CONFIG.debugSheetName);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(FORM_AUTO_POST_CONFIG.debugSheetName);
    sheet.getRange(1, 1, 1, 6).setValues([['時刻', 'レベル', '行', '内容', '画像URL', '詳細']]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  return sheet;
}

function resolveAutoBoardUrl_(baseUrl, action) {
  if (/^https?:\/\//i.test(action)) {
    return action;
  }
  if (action.indexOf('//') === 0) {
    return 'https:' + action;
  }
  if (action.indexOf('./') === 0) {
    return baseUrl.replace(/\/?$/, '/') + action.slice(2);
  }
  if (action.indexOf('?') === 0) {
    return baseUrl.replace(/\/?$/, '/') + action;
  }
  return baseUrl.replace(/\/?$/, '/') + action.replace(/^\//, '');
}

function escapeAutoBoardRegex_(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncateAutoBoardText_(text, maxLength) {
  var value = String(text || '');
  return value.length > maxLength ? value.slice(0, maxLength) + '...' : value;
}
