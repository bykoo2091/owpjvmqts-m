
jQuery(function ($) {
	'use strict';

	$('.icon-back').click(function(){
		window.history.back();
		return false;
	});
	$('.btn-quick').click(function(){
		window.location = '02-1_이슈등록_(구매).html';
		return false;
	});
});