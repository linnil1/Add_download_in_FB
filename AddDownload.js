// ==UserScript==
// @name         Facebook Add Download
// @namespace    http://tampermonkey.net/
// @version      0.0
// @description  Add Download buttom in Facebook
// @author       linnil1
// @supportURL   None
// @include      http://facebook.com/*
// @include      http://*.facebook.com/*
// @include      https://facebook.com/*
// @include      https://*.facebook.com/*
// @run-at       document-idle
// @grant        none
// @require      https://code.jquery.com/jquery-3.2.1.min.js
//
// ==/UserScript==


(function() {
    'use strict';
    var mutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    var status = 0; // 0 for none, 1 for click, 2 for done
    function newElement(oldele) {
        return jQuery("<"+oldele.tagName+">",{class:oldele.className});
    }
    function addButton() {
        if (document.location.href.indexOf("theater") === -1 || status == 2){
            status = 0;
            return ;
        }
        console.log("Go Add");

        var buttons = $('.overlayBarButtons');
        if (buttons.find('a[data-action-type="download_photo"]').length) {
            status = 2;
            return;
        }
        var comment_div = buttons.find('a[title]');
        if ($(".uiButton").length && status < 1 ) {
            $(".uiButton")[0].click();
            status = 1;
        }
        if (status === 1 && $('a[data-action-type="download_photo"]').length) {
            var myButton = jQuery("<a/>");
            comment_div.parent().parent().parent().append(
                newElement(comment_div.parent().parent()[0]).append(
                    newElement(comment_div.parent()[0]).append(
                        $('a[data-action-type="download_photo"]')[0])));
            $(".uiButton")[0].click();
            console.log("MY Facebook Add Download OK");
            status = 2;
        }
    }

    var observer = new mutationObserver(addButton);
    if(mutationObserver) {
        var body = document.querySelector('body');
        if(!body) {
            return;
        }

        observer = new mutationObserver(addButton);
        observer.observe(body, {
            'childList': true,
            'subtree': true
        });
    }

})();