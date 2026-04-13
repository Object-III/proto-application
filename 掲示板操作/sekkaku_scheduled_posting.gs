var CONFIG = {
  boardUrl: 'https://bbs1.sekkaku.net/bbs/objectIII/',
  postsSheetName: '掲示板投稿'
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('BBS Tools')
    .addItem('Run fetch + import', 'runAll')
    .addToUi();
}

function runAll() {
  var response = UrlFetchApp.fetch(CONFIG.boardUrl, {
    followRedirects: true,
    muteHttpExceptions: true
  });

  var statusCode = response.getResponseCode();
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Failed to fetch board page. HTTP ' + statusCode);
  }

  var html = response.getContentText('UTF-8');
  var posts = parsePostsFromRawText_(html);
  if (!posts.length) {
    throw new Error('Could not parse any posts from fetched board HTML.');
  }

  updatePostsSheet_(posts);
}

function updatePostsSheet_(posts) {
  var postsSheet = getOrCreateSheet_(CONFIG.postsSheetName);
  var headers = [['掲示板番号', '題名', '名前', '投稿時刻', '本文', 'カラーコード', '画像URL']];
  var updatedAt = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  var headerRow = 2;
  var dataStartRow = 3;
  var colorColumn = 6;

  if (postsSheet.getLastRow() === 0) {
    postsSheet.getRange(1, 1).setValue('最終更新：' + updatedAt);
    postsSheet.getRange(headerRow, 1, 1, headers[0].length).setValues(headers);
    postsSheet.getRange(headerRow, 1, 1, headers[0].length).setFontWeight('bold');
  } else {
    postsSheet.getRange(1, 1).setValue('最終更新：' + updatedAt);
  }

  var existingLots = new Set();
  var lastRow = postsSheet.getLastRow();
  if (lastRow >= dataStartRow) {
    var existingValues = postsSheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, 1).getValues();
    for (var i = 0; i < existingValues.length; i++) {
      if (existingValues[i][0] !== '') {
        existingLots.add(String(existingValues[i][0]));
      }
    }
  }

  var newRows = [];
  var newLots = new Set();
  for (var index = 0; index < posts.length; index++) {
    var post = posts[index];
    if (existingLots.has(String(post.lot))) {
      continue;
    }

    newRows.push([
      post.lot,
      post.title,
      post.name,
      post.postedAtText,
      post.body,
      post.bodyColor,
      post.imageUrl
    ]);
    newLots.add(String(post.lot));
  }

  if (!newRows.length) {
    return;
  }

  newRows.sort(function(a, b) {
    return parseInt(String(b[0]), 10) - parseInt(String(a[0]), 10);
  });

  if (postsSheet.getLastRow() >= dataStartRow) {
    postsSheet.insertRowsBefore(dataStartRow, newRows.length);
  }

  postsSheet.getRange(dataStartRow, 1, newRows.length, headers[0].length).setValues(newRows);

  for (var rowIndex = 0; rowIndex < newRows.length; rowIndex++) {
    var rowColor = String(newRows[rowIndex][colorColumn - 1] || '').trim();
    if (!/^#[0-9A-Fa-f]{6}$/.test(rowColor)) {
      continue;
    }

    postsSheet.getRange(dataStartRow + rowIndex, colorColumn).setBackground(rowColor);
  }
}

function parsePostsFromRawText_(rawText) {
  var text = normalizeRawLogText_(rawText);
  var blocks = text.split(/<hr size="2">/i);
  var posts = [];

  for (var index = 0; index < blocks.length; index++) {
    var block = blocks[index];
    if (block.indexOf('<font color="#FFFFFF">[') === -1) {
      continue;
    }

    var lotMatch = block.match(/<font color="#FFFFFF">\[(\d+)\]<\/font>/i);
    var fontMatches = Array.from(block.matchAll(/<font color="#3F9877">([^<]*)<\/font>/gi)).map(function(match) {
      return decodeHtmlText_(match[1]);
    });
    var dateMatch = block.match(/<font size="2" color="#FFFFFF">(.*?)<\/font>/i);
    var textColorMatch = block.match(/var textColor = "(#[0-9A-Fa-f]{6}|)";/i);
    var bodyMatch = block.match(/document\.write\('<font color="' \+ textColor \+ '">([\s\S]*?)<\\\/font>'\);/i);
    var imageMatch = block.match(/var IMG = "(https:\/\/[^"]*)";/i);

    if (!lotMatch || !dateMatch || !bodyMatch) {
      continue;
    }

    var title = '';
    var name = '';
    if (fontMatches.length >= 4) {
      title = fontMatches[1] || '';
      name = fontMatches[3] || '';
    } else if (fontMatches.length >= 2) {
      title = fontMatches[0] || '';
      name = fontMatches[1] || '';
    } else if (fontMatches.length === 1) {
      name = fontMatches[0] || '';
    }

    posts.push({
      lot: lotMatch[1],
      title: title,
      name: name,
      postedAtText: cleanupText_(dateMatch[1]),
      body: normalizeBodyText_(bodyMatch[1]),
      bodyColor: textColorMatch && textColorMatch[1] ? textColorMatch[1] : '#FFFFFF',
      imageUrl: imageMatch && imageMatch[1] ? imageMatch[1] : ''
    });
  }

  return posts;
}

function normalizeRawLogText_(rawText) {
  return String(rawText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function normalizeBodyText_(value) {
  return decodeHtmlText_(String(value || ''))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a [^>]+>(.*?)<\/a>/gi, '$1')
    .replace(/\\\//g, '/')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeHtmlText_(value) {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function cleanupText_(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getOrCreateSheet_(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName) ||
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
}
