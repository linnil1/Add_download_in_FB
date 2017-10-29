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
    var status = 0; // 0 for none, 1 for click, 2 for done
    function newElement(oldele) {
        return jQuery("<"+oldele.tagName+">",{class:oldele.className});
    }
    function toUI(target, want) {
        target.parent().parent().parent().append(
            newElement(target.parent().parent()[0]).append(
                newElement(target.parent()[0]).append(
                   want[0])));
    }
    function addButtonInTheater() {
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
            toUI(comment_div,  $('a[data-action-type="download_photo"]'));
            $(".uiButton")[0].click();
            console.log("MY Facebook Add Download OK");
            status = 2;
        }
    }

    function addButtonInFeed() {
        var feed_all = $(".fbUserStory");
        for (var i=0; i<feed_all.length; ++i) {
            var feed = feed_all[i];
            if ($(feed).find('.myURL').length > 0 || $(feed).find('video').length === 0)
                continue;
            console.log("Add to Feed");

            var url;
            if ($(feed).find('a[rel="theater"]').length)
                url = $(feed).find('a[rel="theater"]');
            else if($(feed).find('a[href*="permalink"]').length)
                url = $(feed).find('a[href*="permalink"]');
            else
                continue;
            if (!url.length)
                continue;

            var comment_div = $(feed).find('a[title]');
            var myButton = jQuery("<a/>",
                                  {'href'  : url[0].href,
                                   'class' : "myURL",
                                   'target': "_blank"});
            toUI(comment_div, myButton.append("URL"));
            console.log("Add Download URL OK");
        }
    }

    function addAll(){
        addButtonInTheater();
        addButtonInFeed();
    }

    // main function
    var mutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    if(mutationObserver) {
        var body = document.querySelector('body');
        if(!body) {
            return;
        }
        var observer = new mutationObserver(addAll);
        observer.observe(body, {
            'childList': true,
            'subtree': true
        });
    }
})();