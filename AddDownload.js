// ==UserScript==
// @name         Add Download In Facebook
// @namespace    http://tampermonkey.net/
// @version      0.7.1
// @description  Add Download buttom in Facebook
// @author       linnil1
// @supportURL   None
// @include      http://facebook.com/*
// @include      http://*.facebook.com/*
// @include      https://facebook.com/*
// @include      https://*.facebook.com/*
// @run-at       document-idle
// @grant        none
//
// ==/UserScript==
// thanks        https://greasyfork.org/en/scripts/24295-facebook-video-downloader


(function() {
    'use strict';
    function newLink (url, className, text) {
        var a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('class', className);
        a.setAttribute('target', "_blank");
        a.setAttribute('download', "");
        a.innerText = text;
        return a;
    }

    function newElement (oldele) {
        var a = document.createElement(oldele.tagName);
        a.setAttribute('class', oldele.className);
        return a;
    }

    function toUI (target, want) {
        // find comment and copy one with wanted link
        var comment_div = target.querySelector("a.comment_link");
        comment_div.parentElement.parentElement.parentElement.appendChild(
            newElement(comment_div.parentElement.parentElement).appendChild(
                newElement(comment_div.parentElement).appendChild(
                   want)));
    }

    function addButtonInTheater() {
        // find if in theater mode
        if (document.location.href.indexOf("theater") === -1)
            return ;
        var screen = $(".fbPhotoSnowliftContainer");
        if (screen.find(".stage video").length)
            return;

        // Done
        if (screen.find('.myURL_download').length) {
            return;
        }
        console.log("Add theater");

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

    function addGIF_general (feed, nowVideo) {
        if (!nowVideo.classList.contains('myAdd_GIF')) {
            if (feed.querySelector('span > a[rel="nofollow"]') == null)
                nowVideo.click(); // pause to get url
            nowVideo.classList.add('myAdd_GIF');
        }

        // this may be not robost
        var hrefNode = feed.querySelector('span > a[rel="nofollow"]');
        if (hrefNode == null)
            return ;
        var href;
        if (hrefNode.href.search("facebook") != -1)
            href = decodeURIComponent(hrefNode.href).substr(6); // remove http in the front
        else
            href = hrefNode.href;
        var httpIndex = href.indexOf("http");
        href = href.substr(httpIndex, href.toLowerCase().indexOf(".gif") + 4 - httpIndex);
        return href;
    }

    function addGIF (feedori) {
        var feed = feedori.children[0];
        // the most difference between GIF and video is muted. XDDD
        // pause gif to get link
        var nowVideo = feed.querySelector('.mtm video');
        var href  = addGIF_general(feed, nowVideo);

        // add to feed
        console.log(href);
        toUI(feedori, newLink(href, "myAdd", "GIF"));
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

    function addImg (feedori) {
        var feed = feedori.children[0];
        if (feed.querySelector('.mtm img') == null)
            return ;
        // There may be many image in o feed
        var imgs = feed.querySelectorAll('.mtm div > img');
        for (var i=0; i<imgs.length; ++i) {
            var img = imgs[i];
            console.log(img);
            // add to feed
            toUI(feedori, newLink(img.src, "myAdd", "I" + i));
        }
        if (imgs.length)
            console.log("Add Img");
    }

    function addButtonInFeed () {
        var feed_all = document.querySelectorAll(".userContentWrapper");
        feed_all.forEach( function (feed) {
            if (feed.querySelector('.myAdd') != null)
                return ;
            console.log("Add Feed");
            // there may not have video and image together?
            if (feed.querySelector('.mtm video') != null) {
                if (feed.querySelector('.mtm video[muted]') == null)
                    addGIF(feed);
                //else addVideo(feed);
            }
            else {
                addImg(feed);
            }
        });
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

    function addButtonInComment () {
        var coms = document.querySelectorAll(".UFIComment");
        coms.forEach( function(com) {
            if (com.querySelector(".myAdd_comment") != null)
                return;
            var link = "";
            // gif (video may not in comments)
            if (com.querySelector(".UFICommentContent video") != null) {
                var nowVideo = com.querySelector('.UFICommentContent video');
                link = addGIF_general(com, nowVideo);
            }
            // image
            else if (com.querySelector(".UFICommentContent img") != null) {
                var img = com.querySelectorAll(".UFICommentContent img");
                // remove emoji
                for (var j=0; j<img.length; ++j)
                    if(img[j].src.indexOf("emoji.php") === -1) {
                        link = img[j].src;
                        break;
                    }
                if (link === "")
                    return ;
            }
            else
                return ;

            console.log(link);
            var but = com.querySelector(".UFIReplyLink");
            but.parentElement.appendChild(newLink(link, "myAdd_comment", "Download"));
            console.log("Add comment OK");
        });
    }

    function addAll(){
        // addButtonInTheater();
        addButtonInFeed();
        addButtonInComment();
        // addDownload();
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