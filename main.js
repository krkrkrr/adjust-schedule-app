function test() {
  Logger.log(ScriptApp.getService().getUrl());
}

// require set form submit trigger this function manually.
function onSubmit() {
  let form = FormApp.getActiveForm();
  sendLog(ScriptApp.getService().getUrl());
}

function onInstall() {
  onOpen();
}

// Use this code for Google Docs, Slides, Forms, or Sheets.
function onOpen() {
  FormApp.getUi().createMenu('調整')
    .addItem('スケジュール調整するやつを作成', "openNewScheduler")
    .addItem('回答を見る', "seeScheduler")
    .addItem("回答を修正する", "modifiResponse")
    .addToUi();
}

// send log to debug sheet.
// argument is string or array.
function sendLog(log) {
  const debug_sheet_url = 
  "https://docs.google.com/spreadsheets/d/1-L2Wz95_QtX6w-Aepuonv1ZHNpr9MAVY9ZZiu3lZ9uI/edit";
  let set_row_array = Array.isArray(log) ? log : [log];
  set_row_array.unshift((new Date).toLocaleString("ja-JP"));
  SpreadsheetApp.openByUrl(debug_sheet_url).getActiveSheet()
  .appendRow(set_row_array);
}

// create form
function openNewScheduler() {
  var html = HtmlService.createTemplateFromFile("pageform").evaluate();
//  FormApp.getUi().showModalDialog(html, 'スケジュール調整するやつを作成');
  FormApp.getUi().showSidebar(html);
}

function doForm(res) {
  // test response data.
  /*
  res = {
    daya: ["2020-02-20", "2020-02-27"],
    dayz: ["2020-02-21", "2020-02-29"],
    questions: [
     "おっけー",
     "そこそこ",
     "むり",
     "わからん"
   ]
  };
  */
  
  // delete default item
  var form = FormApp.getActiveForm();
  for(var prop = 0; prop < 1000; prop++) {
    try {
      form.deleteItem(0);
    } catch(e) {
      break;
    }
  }
  
  // input text box
  form.addTextItem().setTitle("なまえ").setRequired(true);
  
  // verify date from form. 
  var array = [];
  for(var index in res.daya) {
    array.push({
      datea: new Date(res.daya[index]),
      datez: new Date(res.dayz[index])
    });
  }
  array.sort(function(a, b) {
    return a.datea > b.datea;
  });
  
  var weekdays = [" (日)", " (月)", " (火)", " (水)", " (木)", " (金)", " (土)"];
  var datelist = [];
  for(var index in array) {
    if(index < 1) {
      datelist.push(array[index]);
    } else if(array[index - 1].datez > array[index].datea) {
      var obj = datelist.pop();
      datelist.push({
        datea: obj.datea,
        datez: array[index].datez
      });
    } else {
      datelist.push(array[index]);
    }
  }
  var rows = [];
  var dtlstindex = 0;
  var dtprop = datelist[0].datea;
  for(var prop = 0; prop < 1000; prop++) {
    var day = 1 +(dtprop.getMonth());
    day += "/" + dtprop.getDate();
    day += weekdays[dtprop.getDay()];
    rows.push(day);
    dtprop.setDate(1 +(dtprop.getDate()));
    // Logger.log("dtprop " + dtprop);
    // Logger.log("datez " + datelist[dtlstindex].datez);
    // Logger.log("dtlstindex " + dtlstindex);
    if(dtprop > datelist[dtlstindex].datez) {
      dtprop = datelist[dtlstindex].datea;
      dtlstindex++;
      if(dtlstindex > datelist.length -1) {
        break;
      }
    }
  }
  
  var item = form.addGridItem();
  item.setTitle("スケジュール").setRows(rows).setColumns(res.questions);
  
  // input textbox
  form.addParagraphTextItem().setTitle("なにかあれば");
  
  return true;
}

// see schedule
function seeScheduler() {
  var template = HtmlService.createTemplateFromFile("pageanswer");
  template = getFormResponse(template);
  var html = template.evaluate();
//  FormApp.getUi().showModalDialog(html, '回答を見る');
//  FormApp.getUi().showModelessDialog(html, '回答を見る');
  FormApp.getUi().showSidebar(html);
}

// see schedule by html
function doGet() {
  var template = HtmlService.createTemplateFromFile("pageanswer");
  template = getFormResponse(template);
  return template.evaluate();
}

function getFormResponse(res) {
  // get form responses
  var formresponses = FormApp.getActiveForm().getResponses();
  var userid = 1000;
  var questions = {};
  var responses = [];
  var comments = [];
  var answers = [];
  for(var frmindex = 0; frmindex < formresponses.length; frmindex++) {
    userid++;
    var username = "";
    var itemresponses = formresponses[frmindex].getItemResponses();
    for(var itmindex = 0; itmindex < itemresponses.length; itmindex++) {
      if(itmindex < 1) {
        // item[0]: user name
        username = itemresponses[itmindex].getResponse() 
          ? itemresponses[itmindex].getResponse() 
          : "";
        if(username) {
          answers.push({
            name: username,
            link: formresponses[frmindex].getEditResponseUrl()
          });
        }
      } else if(itmindex < 2) {
        // item[1]: responses
        if(!("columns" in questions)) {
          questions.columns = itemresponses[itmindex].getItem().asGridItem().getColumns();
//          Logger.log(questions.columns);
        }
        if(!("rows" in questions)) {
          questions.rows = itemresponses[itmindex].getItem().asGridItem().getRows();
//          Logger.log(questions.rows);
        }
        if(responses.length < 1) {
          questions.rows.forEach(function(row) {
            var obj = {};
            obj.date = row;
            obj.values = [];
            questions.columns.forEach(function(col) {
              obj.values.push({
                value: col,
                users: []
              });
            });
            responses.push(obj);
          });
        }
//        Logger.log(itemresponses[itmindex].getResponse());
        Logger.log(itemresponses[itmindex].getResponse());
        itemresponses[itmindex].getResponse()
          .forEach(function(elem, dtindex) {
            responses[dtindex].values.some(function(prop) {
              if(prop.value == elem) {
                prop.users.push({
                  id: userid,
                  name: username
                });
                return true;
              }
            });
          });
      } else if(itmindex < 3) {
        // item[2] : comments
        if(itemresponses[itmindex].getResponse()) {
          comments.push({
            user: {id: userid, name: username},
            value: itemresponses[itmindex].getResponse()
          });
        }
      } else {
        // item[x] : error
        throw new Error("form items over 3.");
      }
    }
  }
  if(!(Array.isArray(questions.columns))){
    questions.columns = [];
  }
  if(!(Array.isArray(responses))){
    responses = [];
  }
  if(!(Array.isArray(comments))){
    comments = [];
  }
  
  
//  Logger.log(responses);
  res.questions = questions;
  res.responses = responses;
  res.comments = comments;
  res.answers = answers;
  return res;
}

//
function modifiResponse() {
  var template = HtmlService.createTemplateFromFile("pageeditresponses");
  // get form responses
  var result = [];
  var formresponses = FormApp.getActiveForm().getResponses();
  formresponses.forEach(function(rsp) {
    var obj = {}
    obj.name = (rsp.getItemResponses()[0]).getResponse();
    obj.link = rsp.getEditResponseUrl();
    result.push(obj);
  });
  template.res = result;
  var html = template.evaluate();
//  FormApp.getUi().showModalDialog(html, "回答を修正する");
  FormApp.getUi().showSidebar(html);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}