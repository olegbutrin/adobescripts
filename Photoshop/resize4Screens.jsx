#target photoshop

var scriptName = 'Resize for Screens';
var scriptVersion = '2017.11.23';
var scriptCopyright = '© Oleg Butrin (wp.me/p0Xz) 2017';

var sizes = [
	{height:2048, width:1536, name:'_ipad_ret'},
	{height:960, width:640, name:'_iphone4'},
	{height:1136, width:640, name:'_iphone5'},
	{height:1334, width:750, name:'_iphone61'},
	{height:2208, width:1242, name:'_iphone62'},
	{height:1280, width:800, name:'_google1'},
	{height:1280, width:720, name:'_google2'},
]

File.prototype.writeXML = function(xml) {
	this.encoding = 'UTF-8';
	this.open('w');
	this.write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + xml.toXMLString());
	this.close();
	return true;
}


File.prototype.readXML = function() {
	this.open('r');
	var str = this.read();
	this.close();
	return XML(str);
}

function generateSampleXML (list) {
	var xmlData = new XML('<screens/>');
	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var screenData = new XML('<screen/>');
		screenData.@name = item.name;
		screenData.@height = item.height;
		screenData.@width = item.width;
		screenData.@enable = 'true';
		xmlData.appendChild(screenData);
	}
	return xmlData;
}

function itemFormat (name, width, height) {
	return name + ' (' + width + 'x' + height + ')';
}

function pBar() {
    this.labels = {};
    this.dialog = 'palette{preferredSize: [300, 64],\
		info: Group {alignment: "fill", alignChildren: "fill", orientation: "column", margins: 12, \
			progress:Progressbar{}\
		}\
	}';

    this.window = new Window(this.dialog);

    this.setProgress = function(maxvalue) {
        this.window.info.progress.minvalue = 0;
        this.window.info.progress.maxvalue = maxvalue;
        this.window.info.progress.value = 0;
    }

    this.up = function() {
        this.window.info.progress.value++;
    }

    this.show = function() {
        this.window.show();
    }

    this.close = function() {
        this.window.close();
    }
    return this;
}

function UI () {

	var result = {status: false};

	var settingFile = File(Folder.userData + '/resize4src.xml');
	if (!settingFile.exists) {
		var xmlData = generateSampleXML(sizes);
		if (settingFile.open('w')) {
			settingFile.close();
			settingFile.writeXML(xmlData);
		} else {
			alert('No access for settings file!');
			return false;
		}
	}

	function fillList (list, xmlData) {
		list.removeAll();
		for (var i = 0; i < xmlData.elements().length(); i++) {
			var item = xmlData.elements()[i];
			var label = itemFormat(item.@name.toString(), item.@width.toString(), item.@height.toString()).replace(/^_/gim, '');
			if (item.@enable.toString() == 'true') {
				check = '\u2713  ';
			} else {
				check = '\u2717  ';
			}
			list.add('item', check + label);
			// li.checked = item.@enable.toString() == 'true';
		}
	}

	var xmlData = settingFile.readXML();
	
	var dialog = new Window ('dialog');
	with (dialog) {
		text = [scriptName, scriptVersion].join(' ');
		orientation = 'column';
		alignment: 'top';
		margins = 8;
	}

	var grp_main = dialog.add('group {orientation: "row", alignment: "top", alignChildren: ["fill", "fill"]}');
	
	var pnl_items = grp_main.add('panel {orientation: "column", margins: 16}');
	var lst_items = pnl_items.add('listbox', undefined, []);
	var grp_manage = pnl_items.add('group');
	var btn_add = grp_manage.add('button');
	var btn_rem = grp_manage.add('button');

	var pnl_options = grp_main.add('panel {orientation: "column", margins: 8}');
	var grp_background = pnl_options.add('group {orientation: "column", alignChildren: ["fill", "fill"], margins: 8}');
	var lbl_background = grp_background.add('statictext');
	var rbt_transparent = grp_background.add('radiobutton {indent: 4}');
	var rbt_bkgcolor = grp_background.add('radiobutton {indent: 4}');
	var rbt_bkgimage = grp_background.add('radiobutton {indent: 4}');
	
	var grp_motion = grp_background.add('group {orientation: "column"}');
	var chk_motion = grp_motion.add('checkbox');
	var grp_motionvalue = grp_motion.add('group {orientation: "row", alignChildren: ["center", "center"]}');
	var txt_motionvalue = grp_motionvalue.add('edittext');
	var sld_motionvalue = grp_motionvalue.add('slider {minvalue: 1, maxvalue: 100, value: 5}');


	lst_items.minimumSize.width = 260;
	lst_items.maximumSize.width = 260;

	lst_items.alignment = 'fill';

	rbt_transparent.maximumSize.height = rbt_bkgcolor.maximumSize.height = rbt_bkgimage.maximumSize.height = 18;

	txt_motionvalue.characters = 4;

	var grp_mainbtn = dialog.add('group {orientation: "row"}')

	var btn_run = grp_mainbtn.add('button');
	var btn_cancel = grp_mainbtn.add('button');

	var lbl_copyright = dialog.add('statictext {justify: "center", alignment: "center"}');

	pnl_items.text = 'Screens'
	pnl_options.text = 'Options'
	btn_add.text = 'Add';
	btn_rem.text = 'Remove';
	lbl_background.text = 'Fill gaps:'
	rbt_transparent.text = 'transparent';
	rbt_bkgcolor.text = 'background color';
	rbt_bkgimage.text = 'fit image'
	chk_motion.text = 'with motion blur';
	btn_run.text = 'Generate files';
	btn_cancel.text = 'Cancel';
	txt_motionvalue.text = sld_motionvalue.value.toString() + '%';
	lbl_copyright.text = scriptCopyright;

	dialog.cancelElement = btn_cancel

	
	btn_add.onClick = function () {

		var result = {status: false};
 
		function fnameValidate () {
			var txt = this.text;
			txt = txt.replace(/[^A-Za-z0-9_]/gim, '');
			txt = txt.replace('/^_/gim', '');
			this.text = txt;
		}

		function integerValidate () {
			var value = isNaN(parseInt(this.text)) ? '' : parseInt(this.text).toString();
			if (!value) {
				value = 1;
			}
			this.text = value;
		}

		var extra = new Window ('dialog');
		var epnl_main = extra.add('panel {orientation: "column", alignment: "top", alignChildren: ["fill", "fill"]}');
	
		var egrp_name = epnl_main.add('group {alignment: "top", alignChildren: ["fill", "center"]}');
		var egrp_width = epnl_main.add('group {alignment: "top", alignChildren: ["fill", "center"]}');
		var egrp_height = epnl_main.add('group {alignment: "top", alignChildren: ["fill", "center"]}');

		var elbl_name = egrp_name.add('statictext', undefined, 'Name:');
		var elbl_width = egrp_width.add('statictext', undefined, 'Width:');
		var elbl_height = egrp_height.add('statictext', undefined, 'Height:');

		elbl_name.minimumSize.width = elbl_width.minimumSize.width = elbl_height.minimumSize.width = 48;

		var etxt_name = egrp_name.add('edittext');
		var etxt_width = egrp_width.add('edittext');
		var etxt_height = egrp_height.add('edittext');

		etxt_name.minimumSize.width = etxt_width.minimumSize.width = etxt_height.minimumSize.width = 128;

		etxt_name.onChange = fnameValidate;
		etxt_width.onChange = etxt_height.onChange = integerValidate;

		var egrp_btn = epnl_main.add('group');
		var ebtn_add = egrp_btn.add('button');
		var ebtn_cancel = egrp_btn.add('button');

		ebtn_add.text = 'Add';
		ebtn_cancel.text = 'Cancel';

		dialog.cancelElement = ebtn_cancel;

		ebtn_add.onClick = function () {
			result.status = true;
			result.name = etxt_name.text;
			result.width = etxt_width.text;
			result.height = etxt_height.text;
			extra.close();
		}

		ebtn_cancel.onClick = function () {
			extra.close();
		}

		etxt_name.active = true;
		extra.show();

		if (result.status && result.name != '' && result.width != '' && result.height != '') {
			addXML = new XML('<screen/>');
			addXML.@name = '_' + result.name;
			addXML.@width = result.width;
			addXML.@height = result.height;
			addXML.@enable = 'true';

			xmlData.appendChild(addXML);
			settingFile.writeXML(xmlData);
			fillList(lst_items, xmlData);
		}
	}

	btn_rem.onClick = function () {
		for (var i = 0; i < lst_items.items.length; i++) {
			if (lst_items.items[i] == lst_items.selection) {
				delete xmlData.elements()[i];
				settingFile.writeXML(xmlData);
				fillList(lst_items, xmlData);
				lst_items.selection = lst_items.items[(i - 1) > 0 ? (i - 1) : 0];
				break;
			}
		}
	}

	lst_items.onDoubleClick = function () {
		for (var i = 0; i < this.items.length; i++) {
			if (this.items[i] == this.selection) {
				xmlData.elements()[i].@enable = !this.items[i].text.indexOf('\u2713') == 0;
				settingFile.writeXML(xmlData);
				fillList(this, xmlData);
				this.selection = this.items[i];
				break;
			}
		}
	}

	rbt_transparent.onClick = function () {
		grp_motion.enabled = !this.value;
	}

	rbt_bkgcolor.onClick = function () {
		grp_motion.enabled = !this.value;
	}

	rbt_bkgimage.onClick = function () {
		grp_motion.enabled = this.value;
	}

	txt_motionvalue.onChange = function () {
		var value = isNaN(parseInt(this.text)) ? sld_motionvalue.minvalue : parseInt(this.text);
		if (!value) {
			value = 1;
		}
		this.text = value.toString() + '%';
		sld_motionvalue = value;
	}

	sld_motionvalue.onChanging = function () {
		this.value = Math.round(this.value);
		txt_motionvalue.text = this.value.toString() + '%';
	}

	btn_run.onClick = function () {
		result.status = true;
		result.xml = xmlData;
		switch (true) {
			case rbt_transparent.value:
				result.background = 'transparent';
			break;
			case rbt_bkgcolor.value:
				result.background = 'backgroundcolor';
			break;
			case rbt_bkgimage.value:
				result.background = 'image';
				result.motion = chk_motion.value;
				result.motionvalue = sld_motionvalue.value;
			break;
		}
		dialog.close();
	}

	btn_cancel.onClick = function () {
		dialog.close();
	}

	rbt_bkgimage.value = true;
	chk_motion.value = true;

	fillList(lst_items, xmlData);

	dialog.show();

	return result;
}

function main () {
	if (app.documents.length < 1) {
		alert('No images are open!');
		return false;
	}
	if (app.activeDocument.layers.length != 1) {
		alert('Image contains more than one layer!');
		return false;
	}

	var doc = app.activeDocument;
	var layer = doc.layers[0];
	var settings = UI();

	if (!settings.status) {
		return false;
	}
	
	var startRulerUnits = app.preferences.rulerUnits;
	var startTypeUnits = app.preferences.typeUnits;
	var startDisplayDialogs = app.displayDialogs;
	app.preferences.rulerUnits = Units.PIXELS;
	app.preferences.typeUnits = TypeUnits.PIXELS;
	app.displayDialogs = DialogModes.NO;

	var bounds = layer.bounds;
	var res = doc.resolution;

	var lheight = UnitValue(bounds[3]) - UnitValue(bounds[1]);
	var lwidth = UnitValue(bounds[2]) - UnitValue(bounds[0]);

	docExportOptions = new ExportOptionsSaveForWeb;
	docExportOptions.format = SaveDocumentType.PNG;
	docExportOptions.transparency = true;
	docExportOptions.blur = 0.0;
	docExportOptions.includeProfile = false;
	docExportOptions.interlaced = true;
	docExportOptions.optimized = true;
	docExportOptions.quality = 100;
	docExportOptions.PNG8 = true;
	docExportOptions.ditherAmount = 100;

	var progress = new pBar();
	progress.setProgress(settings.xml.elements().length() - 1);
	progress.show();

	for (var i = 0; i < settings.xml.elements().length(); i++) {
		progress.up();
		var item = settings.xml.elements()[i];
		if (item.@enable.toString() == 'true') {
			var width = parseInt(item.@width.toString());
			var height = parseInt(item.@height.toString());
			var fileName = File(doc.fullName.toString().replace(/\.[^\.]+/gim, item.@name.toString() + '.png'));
			
			var ndoc = doc.duplicate(fileName);
			var nlayer = ndoc.layers[0];
			nlayer.isBackgroundLayer = false;

			var pH = height / lheight.value;
			var pW = width / lwidth.value;

			if (pH <= pW) {
				ndoc.resizeImage(undefined, height, res, ResampleMethod.BICUBIC);
				ndoc.resizeCanvas(width, undefined, AnchorPosition.MIDDLECENTER);
			} else {
				ndoc.resizeImage(width, undefined, res, ResampleMethod.BICUBIC);
				ndoc.resizeCanvas(undefined, height, AnchorPosition.MIDDLECENTER);
			};

			var back = nlayer.duplicate(nlayer, ElementPlacement.PLACEAFTER);
			ndoc.activeLayer = back;

			switch (settings.background) {
				case 'transparent':
					back.clear();
				break;
				case 'backgroundcolor':
					back.clear();
					ndoc.selection.fill(app.backgroundColor);
				break;
				case 'image':
					var bb = back.bounds;
					var bHeight = UnitValue(bb[3]) - UnitValue(bb[1]);
					var bWidth = UnitValue(bb[2]) - UnitValue(bb[0]);
					if (ndoc.height > bHeight) {
						var p = ndoc.height / bHeight * 100;
						back.resize(p, p, AnchorPosition.MIDDLECENTER);
						if (settings.motion) {
							back.applyMotionBlur(90, Math.round(bHeight * settings.motionvalue / 100));
						}
					} else {
						var p = ndoc.width / bWidth * 100;
						back.resize(p, p, AnchorPosition.MIDDLECENTER);
						if (settings.motion) {
							back.applyMotionBlur(0, Math.round(bWidth * settings.motionvalue / 100));
						}
					}
				break;
			}

			// ndoc.flatten();

			ndoc.exportDocument(fileName, ExportType.SAVEFORWEB, docExportOptions);
			ndoc.close(SaveOptions.DONOTSAVECHANGES);
		}
	};

	progress.close();

	app.preferences.rulerUnits = startRulerUnits;
	app.preferences.typeUnits = startTypeUnits;
	app.displayDialogs = startDisplayDialogs;

	return true;
}

if (main()) {
	alert('All done!');
}