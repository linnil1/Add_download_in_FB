// ==UserScript==
// @name         Facebook Add Download
// @namespace    http://tampermonkey.net/
// @version      0.6
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
    function newElement(oldele) {
        return jQuery("<"+oldele.tagName+">",{class:oldele.className});
    }
    function toUI(target, want) {
        // find comment and copy one with wanted link
        var comment_div = $($(target).find("a.comment_link"));
        console.log(target);
        comment_div.parent().parent().parent().append(
            newElement(comment_div.parent().parent()[0]).append(
                newElement(comment_div.parent()[0]).append(
                   want[0])));
    }
    function addButtonInTheater() {
        // find if in theater mode
        if (document.location.href.indexOf("theater") === -1)
            return ;
        var screen = $(".fbPhotoSnowliftContainer");
        if (screen.find(".stage video").length)
            return;

        console.log("Add theater");
        // Done
        if (screen.find('.myURL_download').length) {
            return;
        }
        // wait click for download hash
        if (!screen.find(".myURL_download_click").length) {
           screen.find(".uiButton")[0].click();
           screen.find(".uiButton").addClass("myURL_download_click");
        }
        // wait click for download hash
        else if (screen.find('a[data-action-type="download_photo"]').length) {
            var url = screen.find('a[data-action-type="download_photo"]');
            url.addClass('myURL_download');
            toUI(screen, url);
            screen.find(".uiButton")[0].click();
            console.log("Add Download Link");
        }
    }

    function addGIF(feed) {
        // the most difference between GIF and video is muted. XDDD
        var nowVideo = $(feed).find('.mtm video');
        var href;
        if (!nowVideo.attr('class','myGIF')) {
            href = $(feed).find('span > a[rel="noopener nofollow"]');
            if (!href.length)
                nowVideo.click(); // pause to get url
            nowVideo.addClass('myGIF');
        }
        // this may be not robost
        href = $(feed).find('span > a[rel="noopener nofollow"]');
        if (!href.length)
            return ;
        href = decodeURIComponent(href[0].href).substr(6); // remove http in the front
        var httpIndex = href.indexOf("http");
        href = href.substr(httpIndex, href.toLowerCase().indexOf(".gif") + 4 - httpIndex);
        // add to feed
        console.log(href);
        var myButton = jQuery("<a/>", {
            'href'  : href,
            'class' : "myURL",
            'target': "_blank",
            'download': ""});
        toUI(feed, myButton.append("GIF"));
        nowVideo.click(); // unpause
        console.log("Add GIF");
        return ;
    }
    function addVideo(feed) {
        // find url of video for later used (addDownload)
        var url;
        if ($(feed).find('a[rel="theater"]').length)
            url = $(feed).find('a[rel="theater"]');
        else if($(feed).find('a[href*="permalink"]').length )
            url = $(feed).find('a[href*="permalink"]');
        else if($(feed).find('a[href*="videos"]').length )
            url = $(feed).find('a[href*="videos"]');
        else
            return;
        if (!url.length)
            return;
        // add to feed
        console.log(url);
        var myButton = jQuery("<a/>",
                              {'href'  : url[0].href,
                               'class' : "myURL",
                               'target': "_blank"});
        toUI(feed, myButton.append("URL"));
        console.log("Add Video");
    }

    function addImg(feed) {
        if ($(feed).find('.mtm img').length === 0)
            return ;
        // There may be many image in o feed
        var imgs = $(feed).find('.mtm div > img');
        for (var i=0; i<imgs.length; ++i) {
            var img = imgs[i];
            console.log(img);
            // add to feed
            toUI(feed, jQuery("<a/>", {
                'href'  : img.src,
                'class' : "myURL",
                'target': "_blank",
                'download': ""}).append("I" + i));
        }
        if (imgs.length)
            console.log("Add Img");
    }
    function addButtonInFeed() {
        var feed_all = $(".fbUserStory");
        for (var i=0; i<feed_all.length; ++i) {
            var feed = feed_all[i];
            if ($(feed).find('.myURL').length > 0)
                continue;
            console.log("Add Feed");
            // there may not have video and image together?
            if ($(feed).find('.mtm video').length) {
                if ($(feed).find('.mtm video[muted]').length)
                    addVideo(feed);
                else
                    addGIF(feed);
            }
            else {
                addImg(feed);
            }
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
        if (feed.length !== 1 || $(feed).find('.myURL_video').length > 0)
            return ;
        console.log("One feed with video");
        var videosData = getFBVideos();
        for (var i=0; i<videosData.length; ++i) {
            var videoData = videosData[i];
            console.log(videoData);
            var dataurl = videoData.hd_src_no_ratelimit || videoData.hd_src || videoData.sd_src_no_ratelimit || videoData.sd_src;
            if (!dataurl)
                return;
            toUI(feed, jQuery("<a/>",
                              {'href'  : dataurl,
                               'class' : "myURL_video",
                               'target': "_blank",
                               'download': ''}).append("V" + i));
            console.log("Download video src OK");
        }
    }
    function addButtonInComment() {
        var coms = $(".UFIComment");
        for (var i=0; i<coms.length; ++i) {
            var com = $(coms[i]);
            if (com.find(".myURL_comment").length)
                continue;
            var link = "";

            if (com.find(".UFICommentContent video").length) { // gif
                var nowVideo = $(com).find('.UFICommentContent video');
                var href;
                if (!nowVideo.attr('class','myGIF')) {
                    href = $(com).find('span > a[rel="noopener nofollow"]');
                    if (!href.length)
                        nowVideo.click(); // pause to get url
                    nowVideo.addClass('myGIF');
                }
                // this may be not robost
                href = $(com).find('span > a[rel="noopener nofollow"]');
                if (!href.length)
                    return ;
                href = decodeURIComponent(href[0].href).substr(6); // remove http in the front
                var httpIndex = href.indexOf("http");
                href = href.substr(httpIndex, href.toLowerCase().indexOf(".gif") + 4 - httpIndex);
                console.log(href);
                link = href;
            }
            else if (com.find(".UFICommentContent img").length) { // image
                var img = com.find(".UFICommentContent img");
                if (!img.length)
                    continue;
                link = img[0].src;
                console.log(img);

            }
            else
                continue;

            console.log("Add comment");
            var but = com.find(".UFIReplyLink");
            but.parent().append(jQuery('<a/>', {
                'class': "myURL_comment",
                'href': link,
                'target': "_blank",
                'download': ''}).append("Download")[0]);
            console.log("Add comment OK");
        }
    }

    function addAll(){
        addButtonInTheater();
        addButtonInFeed();
        addButtonInComment();
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