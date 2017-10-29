// ==UserScript==
// @name         Facebook Add Download
// @namespace    http://tampermonkey.net/
// @version      0.2
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
// thanks        https://greasyfork.org/en/scripts/24295-facebook-video-downloader


(function() {
    'use strict';
    var status = 0; // 0 for none, 1 for click, 2 for done
    function newElement(oldele) {
        return jQuery("<"+oldele.tagName+">",{class:oldele.className});
    }
    function toUI(target, want) {
        var comment_div = $(target).find('a[title]');
        comment_div.parent().parent().parent().append(
            newElement(comment_div.parent().parent()[0]).append(
                newElement(comment_div.parent()[0]).append(
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
        if ($(".uiButton").length && status < 1 ) {
            $(".uiButton")[0].click();
            status = 1;
        }
        if (status === 1 && $('a[data-action-type="download_photo"]').length) {
            toUI(buttons,  $('a[data-action-type="download_photo"]'));
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

            var myButton = jQuery("<a/>",
                                  {'href'  : url[0].href,
                                   'class' : "myURL",
                                   'target': "_blank"});
            toUI(feed, myButton.append("URL"));
            console.log("Add Download URL OK");
        }
    }

    // this code is modified from https://greasyfork.org/en/scripts/24295-facebook-video-downloader
    var prefix = 'videoData:[{';
    var suffix = '}],';

    function getFBVideos() {
        var scripts = document.getElementsByTagName('script');
        var result = [];

        for (var i = 0; i < scripts.length; ++i) {
            var txt = scripts[i].textContent;
            var pos;

            while ((pos = txt.indexOf(prefix)) !== -1) {
                txt = txt.substr(pos + prefix.length - 1);
                var endPos = txt.indexOf(suffix);

                if (endPos === -1) {
                    continue;
                }

                var videoData = txt.substr(0, endPos + 1);
                // result.push(JSON.parse(videoData));
                result.push(eval('(' + videoData +')'));
                txt = txt.substr(endPos);
            }
        }
        return result;
    }

    function addDownload() {
        var feed = $(".fbUserStory");
        if (feed.length !== 1 || $(feed).find('.myVIDEOURL').length > 0)
            return ;
        console.log("One video");
        var videosData = getFBVideos();
        for (var i=0; i<videosData.length; ++i) {
            var videoData = videosData[i];
            var hd = videoData.hd_src_no_ratelimit || videoData.hd_src;
            console.log(hd);
            if (!hd)
                return;
            toUI(feed, jQuery("<a/>",
                              {'href'  : hd,
                               'class' : "myVIDEOURL",
                               'target': "_blank",
                               'download': ''}).append("V" + i));
        }
        console.log("Download video src OK");
    }

    function addAll(){
        addButtonInTheater();
        addButtonInFeed();
        addDownload();
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