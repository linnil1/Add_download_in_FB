// ==UserScript==
// @name         Add Download In Facebook
// @namespace    http://tampermonkey.net/
// @version      0.10.0
// @description  Add Download buttom in Facebook
// @author       linnil1
// @supportURL   None
// @include      http://facebook.com/*
// @include      http://*.facebook.com/*
// @include      https://facebook.com/*
// @include      https://*.facebook.com/*
// @run-at       document-idle
// @grant        none
// @noframes
//
// ==/UserScript==
// thanks        https://greasyfork.org/en/scripts/24295-facebook-video-downloader


(function() {
    'use strict';
    function mylog(unit, status, text="") {
        console.log("[myAdd]", unit, status, text);
    }

    function newLink (url, className, text) {
        var a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('class', className);
        a.setAttribute('target', "_blank");
        if (!/V\d+/g.test(text)) // V0 V1
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
        if (!comment_div)
            return; // unknown error
        comment_div.parentElement.parentElement.parentElement.appendChild(
            newElement(comment_div.parentElement.parentElement).appendChild(
                newElement(comment_div.parentElement).appendChild(
                   want)));
    }

    var videoReg = /\w+\/videos\/\d+/,
        permalinkReg = /\w+\/permalink\/\d+/;

    function addButtonInTheater () {
        // find if in theater mode
        var screen = document.querySelector(".fbPhotoSnowliftContainer");
        if (screen === null) // wait
            return ;
        if (document.location.href.indexOf("theater") === -1)
            return ;
        // how to deal with video
        if (screen.querySelector(".stage video") !== null)
            return;
        // Done
        if (screen.querySelector('.myAdd_theater') !== null)
            return;

        mylog("Theater", "Init");

        // wait click for download hash
        var button = screen.querySelector(".uiButton");
        if (!button.classList.contains("myAdd_download_click")) {
           button.click();
           button.classList.add("myAdd_download_click");
        }
        // wait click for download hash
        else if (screen.querySelector('a[data-action-type="download_photo"]') !== null) {
            var url = screen.querySelector('a[data-action-type="download_photo"]');
            url.classList.add('myAdd_theater');
            toUI(screen, url);
            button.click();
            mylog("Theater", "Link", url);
        }
    }

    function addGIF_general (feed) {
        var hrefNode = feed.querySelector("a[data-lynx-mode='async']");
        if (hrefNode === null)
            return "";
        var href = hrefNode.href;
        if (href.search(".gif") == -1) {
            return "";
        }
        if (href.search("facebook") !== -1) {
            var de_href = decodeURIComponent(href).substr(6); // remove http in the front
            var httpIndex = de_href.indexOf("http");
            href = de_href.substr(httpIndex, de_href.toLowerCase().indexOf(".gif") + 4 - httpIndex);
        }
        return href;
    }

    function addGIF (feedori) {
        var feed = feedori.children[0];
        // the most difference between GIF and video is muted. XDDD
        // pause gif to get link
        var href = addGIF_general(feed);
        if (href === '')
            return false;

        // add to feed
        mylog("GIF", "Link", href);
        toUI(feedori, newLink(href, "myAdd", "GIF"));
        feedori.classList.add("myAdd_OK");
        nowVideo.click(); // unpause
        return true;
    }

    function addImg (feedori) {
        var feed = feedori.children[0];
        if (feed.querySelector('.mtm img') === null) {
            feedori.classList.add("myAdd_OK");
            return ;
        }
        // There may be many image in o feed
        var imgs = feed.querySelectorAll('.mtm div > img');
        for (var i=0; i<imgs.length; ++i) {
            var img = imgs[i];
            mylog("Image", "Data", img);
            // add to feed
            toUI(feedori, newLink(img.src, "myAdd", "I" + i));
            feedori.classList.add("myAdd_OK");
        }
    }

    function addVideo (feed) {
        var links = feed.querySelectorAll("*[href]");
        var ok_links = [], i=0;
        links.forEach( function(link) {
            if (videoReg.test(link.href)) {
                var s = videoReg.exec(link.href)[0];
                if (ok_links.indexOf(s) === -1) {
                    ok_links.push(s);
                    mylog("Video", "Link", link.href);
                    toUI(feed, newLink(link.href, "myAdd", "V" + i));
                    feed.classList.add("myAdd_OK");
                    ++i;
                }
            }
        });
        if (!ok_links.length) {
            // Must have Permalink ?
            mylog("Video", "NotFound", "Use permalink instead");
            links.forEach( function(link) {
                if (permalinkReg.test(link.href)) {
                    var s = permalinkReg.exec(link.href)[0];
                    if (ok_links.indexOf(s) === -1) {
                        ok_links.push(s);
                        mylog("Video", "Link", link.href);
                        toUI(feed, newLink(link.href, "myAdd", "V" + i));
                        feed.classList.add("myAdd_OK");
                        ++i;
                    }
                }
            });
        }
    }

    function addButtonInFeed () {
        var feed_all = document.querySelectorAll(".userContentWrapper");
        feed_all.forEach( function (feedori) {
            if (feedori.classList.contains("myAdd_OK"))
                return ;
            if (feedori.querySelector('.myAdd') !== null)
                return ;
            // remove sub data of content // like 動態回顧
            var feedp = feedori.parentNode;
            while (feedp && feedp.parentNode) { // topest element
                if (feedp.classList.contains("userContentWrapper")) {
                    feedori.classList.add("myAdd_OK");
                    return ;
                }
                feedp = feedp.parentNode;
            }
            mylog("Feed", "Add");

            var feed = feedori.children[0];
            // there may not have video and image together?
            if (feed.querySelector('.mtm video') !== null) {
                if (!addGIF(feedori))
                    addVideo(feedori);
            }
            else if (feed.querySelector('.mtm img') !== null)
                addImg(feedori);
            else
                feedori.classList.add("myAdd_OK");
        });
    }

    // this code is modified from https://greasyfork.org/en/scripts/24295-facebook-video-downloader
    var prefix = 'videoData:[{';
    var suffix = '}],';

    function getFBVideos () {
        var scripts = document.querySelectorAll('script');
        var result = [];

        for (var i = 0; i < scripts.length; ++i) {
            var txt = scripts[i].textContent;
            var pos;
            while ((pos = txt.indexOf(prefix)) !== -1) {
                txt = txt.substr(pos + prefix.length - 1);
                var endPos = txt.indexOf(suffix);

                if (endPos === -1)
                    continue;

                var videoData = txt.substr(0, endPos + 1);
                // result.push(JSON.parse(videoData));
                result.push(eval('(' + videoData +')'));
                txt = txt.substr(endPos);
            }
        }
        return result;
    }

    // this only work when url is "facebook.com/name/videos/videoID" or permalink
    function addDownload() {
        if (!videoReg.test(document.location.href) &&
            !permalinkReg.test(document.location.href))
            return;
        var feeds = document.querySelectorAll("a.comment_link");

        var videosData = getFBVideos();
        for (var i=0; i<videosData.length; ++i) {
            var videoData = videosData[i];
            mylog("video", "Data", videoData);
            var dataurl = videoData.hd_src_no_ratelimit || videoData.hd_src ||
                          videoData.sd_src_no_ratelimit || videoData.sd_src;
            if (!dataurl)
                return;
            feeds.forEach( function(feed) {
                feed = feed.parentElement.parentElement.parentElement;
                if (feed.querySelector(".myAdd_video") !== null)
                    return;
                toUI(feed, newLink(dataurl, "myAdd_video", "Video" + i));
                mylog("video", "OK");
            });
        }
    }

    function addButtonInComment () {
        var coms = document.querySelectorAll(".UFIComment");
        coms.forEach( function(com) {
            if (com.classList.contains("myAdd_comment"))
                return;
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
            else {
                com.classList.add("myAdd_comment");
                return ;
            }

            mylog("comment", "Link", link);
            var but = com.querySelector(".UFIReplyLink");
            but.parentElement.appendChild(newLink(link, "myAdd_comment", "Download"));
        });
    }

    function addAll() {
        addButtonInTheater();
        addButtonInFeed();
        addButtonInComment();
        addDownload();
    }

    // main function
    var mutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    if (mutationObserver) {
        var body = document.querySelector('body');
        if (!body) {
            return;
        }
        var observer = new mutationObserver(addAll);
        observer.observe(body, {
            'childList': true,
            'subtree': true
        });
    }
})();
