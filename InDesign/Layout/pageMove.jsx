#target indesign

var lbl = 'com.rudtpru.pagemove'

// Пример скрипта для копирования страниц из одного документа в другой.
// Проверен только на двухстраничных разворотах.

function getPIPosition (pi) { //сохраняет позицию pageItem относительно page.margin
	var page = pi.parentPage;
	if (!page) {
		return false;
	}
	var point = [
		page.bounds[0] - page.marginPreferences.top,
		page.bounds[1] - page.marginPreferences.left
	];
	var bounds = pi.geometricBounds;
	var relative = [ bounds[0] - point[0], bounds[1] - point[1] ];
	pi.insertLabel(lbl, relative.toSource())
}

function setPIPosition (pi) { //восстанавливает позицию pageItem относительно page.margin
	var page = pi.parentPage;
	if (!page) {
		return false;
	}
	var position = eval(pi.extractLabel(lbl));
	if (position == 'undefined' || position.constructor.name != 'Array') {
		return false;
	}
	var point = [
		page.bounds[0] - page.marginPreferences.top,
		page.bounds[1] - page.marginPreferences.left
	];
	pi.move( [ point[1] + position[1], point[0] + position[0] ] );
}

function savePIPositions (pages) { //сохраняет позицию всех pageItem
	for (var i = 0; i < pages.length; i++) {
		var page = pages[i];
		for (var j = 0; j < page.pageItems.length; j++) {
			getPIPosition(page.pageItems[j]);
		}
	}
}

function restorePIPositions (pages) { //восстанавливает позицию всех pageItem
	for (var i = 0; i < pages.length; i++) {
		var page = pages[i];
		for (var j = 0; j < page.pageItems.length; j++) {
			setPIPosition(page.pageItems[j]);
		}
	}
}

function main () {
	var dest = app.documents[0]; // активный документ, КУДА добавляются страницы
	var source = app.documents[1]; // неактивный документ, ОТКУДА берутся страницы

	savePIPositions(source.pages)

	// если конечная страница dest на той же стороне, что первая страница source, добавляем одну страницу в dest
	if (dest.pages.lastItem().getElements()[0].side == source.pages[0].getElements()[0].side) {
		dest.pages.add(LocationOptions.AFTER, dest.pages.lastItem())
	}
	//копирование всех страниц одновременно позволяет не разбивать связанные фреймы
	var pages = source.pages.everyItem().duplicate(LocationOptions.AFTER, dest.pages.lastItem());

	restorePIPositions(pages);
}

main();