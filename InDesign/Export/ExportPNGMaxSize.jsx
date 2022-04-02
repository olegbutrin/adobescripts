//@target indesign

String.prototype.trim = function () {
  return this.replace(/^\s|\s$/gim, "");
};

function formatNum(num, count) {
  var str = num.toString();
  while (str.length < count) {
    str = "0" + str;
  }
  return str;
}

function rangeToArray(range, min, max) {
  var result = [];
  var arr = range.split(/\,/);
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].indexOf("-") != -1) {
      var subarr = arr[i].split("-");
      var beg = parseInt(subarr[0]);
      var end = parseInt(subarr[subarr.length - 1]);
      if (!isNaN(beg) && !isNaN(end)) {
        var start = Math.min(beg, end);
        var finish = Math.max(beg, end);
        while (start <= finish) {
          if (start >= min && start <= max) {
            result.push(start);
          }
          start++;
        }
      }
    } else {
      var num = parseInt(arr[i].trim());
      if (!isNaN(num) && num >= min && num <= max) {
        result.push(num);
      }
    }
  }
  return result.sort(function (a, b) {
    return a - b;
  });
}

function arrayToRange(array) {
  if (!array.length) {
    return "";
  }
  var result = [];
  var beg = array[0];
  var end = array[0];
  for (var i = 1; i < array.length; i++) {
    if (array[i] - end === 1) {
      end = array[i];
    } else {
      if (beg === end) {
        result.push(beg.toString());
      } else {
        result.push([beg, end].join("-"));
      }
      beg = array[i];
      end = array[i];
    }
  }
  if (beg === end) {
    result.push(beg.toString());
  } else {
    result.push([beg, end].join("-"));
  }
  return result.join(", ");
}

function UI(count) {
  var options = {
    status: false,
    range: rangeToArray([1, count].join("-"), 1, count),
    folder: "",
    width: 1024,
    height: 1024,
  };

  // DLG
  // ===
  var dlg = new Window("dialog");
  dlg.text = "PNG Export";
  dlg.orientation = "column";
  dlg.alignChildren = ["center", "top"];
  dlg.spacing = 10;
  dlg.margins = 16;

  // PNL_OPTIONS
  // ===========
  var pnl_options = dlg.add("panel", undefined, undefined, {
    name: "pnl_options",
  });
  pnl_options.text = "Options";
  pnl_options.orientation = "column";
  pnl_options.alignChildren = ["fill", "top"];
  pnl_options.spacing = 10;
  pnl_options.margins = [12, 18, 12, 12];

  // GRP_RANGE
  // =========
  var grp_range = pnl_options.add("group", undefined, { name: "grp_range" });
  grp_range.orientation = "row";
  grp_range.alignChildren = ["left", "fill"];
  grp_range.spacing = 10;
  grp_range.margins = 0;

  var lbl_range = grp_range.add("statictext", undefined, undefined, {
    name: "lbl_range",
  });
  lbl_range.text = "Page Range:";
  lbl_range.preferredSize.width = 90;
  lbl_range.justify = "right";

  var txt_range = grp_range.add('edittext {properties: {name: "txt_range"}}');
  txt_range.preferredSize.width = 136;

  // GRP_FOLDER
  // ==========
  var grp_folder = pnl_options.add("group", undefined, { name: "grp_folder" });
  grp_folder.orientation = "row";
  grp_folder.alignChildren = ["left", "center"];
  grp_folder.spacing = 10;
  grp_folder.margins = 0;

  var lbl_folder = grp_folder.add("statictext", undefined, undefined, {
    name: "lbl_folder",
  });
  lbl_folder.text = "Export Folder:";
  lbl_folder.preferredSize.width = 90;
  lbl_folder.justify = "right";

  var txt_folder = grp_folder.add(
    'edittext {properties: {name: "txt_folder", readonly: true}}'
  );
  txt_folder.preferredSize.width = 136;

  var btn_folder = grp_folder.add("button", undefined, undefined, {
    name: "btn_folder",
  });
  btn_folder.text = "Choose";

  // GRP_SIZE
  // ========
  var grp_size = pnl_options.add("group", undefined, { name: "grp_size" });
  grp_size.orientation = "row";
  grp_size.alignChildren = ["left", "center"];
  grp_size.spacing = 10;
  grp_size.margins = 0;

  var lbl_width = grp_size.add("statictext", undefined, undefined, {
    name: "lbl_width",
  });
  lbl_width.text = "Max Width:";
  lbl_width.preferredSize.width = 90;
  lbl_width.justify = "right";

  var txt_width = grp_size.add('edittext {properties: {name: "txt_width"}}');
  txt_width.text = options.width.toString();
  txt_width.preferredSize.width = 64;

  var lbl_height = grp_size.add("statictext", undefined, undefined, {
    name: "lbl_height",
  });
  lbl_height.text = "Max Height: ";

  var txt_height = grp_size.add('edittext {properties: {name: "txt_height"}}');
  txt_height.text = options.height.toString();
  txt_height.preferredSize.width = 64;

  // GRP_BUTTONS
  // ===========
  var grp_buttons = dlg.add("group", undefined, { name: "grp_buttons" });
  grp_buttons.orientation = "row";
  grp_buttons.alignChildren = ["center", "center"];
  grp_buttons.spacing = 10;
  grp_buttons.margins = 12;

  var btn_export = grp_buttons.add("button", undefined, undefined, {
    name: "btn_export",
  });
  btn_export.text = "Export";

  var btn_cancel = grp_buttons.add("button", undefined, undefined, {
    name: "btn_cancel",
  });
  btn_cancel.text = "Cancel";

  // EVENNTS

  dlg.onShow = function () {
    txt_range.text = arrayToRange(options.range);
  };

  txt_range.onChange = function () {
    options.range = rangeToArray(txt_range.text, 1, count);
    txt_range.text = arrayToRange(options.range);
  };

  txt_width.onChange = function () {
    var text = txt_width.height;
    var num = parseInt(text);
    if (!isNaN(num)) {
      num = num < 32 ? 32 : num;
      num = num > 15360 ? 15360 : num;
      options.width = num;
      txt_width.text = options.width;
    } else {
      txt_width.text = options.width;
    }
  };

  txt_height.onChange = function () {
    var text = txt_height.height;
    var num = parseInt(text);
    if (!isNaN(num)) {
      num = num < 32 ? 32 : num;
      num = num > 15360 ? 15360 : num;
      options.height = num;
      txt_height.text = options.height;
    } else {
      txt_height.text = options.height;
    }
  };

  btn_folder.onClick = function () {
    var startFolder = options.folder ? options.folder : Folder.myDocuments;
    var folder = startFolder.selectDlg("Select Export Folder:");
    if (folder) {
      options.folder = folder;
    }
    txt_folder.text = decodeURI(options.folder.name);
    txt_folder.helpTip = options.folder.fsName;
  };

  btn_export.onClick = function () {
    if (options.range && options.folder && (options.width || options.height)) {
      options.status = true;
    }
    dlg.close();
  };

  btn_cancel.onClick = function () {
    options.status = false;
    dlg.close();
  };

  dlg.show();

  return options;
}

function exportPageToPNG(doc, page, num, prefs, options) {
  var bounds = page.bounds;
  var height = bounds[2] - bounds[0];
  var width = bounds[3] - bounds[1];

  var hdpi = (72 * options.height) / height;
  var wdpi = (72 * options.width) / width;

  var dpi = Math.min(hdpi, wdpi);
  prefs.pageString = page.name;
  prefs.exportResolution = dpi;

  var pageNum = formatNum(options.range[num], String(doc.pages.length).length);

  var pngName = doc.name.toString().replace(/\.[^\.]+$/gim, "");
  var pageName = pngName + "_" + pageNum + ".png";
  var pngFile = File([options.folder, pageName].join("/"));
  doc.exportFile(ExportFormat.PNG_FORMAT, pngFile);
}

function main() {
  if (!app.documents.length) {
    return false;
  }
  var doc = app.activeDocument;
  var options = UI(doc.pages.length);

  if (!options.status) {
    return false;
  }

  var prefs = app.pngExportPreferences;
  prefs.antiAlias = true;
  prefs.exportingSpread = false;
  prefs.pngColorSpace = PNGColorSpaceEnum.RGB;
  prefs.pngExportRange = PNGExportRangeEnum.EXPORT_RANGE;
  prefs.pageString = doc.pages[0].name;
  prefs.transparentBackground = true;
  prefs.pngQuality = PNGQualityEnum.HIGH;

  var hu = doc.viewPreferences.horizontalMeasurementUnits;
  var vu = doc.viewPreferences.verticalMeasurementUnits;

  doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.PIXELS;
  doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.PIXELS;

  app.scriptPreferences.userInteractionLevel =
    UserInteractionLevels.NEVER_INTERACT;

  for (var i = 0; i < options.range.length; i++) {
    var page = doc.pages[options.range[i] - 1];
    exportPageToPNG(doc, page, i, prefs, options);
  }

  app.scriptPreferences.userInteractionLevel =
    UserInteractionLevels.INTERACT_WITH_ALL;

  options.folder.execute();

  doc.viewPreferences.horizontalMeasurementUnits = hu;
  doc.viewPreferences.verticalMeasurementUnits = vu;
}

main();