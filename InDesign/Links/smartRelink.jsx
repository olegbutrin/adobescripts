#target indesign
$.localize = true;

var scriptName = 'Smart Relink';
var scriptVersion = '1.0';
var scriptCopyright = '© Oleg Butrin (wp.me/p0Xz) 2017';

var lang = {
	nodoc: 			localize( { en: 'No documents are open!', ru: 'Нет открытых документов!' } ),
	options: 		localize( { en: 'Process links:', ru: 'Обработать связи:' } ),
	normal: 		localize( { en: 'normal', ru: 'нормальные' } ),
	outdate: 		localize( { en: 'out of date', ru: 'необновленные' } ),
	missing: 		localize( { en: 'missing', ru: 'отсутствующие' } ),
	inacessible: 	localize( { en: 'inacessible', ru: 'недоступные' } ),
	support: 		localize( { en: 'Support script author', ru: 'Поддержать автора скрипта' } ),
	supportinfo: 	localize( { en: 'For suport author you can use Yandex Wallet', ru: 'Для поддержки автора вы можете воспользоваться Яндекс Кошельком' } ),
	nolinks: 		localize( { en: 'No links selected!', ru: 'Не выбрано ни одного связанного файла!' } ),
	basefolder: 	localize( { en: 'Folder to relink:', ru: 'Папка для обновления связанных файлов:' } ),
	smartlink: 		localize( { en: 'Some links not found in selected folder.\nIf files was renamed, script can try to find it.\nStart find now?', ru: 'Некоторые связанные файлы не найдены в выбранной папке.\nЕсли файлы были переименованы, скрипт может попытаться найти их.\nВыполнить поиск сейчас?' } ),
	smartresall: 	localize( { en: 'All renamed files was relinked!', ru: 'Все переименованные связанные файлы были обновлены!' } ),
	smartressome: 	localize( { en: 'Some renamed files was relinked!', ru: 'Некоторые переименованные связанные файлы были обновлены!' } ),
	smartresfail: 	localize( { en: 'No one renamed file was relinked!', ru: 'Переименованные связанные файлы не были обновлены!' } ),
}

Array.prototype.countString = function () {
	return '(' + this.length.toString() + ')';
}

Array.prototype.last = function() {
	return this[this.length - 1];
}

Array.prototype.isElement = function(item) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == item) {
			return true;
		}
	}
	return false;
}

function support() {
	Window.prompt(lang.supportinfo, 'https://money.yandex.ru/to/410015389492630', lang.support)
}

function getLinkNames(doc) {
	var res = [];
	for (var i = 0; i < doc.links.length; i++) {
		var link = doc.links[i];
		var file = File(link.filePath);
		res.push(decodeURI(file.fsName).toLowerCase());
	}
}

function collectLinks(doc) {
	var res = { normal: [], missing: [], outdate: [], inacessible: [], embedded: []};
	for (var i = 0; i < doc.links.length; i++) {
		switch (doc.links[i].status) {
			case LinkStatus.NORMAL:
				res.normal.push(doc.links[i]);
			break;
			case LinkStatus.LINK_MISSING:
				res.missing.push(doc.links[i]);
			break;
			case LinkStatus.LINK_OUT_OF_DATE:
				res.outdate.push(doc.links[i]);
			break;
			case LinkStatus.LINK_INACCESSIBLE:
				res.inacessible.push(doc.links[i]);
			break;
			case LinkStatus.LINK_EMBEDDED:
				res.embedded.push(doc.links[i]);
			break;
		}
	}
	return res;
}

function collectFiles(folder, xmlData) {
	var items = folder.getFiles('*.*');
	for (var i = 0; i < items.length; i++) {
		switch (items[i].constructor.name) {
			case 'Folder': collectFiles(items[i], xmlData); break;
			case 'File':
				var file = items[i];
				var xmlItem = new XML('<file/>');
				xmlItem.@name = decodeURI(file.name);
				xmlItem.@fullName = decodeURI(file.absoluteURI);
				xmlItem.@length = file.length;
				xmlItem.@modified = file.modified.toUTCString();
				xmlItem.@type = decodeURI(file.name).split('.').last().toLowerCase();
				xmlData.appendChild(xmlItem);
			break;
		}
	}
}

function sortFileList(xmlList) {

	function fSort (a, b) {
		if (a.modified != b.modified) {
			return a.modified - b.modified;
		}
		if (a.parent != b.parent) {
			return a.parent - b.parent;
		}
		return 0;
	}

	var res = [];
	for (var i = 0; i < xmlList.length(); i++) {
		res.push( {
			item: xmlList[i], 
			modified: Date(xmlList[i].@modified.toString()), 
			parent: File(xmlList[i].@fullName.toString()).parent.modified,
		} );
	}

	res.sort(fSort);
	res.reverse();
	return res[0].item;
}

function relink(links, xmlData) {
	var res = { normal: [], missing: [] }
	for (var i = 0; i < links.length; i++) {
		var link = links[i];
		var file = File(link.filePath);
		var fname = decodeURI(file.name);
		var rel = xmlData.xpath('.//file[@name="' + fname + '"]');
		switch (rel.length()) {
			case 0: 
				res.missing.push(link); 
			break;
			case 1:
				var nfile = File(rel[0].@fullName.toString());
				if (nfile != file) {
					link.relink(nfile);
				}
				res.normal.push(link);
			break;
			default:
				var nrel = sortFileList(rel);
				var nfile = File(nrel.@fullName.toString());
				if (nfile != file) {
					link.relink(nfile);
				}
				res.normal.push(link);
			break;
		}
	}
	return res;
}

function smartRelink(doc, links, xmlData) {
	var res = { normal: [], missing: [] };
	var names = getLinkNames(doc);
	for (var i = 0; i < links.length; i++) {
		var link = links[i];
		var file = File(link.filePath);
		var type = decodeURI(file.name).split('.').last().toLowerCase();
		var rel = xmlData.xpath('.//file[@length="' + link.size.toString() + '" and @type="' + type + '"]');
		switch (rel.length()) {
			case 0: 
				res.missing.push(link); 
			break;
			case 1:
				var nfile = File(rel[0].@fullName.toString());
				if (nfile != file) {
					link.relink(nfile);
				}
				res.normal.push(link);
			break;
			default:
				var nrel = sortFileList(rel);
				var nfile = File(nrel.@fullName.toString());
				if (nfile != file) {
					link.relink(nfile);
				}
				res.normal.push(link);
			break;
		}
	}
	return res;
}

function getExistFolder(links) {
	links.reverse();
	for (var i = 0; i < links.length; i++) {
		var fldr = File(links[i].filePath).parent;
		if (fldr.exists) {
			return fldr;
		}
	}
	return Folder.myDocuments;
}

function main() {
	if (app.documents.length == 0) {
		Window.alert(lang.nodoc);
		return false;
	}
	var doc = app.activeDocument;
	var links = collectLinks(doc);
	var dialog = app.dialogs.add({name: [scriptName, scriptVersion, scriptCopyright].join(' ')});
	with (dialog.dialogColumns.add()) {
		with (dialogRows.add().borderPanels.add().dialogColumns.add()) {
			dialogRows.add().staticTexts.add( { staticLabel: lang.options } );
			with (dialogRows.add()) {
				with (dialogColumns.add()) {
					var uNormal = dialogRows.add().checkboxControls.add( { staticLabel: [lang.normal, links.normal.countString()].join(' '), checkedState: false } );
					var uOutdate = dialogRows.add().checkboxControls.add( { staticLabel: [lang.outdate, links.outdate.countString()].join(' '), checkedState: links.outdate.length != 0 } );
				}
				with (dialogColumns.add()) {
					var uMissing = dialogRows.add().checkboxControls.add( { staticLabel: [lang.missing, links.missing.countString()].join(' '), checkedState: links.missing.length != 0 } );
					var uInacessible = dialogRows.add().checkboxControls.add( { staticLabel: [lang.inacessible, links.inacessible.countString()].join(' '), checkedState: links.inacessible.length != 0 } );
				}
			}
		}
		with (dialogRows.add()) {
			var uSupport = checkboxControls.add( { staticLabel: lang.support  } )
		}
	}
	if (!dialog.show()) {
		return false;
	}

	var alllinks = [];
	if (uNormal.checkedState) {
		alllinks = alllinks.concat(links.normal);
	}
	if (uOutdate.checkedState) {
		alllinks = alllinks.concat(links.outdate);
	}
	if (uMissing.checkedState) {
		alllinks = alllinks.concat(links.missing);
	}
	if (uInacessible.checkedState) {
		alllinks = alllinks.concat(links.inacessible);
	}

	if (alllinks.length == 0) {
		Window.alert(lang.nolinks);
		if (uSupport.checkedState) {
			support();
		}
		return false;
	}

	var basefolder = getExistFolder(alllinks).selectDlg(lang.basefolder);
	if (!basefolder) {
		return false;
	}

	var xmlData = new XML('<files/>');
	collectFiles(basefolder, xmlData);

	var res = relink(alllinks, xmlData);

	if (res.missing.length !=0 ) {
		var question = Window.confirm(lang.smartlink, false, [scriptName, scriptVersion].join(' '));
		if (question) {
			var smart = smartRelink(doc, res.missing, xmlData);
			if (smart.missing.length == 0) {
				Window.alert(lang.smartresall);
			};
			if (smart.missing.length != 0 && smart.normal.length != 0) {
				Window.alert(lang.smartressome);
			};
			if (smart.normal.length == 0) {
				Window.alert(lang.smartresfail);
			}
		}
	}

	if (uSupport.checkedState) {
		support();
	}

	return true;
}

main();