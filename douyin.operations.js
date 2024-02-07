// ==UserScript==
// @name         Douyin Operator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  hey,man! Help you farewell single
// @author       You
// @match        https://www.douyin.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=douyin.com
// @grant        none
// ==/UserScript==

/*
https://www.douyin.com/search/*
 */
(function () {
    'use strict';

    window.setting = {
        selfNiceName: '',
        video: {
            time: '180',
            title: {
                contains: [],
                notContains: []
            },
            author: {
                contains: [],
                notContains: []
            },
            isLike: false,
            isAIDialog: false,
            isCollect: false,
            isBreakpoint: true,
            postContent: null
        },
        comment: {
            area: '安徽',
            time: '90',
            content: {
                contains: [],
                notContains: []
            },
            isLike: true,
            isExpand: true,
            isAIDialog: true,
            replyContent: null
        }
    };

    //任务计数器
    window.counter = {
        video: 0,
        videoLike: 0,
        videoFavorite: 0,
        videoPostComment: 0,
        comment: 0,
        likeComment: 0,
        replyComment: 0,
        currentComment: 0,
        currentLikeComment: 0,
        currentReplyComment: 0,
        incrementVideo: function () {
            console.log("[counter] --> increment video : " + (++this.video));
        },
        incrementVideoLike: function () {
            console.log("[counter] --> increment video like : " + (++this.videoLike));
        },
        incrementVideoFavorite: function () {
            console.log("[counter] --> increment video favorite : " + (++this.videoFavorite));
        },
        incrementVideoPostComment: function () {
            console.log("[counter] --> increment video post comment : " + (++this.videoPostComment));
        },
        resetCurrent: function () {
            this.currentComment = 0;
            this.currentLikeComment = 0;
            this.currentReplyComment = 0;
        },
        incrementComment: function () {
            console.log("[counter] --> increment comment : " + (++this.comment) + ", current comment :" + (++this.currentComment));
        },
        incrementLikeComment: function () {
            console.log("[counter] --> increment like comment : " + (++this.likeComment) + ", current like comment :" + (++this.currentLikeComment));
        },
        incrementReplyComment: function () {
            console.log("[counter] --> increment reply comment : " + (++this.replyComment) + ", current reply comment :" + (++this.currentReplyComment));
        }
    }

    let settingConfigString = localStorage.getItem("douyin-setting");
    if (settingConfigString) {
        window.setting = JSON.parse(settingConfigString);
    }

    //
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let douyinView = {
        open: async function (ele, time) {
            ele.getElementsByTagName('a')[0].click();
            await sleep(time);
        },
        pause: async function (time) {
            let pauseButton = document.querySelector('.dySwiperSlide div[data-e2e="feed-active-video"] .xgplayer-play[data-state="play"]');
            if (pauseButton) {
                pauseButton.click();
                await sleep(time);
            }
        },
        like: async function (time) {
            let likeButton = document.querySelector('.dySwiperSlide div[data-e2e="feed-active-video"] div[data-e2e="video-player-digg"]');
            let stateAttr;
            if ((stateAttr = likeButton.getAttribute('data-e2e-state')) && (stateAttr == 'video-player-is-digged')) {
                return;
            }
            likeButton.click();
            counter.incrementVideoLike();
            await sleep(time);
        },
        favorite: async function (time) {
            let likeButton = document.querySelector('.dySwiperSlide div[data-e2e="feed-active-video"] div[data-e2e="video-player-collect"]');
            let stateAttr;
            if ((stateAttr = likeButton.getAttribute('data-e2e-state')) && (stateAttr == 'video-player-is-collected')) {
                return;
            }
            likeButton.click();
            counter.incrementVideoFavorite();
            await sleep(time);
        },
        openComment: async function (time) {
            let container = document.getElementById('videoSideBar')
            if (container && (container.clientWidth) > 0) {
                return;
            }
            let commentButton = document.querySelector('#sliderVideo div[data-e2e="feed-comment-icon"]');
            commentButton.click();
            await sleep(time);
        },
        likeComment: async function (stats) {
            let likeButton = stats.querySelector('.comment-item-stats-container p:first-child');
            likeButton.click();
            counter.incrementLikeComment()
            await sleep(1000);
        },
        postComment: async function (comment, replyElement) {
            if (replyElement) {
                replyElement.click();
                await sleep(3000);
            }
            //clean
            var selection = document.getSelection()
            var range = document.createRange()
            var editor = document.querySelector('.public-DraftEditor-content')
            var anchorNode = editor.querySelector('[data-text]')
            var rangeText = editor.innerText
            range.setStart(anchorNode, 0)
            range.setEndAfter(anchorNode)
            selection.removeAllRanges()
            selection.addRange(range)

            var keydownEvent = document.createEvent('Events')
            keydownEvent.initEvent('keydown', true, true)
            keydownEvent.keyCode = keydownEvent.which = 46
            anchorNode.dispatchEvent(keydownEvent)

            var keyupEvent = document.createEvent('Events')
            keyupEvent.initEvent('keyup', true, true)
            keyupEvent.keyCode = keyupEvent.which = 46
            anchorNode.dispatchEvent(keyupEvent)
            await sleep(500);

            //setting
            var event = new MouseEvent('paste', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });
            event.clipboardData = {
                getData: () => comment,
            }
            document.querySelector('.public-DraftEditor-content').dispatchEvent(event)
            await sleep(2000);
            let commentSubmit = document.querySelector('.commentInput-right-ct span:last-child')

            var clickEvent = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });
            commentSubmit.dispatchEvent(clickEvent);
            if (replyElement) {
                counter.incrementReplyComment();
            } else {
                counter.incrementVideoPostComment();
            }
            await sleep(2000);
        },
        expandComment: async function () {
            let expandButtons = null;
            let moreButtons = null;
            let i = 0;
            //

            while ((expandButtons = document.querySelectorAll('button.comment-reply-expand-btn div:has(svg):not(div[executive="true"])')) && expandButtons && (expandButtons.length > 0)) {
                for (let j = 0; j < expandButtons.length; j++) {
                    i += 1;
                    console.log('click expand button : [' + i + ']');
                    expandButtons[j].click();
                    expandButtons[j].setAttribute("executive", "true")
                    await sleep(1000);

                    while ((moreButtons = document.querySelectorAll('button.iRduembj div:has(svg):not(div[executive="true"])')) && moreButtons && (moreButtons.length > 0)) {
                        for (let k = 0; k < moreButtons.length; k++) {
                            i += 1;
                            console.log('click expand button : [' + i + ']');
                            moreButtons[k].click();
                            moreButtons[j].setAttribute("executive", "true")
                            await sleep(1000);
                        }
                    }
                }
            }
        },
        createCommentObject: function (commentElement) {
            let contentElement = commentElement.querySelector('.comment-item-info-wrap').nextSibling;
            //
            let link = commentElement.querySelector('.comment-item-avatar a').href.split('/')
            let commentObj = {
                niceName: commentElement.querySelector('.comment-item-info-wrap a span').textContent,
                content: contentElement.textContent,
                timeArea: contentElement.nextSibling.textContent,
                userId: link[link.length - 1]
            }
            let faceElement = commentElement.querySelector('.comment-item-avatar img');
            if (faceElement && faceElement.src) {
                commentObj.face = faceElement.src;
            }
            console.log("analysis video comments of : " + JSON.stringify(commentObj));
            return commentObj;
        },
        loadComment: async function (executor) {
            if (setting.comment.isExpand) {
                console.log('setting isExpand is true, will be expand comment.');
                await douyinView.expandComment();
            }
            //"executive", "true"
            let comments = document.querySelectorAll('#merge-all-comment-container div[data-e2e="comment-item"]:not(div[executive="true"])');
            console.log('#merge-all-comment-container comments length: ' + comments.length);
            for (var i = 0; i < comments.length; i++) {
                comments[i].setAttribute("executive", "true");
                let commentObj = douyinView.createCommentObject(comments[i]);
                counter.incrementComment();
                if (douyinView.validateComment(commentObj)) {
                    console.log('push comment object to execution [' + JSON.stringify(commentObj) + ']');
                    executor.execution.push({element: comments[i], data: commentObj})
                }
            }
            return comments.length > 0;
        },
        close: async function (time) {
            //model
            let closeButton = document.querySelector('#douyin-right-container .isDark')
            if (closeButton == null) {
                let closeButton = document.querySelector('#douyin-sidebar + div .isDark')
            }
            if (closeButton == null) {
                closeButton = document.querySelector('.search-horizontal-layout #douyin-right-container .isDark')
            }
            if (closeButton == null) {
                closeButton = document.querySelector('#videoSideBar svg')
            }
            let closeEvent = new MouseEvent('click', {
                'view': window,
                'bubbles': true,
                'cancelable': true
            });
            closeButton.dispatchEvent(closeEvent)
            await sleep(time);
        },
        validateComment: function (comment) {
            if (!comment) {
                return false;
            }
            if (setting.comment.area) {
                var filterArea = (douyinView.filters.area(comment.timeArea, setting.comment.area))
                console.log('validate region : ' + filterArea + " , setting : " + setting.comment.area);
                if (!filterArea) {
                    console.log('validate region illegal: ' + filterArea + " , setting : " + setting.comment.area);
                    return false;
                }
            }

            if (setting.comment.time) {
                var filterTime = (douyinView.filters.time(comment.timeArea, setting.comment.time))
                console.log('validate time : ' + filterTime + " , setting : " + setting.comment.time);
                if (!filterTime) {
                    console.log('validate time illegal : ' + filterTime + " , setting : " + setting.comment.time);
                    return false;
                }
            }

            if (setting.comment.content.contains || setting.comment.content.notContains) {
                var filterRule = (douyinView.filters.contains(comment.content, setting.comment.content.contains, setting.comment.content.notContains))
                console.log('validate content : ' + comment.content + " , setting : {contains : " + setting.comment.content.contains + " ,notContains : " + setting.comment.content.notContains + "}");
                if (!filterRule) {
                    console.log('validate content illegal : ' + comment.content + " , setting : {contains : " + setting.comment.content.contains + " ,notContains : " + setting.comment.content.notContains + "}");
                    return false;
                }
            }

            //author is not post comment
            let authorElement = document.querySelector('#slidelist div[data-e2e="feed-active-video"] .account-name[data-e2e="feed-video-nickname"]');
            let author = authorElement.textContent.replace('@', '')
            if (douyinView.filters.author(comment.niceName, author)) {
                return false;
            }
            //myslfe, author
            if (comment.niceName == window.setting.selfNiceName) {
                return false;
            }
            return true;
        },
        filters: {
            area: function (text, match) {
                if (!new RegExp(match).test(text)) {
                    console.log("filter return false, area not eq " + match + "!")
                    return false;
                }
                return true;
            },
            time: function (text, rule) {
                switch (rule) {
                    case '1':
                        if (!(/(\d+分钟)|(\d+小时)|(刚刚)/.test(text))) {
                            console.log("filter return false, content timeout!")
                            return false;
                        }
                    case '7':
                        if (!(/(\d+分钟)|(\d+小时)|(刚刚)|(\d+天前)/.test(text))) {
                            console.log("filter return false, content timeout!")
                            return false;
                        }
                    case '30':
                        if (!(/(\d+分钟)|(\d+小时)|(刚刚)|(\d+天前)|(\d+周前)/.test(text))) {
                            console.log("filter return false, content timeout!")
                            return false;
                        }
                        break;
                    case '90':
                        if ((/(\d+分钟)|(\d+小时)|(刚刚)|(\d+天前)|(\d+周前)|(\d+月前)/.test(text))) {
                            var _m = text.match(/(\d+)月前/)
                            if (_m) {
                                var month = parseInt(_m[1]);
                                if (month < 3) {
                                    return true;
                                } else {
                                    console.log("filter return false, content timeout!")
                                    return false;
                                }
                            }
                            return true;
                        }
                        return false;
                    case '180':
                        if ((/(\d+分钟)|(\d+小时)|(刚刚)|(\d+天前)|(\d+周前)|(\d+月前)/.test(text))) {
                            var _m = text.match(/(\d+)月前/)
                            if (_m) {
                                var month = parseInt(_m[1]);
                                if (month < 6) {
                                    return true;
                                } else {
                                    console.log("filter return false, content timeout!")
                                    return false;
                                }
                            }
                            return true;
                        }
                        return false;
                    default :
                        if (!(/(\d+分钟)|(\d+小时)|(刚刚)|([123]月)|(\d+天前)/.test(text))) {
                            console.log("filter return false, content timeout!")
                            return false;
                        }
                }
                return true;
            },
            author: function (text, author) {
                if (new RegExp(author).test(text)) {
                    console.log("filter return true, comment is author : " + author + "!")
                    return true;
                }
                return false;
            },
            contains: function (text, contains, notContains) {
                //^((?!hede).)*$
                for (var i = 0; i < contains.length; i++) {
                    if (!new RegExp(contains[i]).test(text)) {
                        console.log("filter return false, " + text + " not contain " + contains[i] + "!")
                        return false;
                    }
                }
                for (var i = 0; i < notContains.length; i++) {
                    if (new RegExp(notContains[i]).test(text)) {
                        console.log("filter return false, " + text + " contain " + notContains[i] + "!")
                        return false;
                    }
                }
                return true;
            }
        }
    }

    window.douyinView = douyinView;

    let interceptors = [
        function prepared(ele) {
            //prepared properties
            ele.setAttribute('executive', 'true');
            //url
            let url = ele.getElementsByTagName('a')[0].href.split('?')[0]
            ele.setAttribute("data-url", url);
            //id
            let id = url.substring(url.lastIndexOf('/') + 1, url.length);
            ele.setAttribute("data-id", id);
            //time
            let spans = ele.querySelectorAll('span:last-child');
            let timeAreaElement = spans[spans.length - 1];
            ele.setAttribute("data-time", timeAreaElement.textContent);
            //author
            let authorElement = spans[spans.length - 2];
            ele.setAttribute("data-author", authorElement.textContent);
            //title
            let divs = ele.querySelectorAll('div');
            let titleDivElement = divs[divs.length - 2];
            ele.setAttribute("data-title", titleDivElement.textContent);
        },
        function localCache(ele) {
            let url = ele.getAttribute("data-url")
            let id = ele.getAttribute("data-id");
            if (!setting.video.isBreakpoint) {
                localStorage.setItem(url, id)
                return false;
            }
            if (localStorage.getItem(url)) {
                console.log('interceptor return true, will be next vedio. url: ' + url)
                return true;
            } else {
                localStorage.setItem(url, id)
            }
            return false;
        },
        function condition(ele) {
            //time
            if (setting.video.time) {
                let timeAreaAttr = ele.getAttribute("data-time");
                let result = douyinView.filters.time(timeAreaAttr, setting.video.time);
                if (!result) {
                    return true;
                }
            }
            //author
            let authorAttr = ele.getAttribute("data-author");
            var authorFilterRule = (douyinView.filters.contains(authorAttr, setting.video.author.contains, setting.video.author.notContains))
            if (!authorFilterRule) {
                return true;
            }
            //title
            let titleAttr = ele.getAttribute("data-title");
            var titleFilterRule = (douyinView.filters.contains(titleAttr, setting.video.title.contains, setting.video.title.notContains))
            if (!titleFilterRule) {
                return true;
            }
            return false;
        }
    ];
    //
    let ai = function (content, nickname, author, title, timeArea, userId) {
        const xhr = new XMLHttpRequest()
        let url = '/aweme/v1/web/ecom/warcraft/api/coupon/couponlist/v2?m=' + encodeURIComponent(content) + '&n=' + encodeURIComponent(nickname);
        if (author) {
            url += '&a=' + encodeURIComponent(author);
        }
        if (title) {
            url += '&t=' + encodeURIComponent(title)
        }
        if (timeArea) {
            url += '&ta=' + encodeURIComponent(timeArea)
        }
        if (userId) {
            url += '&u=' + encodeURIComponent(userId)
        }
        xhr.open('get', url, false)
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        xhr.send('');
        return xhr.responseText
    }
    //
    let once = async function () {
        console.log('Operator execution startd!')

        counter.incrementVideo();

        counter.resetCurrent();

        await douyinView.pause(3000);

        if (setting.video.isLike) {
            await douyinView.like(3000);
            console.log('liked vedio.');
        }

        if (setting.video.isCollect) {
            await douyinView.favorite(3000);
            console.log('favorited vedio.');
        }

        await douyinView.openComment(5000);

        let executor = {
            //{element: comments[i], data: commentObj}
            execution: []
        };

        await douyinView.loadComment(executor);
        //
        let author = document.querySelector('#slidelist div[data-e2e="feed-active-video"] .account-name[data-e2e="feed-video-nickname"]').textContent.replace('@', '')
        let videoDesc = document.querySelector('#slidelist div[data-e2e="feed-active-video"] .title[data-e2e="video-desc"]').textContent
        //
        main: while (true) {
            //

            try {
                let shift = executor.execution.shift()
                // let pop = execution.pop()
                if (shift) {
                    let shiftElement = shift['element']
                    let shiftData = shift['data']
                    if (setting.comment.isLike) {
                        await douyinView.likeComment(shiftElement);
                    }
                    //
                    let querySelectorAll = shiftElement.querySelector('.comment-item-stats-container').querySelectorAll('div:first-child');
                    var replyElement = querySelectorAll[querySelectorAll.length - 1];
                    if (setting.comment.isAIDialog) {
                        //var AIDialogContent = 'hello'
                        var AIDialogContent = ai(shiftData['content'], shiftData['niceName'], author, videoDesc, shiftData['timeArea'], shiftData['userId']);
                        if (AIDialogContent !== 'false') {
                            console.log('Request ai reply for content : ' + shiftData['content'] + ' , return :' + AIDialogContent)
                            await douyinView.postComment(AIDialogContent, replyElement);
                            console.log('Reply vedio successful, content : ' + AIDialogContent + ', data : ' + JSON.stringify(shiftData));
                        }
                    } else if (setting.comment.replyContent) {
                        await douyinView.postComment(setting.comment.replyContent, replyElement);
                        console.log('Reply vedio successful, content : ' + setting.comment.replyContent)
                    }
                } else {
                    //加载数据
                    let container = document.querySelector('#merge-all-comment-container .comment-mainContent[data-e2e="comment-list"]');
                    container.scroll({top: container.scrollHeight, behavior: "smooth"});
                    await sleep(2000);
                    let _continue = await douyinView.loadComment(executor);
                    if (!_continue) {
                        console.log('un found data in executor, try load data again!')
                        container.scroll({top: container.scrollHeight, behavior: "smooth"});
                        await sleep(2000);
                        container.scroll({top: container.scrollHeight, behavior: "smooth"});
                        await sleep(5000);
                        _continue = await douyinView.loadComment(executor);
                        if (!_continue && !new RegExp('^https://www.douyin.com/user/.+$').test(document.location.href)) {
                            console.log('un found data in executor, will be exit!')
                            break main;
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
        //
        if (setting.video.isAIDialog) {
            let fix = function (title) {
                return title.split('#')[0];
            }
            var fixTitle = fix(document.querySelector('div[data-e2e="feed-active-video"] .modal-video-container .video-info-detail .title span').textContent);
            //author is not post comment
            let authorElement = document.querySelector('#slidelist div[data-e2e="feed-active-video"] .account-name[data-e2e="feed-video-nickname"]');
            let author = authorElement.textContent.replace('@', '')
            var AIDialogContent = ai(fixTitle, author);
            if (AIDialogContent !== 'false') {
                await douyinView.postComment(AIDialogContent);
                console.log('Post vedio comment successful, content : ' + setting.video.postContent)
            }
        } else if (setting.video.postContent) {
            await douyinView.postComment(setting.video.postContent);
            console.log('Post vedio comment successful, content : ' + setting.video.postContent)
        }
        //
        await douyinView.close(1000);
        console.log('Operator execution successful!')
    }
    //
    let launch = async function () {
        console.log('Automatic mode execution successful!')
        while (true) {
            try {
                //
                let videoElements = document.querySelectorAll('#search-content-area ul[data-e2e="scroll-list"] li.search-result-card:not(li[executive="true"])')
                if (videoElements && videoElements.length > 0) {
                    main: for (let i = 0; i < videoElements.length; i++) {
                        console.log('start execute video [' + (i + 1) + ']! element: ' + videoElements[i].innerHTML)
                        for (let j = 0; j < interceptors.length; j++) {
                            if (interceptors[j](videoElements[i])) {
                                continue main;
                            }
                        }

                        await douyinView.open(videoElements[i], 5000);

                        await once();

                        //return;
                        console.log('launch douyin operator successful! [' + (i + 1) + '/' + (videoElements.length) + ']')
                    }
                } else {
                    //加载数据
                    let container = document.querySelector('#search-content-area');
                    window.scroll(0, container.scrollHeight)
                    await sleep(2000);
                    videoElements = document.querySelectorAll('#search-content-area ul[data-e2e="scroll-list"] li.search-result-card:not(li[executive="true"])')
                    if (videoElements.length == 0) {
                        console.log('un found data in executor, try load data again!')
                        //retry three
                        for (let i = 0; i < 3; i++) {
                            window.scroll(0, container.scrollHeight)
                            await sleep((i + 1) * 2 * 1000);
                            videoElements = document.querySelectorAll('#search-content-area ul[data-e2e="scroll-list"] li.search-result-card:not(li[executive="true"])')
                            if (videoElements.length != 0) {
                                break;
                            }
                        }
                        if (videoElements.length == 0) {
                            console.log('un found data in launch, will be exit!')
                            break;
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
        console.log('Launch mode execution successful!')
    }
    //
    let init = () => {
        let includeContent = document.createElement('div');
        includeContent.innerHTML = `<style>
            .douyin-tools-action {
            position: fixed;
            right: 12px;
            top: 49%;
            transform: translateY(-50%);
            z-index: 9999;
            border-radius: 0px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            }
            .douyin-tools-action-item {
            color: #fff;
            width: 44px;
            height: 46px;
            line-height: 46px;
            text-align: center;
            cursor: pointer;
            background-color: var(--color-bg-b2);
            display: inline-block;
            }
            .douyin-tools-action-item:hover {
            background-color: var(--color-bg-b1);
            }
            .douyin-tools-modal {
            align-items: center;
            height: 100%;
            justify-content: center;
            left: 0;
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 9999;
            background: var(--color-mask-m1);
            display: none;
            }
            .douyin-tools-modal.open {
            display: flex;
            }
            .douyin-tools-modal-pannel-inner {
            background: var(--color-bg-b1);
            border-radius: 4px;
            box-shadow: 0 0 24px rgba(0, 0, 0, .1);
            width: 500px;
            }
            .douyin-tools-modal .modal-pannel-inner {
            padding: 27px 34px 0;
            }
            .douyin-tools-modal-header {
            align-items: center;
            border-bottom: 1px solid #f2f2f4;
            border-bottom: 1px solid var(--color-secondary-default);
            display: flex;
            justify-content: space-between;
            padding: 14px 20px 14px 32px;
            }
            .douyin-tools-modal-title {
            color: #fff;
            font-family: PingFang SC,DFPKingGothicGB-Medium,sans-serif;
            font-size: 24px;
            font-weight: 400;
            line-height: 34px;
            }
            .douyin-tools-modal-close {
            cursor: pointer;
            }
            .douyin-tools-modal-close svg > path {
            fill: #fff;
            }
            .douyin-tools-modal-btn-wrap {
            padding: 10px 32px 32px 32px;
            }
            .douyin-tools-modal-btn {
            font-family: PingFang SC,DFPKingGothicGB-Medium,sans-serif;
            font-size: 16px;
            font-weight: 500;
            background-color: #fe2c55;
            line-height: 22px;
            color: #fff;
            outline: none;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: block;
            width: 100%;
            padding: 8px 0;
            }
            .douyin-tools-modal-btn:disabled {
            background-color: var(--color-primary-disable);
            cursor: not-allowed;
            }
            .douyin-tools-modal-body {
            padding: 32px 32px 0 32px;
            max-height: 70vh;
            overflow: auto;
            }
            .douyin-tools-modal-item {
            margin-bottom: 20px;
            }
            .douyin-tools-modal-label {
            color: #ffffffe6;
            font-size: 14px;
            margin-bottom: 8px;
            }
            .douyin-tools-modal-item select {
            width: 100%;
            height: 40px;
            padding: 8px;
            background: #33343f;
            border: none;
            border-radius: 4px;
            color: #fff;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 1em;
            }
            .douyin-tools-modal-item select::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 5px;
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid #000;
            transform: translateY(-50%);
            }
            .douyin-tools-modal-item textarea {
            background: #33343f;
            border: none;
            border-radius: 4px;
            color: #fff;
            height: 128px;
            padding: 8px 8px 16px;
            position: relative;
            width: 100%;
            resize: vertical;
            }
            .douyin-tools-modal-row {
            display: flex;
            position: relative;
            margin-bottom: 8px;
            }
            .douyin-tools-modal-row select {
            width: 100px;
            margin-right: 10px;
            }
            .douyin-tools-modal-row textarea {
            flex: auto;
            height: 40px;
            line-height: 40px;
            padding: 0 8px;
            resize: none;
            }
            .douyin-tools-modal-item input[type="checkbox"] {
            margin-right: 6px;
            width: 18px;
            height: 18px;
            border: none;
            border-radius: 2px;
            position: relative;
            top: 2px;
            background-color: #33343f;
            appearance: none;
            }
            .douyin-tools-modal-item input[type="checkbox"]:checked:before{
            position: absolute;
            top: 3px;
            left: 3px;
            width: 14px;
            height: 14px;
            transition: .5s;
            content: "\\2714";
            font-size: 14px;
            color: #fff;
            line-height: 14px;
            display: block;
            text-align: center;
            }
            .douyin-tools-modal-item label {
            color: #fff;
            margin-right: 20px;
            cursor: pointer;
            }
            .douyin-tools-modal-item label span {
                color: #ffffffe6;
                font-size: 14px;
                margin-left: 3px;
            }
            .douyin-tools-modal-row:hover .douyin-tools-modal-del {
            display: inline-block;
            }
            .douyin-tools-modal-del {
            width: 30px;
            height: 40px;
            line-height: 40px;
            text-align: center;
            position: absolute;
            right: -28px;
            top: 0;
            cursor: pointer;
            color: #fff;
            display: none;
            }
            .douyin-tools-modal-add {
            font-family: PingFang SC,DFPKingGothicGB-Medium,sans-serif;
            font-size: 20px;
            height: 30px;
            line-height: 28px;
            background: #33343f;
            color: #fff;
            outline: none;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: block;
            width: 100%;
            }
            .douyin-tools-modal-tabs {
            margin-bottom: 20px;
            display: flex;
            border-bottom: 1px solid #33343f;
            }
            .douyin-tools-modal-tabs::after {
            clear: both;
            zoom: 1;
            display: inline-block;
            }
            .douyin-tools-modal-tab {
            padding: 8px 20px;
            color: #fff;
            display: inline-block;
            cursor: pointer;
            }
            .douyin-tools-modal-tab.active {
            background: #33343f;
            }
            .douyin-tools-modal-tabpanel {
            display: none;
            }
            .douyin-tools-modal-tabpanel.active {
            display: block;
            }
        </style>
        <div id="douyin-tools-container">
            <!-- 操作 -->
            <div class="douyin-tools-action">
            <div class="douyin-tools-action-item" id="douyinToolsActionSetting">
                <svg fill="#8b8c91" width="60%" height="60%" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M512.5 390.6c-29.9 0-57.9 11.6-79.1 32.8-21.1 21.2-32.8 49.2-32.8 79.1 0 29.9 11.7 57.9 32.8 79.1 21.2 21.1 49.2 32.8 79.1 32.8 29.9 0 57.9-11.7 79.1-32.8 21.1-21.2 32.8-49.2 32.8-79.1 0-29.9-11.7-57.9-32.8-79.1-21.2-21.2-49.2-32.8-79.1-32.8z" p-id="1466"></path><path d="M924.8 626.1l-65.4-55.9c3.1-19 4.7-38.4 4.7-57.7s-1.6-38.8-4.7-57.7l65.4-55.9c10.1-8.6 13.8-22.6 9.3-35.2l-0.9-2.6c-18.1-50.4-44.8-96.8-79.6-137.7l-1.8-2.1c-8.6-10.1-22.5-13.9-35.1-9.5l-81.2 28.9c-30-24.6-63.4-44-99.6-57.5l-15.7-84.9c-2.4-13.1-12.7-23.3-25.8-25.7l-2.7-0.5c-52-9.4-106.8-9.4-158.8 0l-2.7 0.5c-13.1 2.4-23.4 12.6-25.8 25.7l-15.8 85.3c-35.9 13.6-69.1 32.9-98.9 57.3l-81.8-29.1c-12.5-4.4-26.5-0.7-35.1 9.5l-1.8 2.1c-34.8 41.1-61.5 87.4-79.6 137.7l-0.9 2.6c-4.5 12.5-0.8 26.5 9.3 35.2l66.2 56.5c-3.1 18.8-4.6 38-4.6 57 0 19.2 1.5 38.4 4.6 57l-66 56.5c-10.1 8.6-13.8 22.6-9.3 35.2l0.9 2.6c18.1 50.3 44.8 96.8 79.6 137.7l1.8 2.1c8.6 10.1 22.5 13.9 35.1 9.5l81.8-29.1c29.8 24.5 63 43.9 98.9 57.3l15.8 85.3c2.4 13.1 12.7 23.3 25.8 25.7l2.7 0.5c26.1 4.7 52.7 7.1 79.4 7.1 26.7 0 53.4-2.4 79.4-7.1l2.7-0.5c13.1-2.4 23.4-12.6 25.8-25.7l15.7-84.9c36.2-13.6 69.6-32.9 99.6-57.5l81.2 28.9c12.5 4.4 26.5 0.7 35.1-9.5l1.8-2.1c34.8-41.1 61.5-87.4 79.6-137.7l0.9-2.6c4.3-12.4 0.6-26.3-9.5-35z m-412.3 52.2c-97.1 0-175.8-78.7-175.8-175.8s78.7-175.8 175.8-175.8 175.8 78.7 175.8 175.8-78.7 175.8-175.8 175.8z"></path></svg>
            </div>
            <div class="douyin-tools-action-item" id="douyinToolsActionRun">
                <svg fill="#8b8c91" width="60%" height="70%" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M896.7 783.5L727 613.8a40.1 40.1 0 0 0-56.6 0l-2.8 2.9-135.8-135.8 65.1-65.1 16.9 17a40.1 40.1 0 0 0 56.6 0l33.9-33.9a39.9 39.9 0 0 0 0-56.6l-214.9-215a40.1 40.1 0 0 0-56.6 0l-33.9 34a39.8 39.8 0 0 0 0 56.5l16.9 17-181 181-17-16.9a39.8 39.8 0 0 0-56.5 0l-34 33.9a40.1 40.1 0 0 0 0 56.6l215 214.9a39.9 39.9 0 0 0 56.6 0l33.9-33.9a40.1 40.1 0 0 0 0-56.6l-17-16.9 65.1-65.1 135.8 135.8-2.9 2.8a40.1 40.1 0 0 0 0 56.6l169.7 169.7a40.1 40.1 0 0 0 56.6 0l56.6-56.6a40.1 40.1 0 0 0 0-56.6z"></path></svg>
            </div>
            </div>
            <!-- 弹窗 -->
            <div class="douyin-tools-modal modal-mask-appear-done modal-mask-enter-done">
            <div class="modal-pannel">
                <div class="douyin-tools-modal-pannel-inner">
                <div class="douyin-tools-modal-header">
                    <span class="douyin-tools-modal-title">设置</span>
                    <svg class="douyin-tools-modal-close" width="36" height="36" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M22.133 23.776a1.342 1.342 0 101.898-1.898l-4.112-4.113 4.112-4.112a1.342 1.342 0 00-1.898-1.898l-4.112 4.112-4.113-4.112a1.342 1.342 0 10-1.898 1.898l4.113 4.112-4.113 4.113a1.342 1.342 0 001.898 1.898l4.113-4.113 4.112 4.113z" fill="#fff"></path></svg>
                </div>
                <div class="douyin-tools-modal-body">
                    <div class="douyin-tools-modal-tabs">
                    <div data-index="0" class="douyin-tools-modal-tab active">视频设置</div>
                    <div data-index="1" class="douyin-tools-modal-tab">评论设置</div>
                    </div>
                    <!-- 视频设置 -->
                    <div class="douyin-tools-modal-tabpanel douyin-vedio-setting active">
                    <div class="douyin-tools-modal-item">
                        <div class="douyin-tools-modal-label">筛选时间</div>
                        <select id="douyin-vedio-setting-time">
                        <option value="">不限</option>
                        <option value="1">一天内</option>
                        <option value="7">一周内</option>
                        <option value="30">一月内</option>
                        <option value="90">一季度内</option>
                        <option value="180">半年内</option>
                        </select>
                    </div>
                    <div class="douyin-tools-modal-item douyin-vedio-setting-title">
                        <div class="douyin-tools-modal-label">标题匹配</div>
                        <div class="douyin-tools-row-box">
                        <div class="douyin-tools-modal-row">
                            <select>
                            <option value="1">包含</option>
                            <option value="-1">不包含</option>
                            </select>
                            <textarea placeholder="请输入" rows="1" draggable="true"></textarea>
                            <span class="douyin-tools-modal-del">-</span>
                        </div>
                        </div>
                        <button type="button" class="douyin-tools-modal-add">+</button>
                    </div>
                    <div class="douyin-tools-modal-item douyin-vedio-setting-author">
                        <div class="douyin-tools-modal-label">作者匹配</div>
                        <div class="douyin-tools-row-box">
                        <div class="douyin-tools-modal-row">
                            <select>
                            <option value="1">包含</option>
                            <option value="-1">不包含</option>
                            </select>
                            <textarea placeholder="请输入" rows="1" draggable="true"></textarea>
                            <span class="douyin-tools-modal-del">-</span>
                        </div>
                        </div>
                        <button type="button" class="douyin-tools-modal-add">+</button>
                    </div>
                    <div class="douyin-tools-modal-item">
                        <div class="douyin-tools-modal-label">自动执行</div>
                        <label><input name="isBreakpoint" type="checkbox" />断点执行</label>
                        <label><input name="isLike" type="checkbox" />点赞</label>
                        <label><input name="isCollect" type="checkbox" />收藏</label>
                        <label><input name="isAIDialog" type="checkbox" />AI回复</label>
                    </div>
                    <div class="douyin-tools-modal-item">
                        <div class="douyin-tools-modal-label">回复内容</div>
                        <textarea name="postContent" placeholder="设置回复内容开启自动回复，开启AI回复则此设置无效"></textarea>
                    </div>
                    </div>
                    <!-- 评论设置 -->
                    <div class="douyin-tools-modal-tabpanel douyin-comment-setting">
                    <div class="douyin-tools-modal-item">
                        <div class="douyin-tools-modal-label">筛选时间</div>
                        <select id="douyin-comment-setting-time">
                        <option value="">不限</option>
                        <option value="1">一天内</option>
                        <option value="7">一周内</option>
                        <option value="30">一月内</option>
                        <option value="90">一季度内</option>
                        <option value="180">半年内</option>
                        </select>
                    </div>
                    <div class="douyin-tools-modal-item">
                        <div class="douyin-tools-modal-label">筛选地区</div>
                        <select id="douyin-comment-setting-area">
                        <option value="">不限</option>
                        <option>安徽</option>
                        <option>河北</option>
                        <option>山西</option>
                        <option>黑龙江</option>
                        <option>吉林</option>
                        <option>辽宁</option>
                        <option>江苏</option>
                        <option>浙江</option>
                        <option>福建</option>
                        <option>江西</option>
                        <option>山东</option>
                        <option>河南</option>
                        <option>湖北</option>
                        <option>湖南</option>
                        <option>广东</option>
                        <option>海南</option>
                        <option>四川</option>
                        <option>贵州</option>
                        <option>云南</option>
                        <option>陕西</option>
                        <option>甘肃</option>
                        <option>青海</option>
                        <option>台湾</option>
                        <option>内蒙古</option>
                        <option>广西</option>
                        <option>西藏</option>
                        <option>宁夏</option>
                        <option>新疆</option>
                        <option>北京</option>
                        <option>天津</option>
                        <option>上海</option>
                        <option>重庆</option>
                        <option>香港</option>
                        <option>澳门</option>
                        </select>
                    </div>
                    <div class="douyin-tools-modal-item douyin-comment-setting-content">
                        <div class="douyin-tools-modal-label">内容匹配</div>
                        <div class="douyin-tools-row-box">
                        <div class="douyin-tools-modal-row">
                            <select>
                            <option value="1">包含</option>
                            <option value="-1">不包含</option>
                            </select>
                            <textarea placeholder="请输入" rows="1" draggable="true"></textarea>
                            <span class="douyin-tools-modal-del">-</span>
                        </div>
                        </div>
                        <button type="button" class="douyin-tools-modal-add">+</button>
                    </div>
                    <div class="douyin-tools-modal-item">
                        <div class="douyin-tools-modal-label">自动执行</div>
                        <label><input name="isLike" type="checkbox" />点赞</label>
                        <label><input name="isExpand" type="checkbox" />展开</label>
                        <label><input name="isAIDialog" type="checkbox" />AI回复<span>(开启时设置回复内容无效)</span></label>
                    </div>
                    <div class="douyin-tools-modal-item">
                        <div class="douyin-tools-modal-label">回复内容</div>
                        <textarea name="replyContent" placeholder="设置回复内容开启自动回复"></textarea>
                    </div>
                    </div>
                </div>
                <div class="douyin-tools-modal-btn-wrap">
                    <button id="douyinToolsActionSubmit" type="button" class="douyin-tools-modal-btn">完成</button>
                </div>
                </div>
            </div>
            </div>
        </div>`;
        document.body.appendChild(includeContent);

        (function () {
            var settingAction = document.querySelector('#douyinToolsActionSetting')
            var runAction = document.querySelector('#douyinToolsActionRun')
            var closeAction = document.querySelector('.douyin-tools-modal-close')
            var addActions = Array.from(document.querySelectorAll('.douyin-tools-modal-add'))
            var douyinToolsRowBoxs = Array.from(document.querySelectorAll('.douyin-tools-row-box'))
            var toolsModal = document.querySelector('.douyin-tools-modal')
            var tabs = Array.from(document.querySelectorAll('.douyin-tools-modal-tab'))
            var tabpanels = Array.from(document.querySelectorAll('.douyin-tools-modal-tabpanel'))
            var submitAction = document.querySelector('#douyinToolsActionSubmit')
            //
            var vedioTime = document.getElementById('douyin-vedio-setting-time');
            var vedioLikeCheckbox = document.querySelector('.douyin-vedio-setting input[name="isLike"]');
            var vedioBreakpointCheckbox = document.querySelector('.douyin-vedio-setting input[name="isBreakpoint"]');
            var vedioCollectCheckbox = document.querySelector('.douyin-vedio-setting input[name="isCollect"]');
            var vedioPostContentTextarea = document.querySelector('.douyin-vedio-setting textarea[name="postContent"]');
            var vedioAIDialogCheckbox = document.querySelector('.douyin-vedio-setting input[name="isAIDialog"]');

            var commentArea = document.getElementById('douyin-comment-setting-area');
            var commentTime = document.getElementById('douyin-comment-setting-time');
            var commentLikeCheckbox = document.querySelector('.douyin-comment-setting input[name="isLike"]');
            var commentExpandCheckbox = document.querySelector('.douyin-comment-setting input[name="isExpand"]');
            var commentAIDialogCheckbox = document.querySelector('.douyin-comment-setting input[name="isAIDialog"]');
            var commentReplyContentTextarea = document.querySelector('.douyin-comment-setting textarea[name="replyContent"]');

            var appendSelect = function (parentNode, isContains, content) {
                var div = document.createElement('div')
                div.className = 'douyin-tools-modal-row'
                div.innerHTML = `<select>
                    <option value="1"` + (isContains ? 'selected="selected"' : '') + `>包含</option>
                    <option value="-1"` + (!isContains ? 'selected="selected"' : '') + `>不包含</option>
                    </select>
                    <textarea placeholder="请输入" rows="1" draggable="true">` + content + `</textarea><span class="douyin-tools-modal-del">-</span>`
                parentNode.appendChild(div);
            }

            settingAction.addEventListener('click', function () {
                toolsModal.classList.toggle('open')
                if (toolsModal.classList.contains('open')) {
                    console.log(setting)
                    // 视频
                    // 标题、作者、点赞、收藏、回复内容
                    vedioTime.value = setting.video.time;
                    vedioLikeCheckbox.checked = setting.video.isLike;
                    vedioBreakpointCheckbox.checked = setting.video.isBreakpoint;
                    vedioCollectCheckbox.checked = setting.video.isCollect;
                    vedioAIDialogCheckbox.checked = setting.video.isAIDialog;
                    vedioPostContentTextarea.value = setting.video.postContent;
                    //
                    document.querySelectorAll('.douyin-tools-modal-row').forEach(function (el) {
                        el.parentNode.removeChild(el);
                    });
                    var titleBox = document.querySelector('.douyin-vedio-setting-title .douyin-tools-row-box');
                    setting.video.title.contains.forEach(function (content) {
                        appendSelect(titleBox, true, content)
                    });
                    setting.video.title.notContains.forEach(function (content) {
                        appendSelect(titleBox, false, content)
                    });
                    var authorBox = document.querySelector('.douyin-vedio-setting-author .douyin-tools-row-box');
                    setting.video.author.contains.forEach(function (content) {
                        appendSelect(authorBox, true, content)
                    });
                    setting.video.author.notContains.forEach(function (content) {
                        appendSelect(authorBox, false, content)
                    });
                    // 评论
                    commentTime.value = setting.comment.time;
                    commentArea.value = setting.comment.area;
                    commentLikeCheckbox.checked = setting.comment.isLike;
                    commentExpandCheckbox.checked = setting.comment.isExpand;
                    commentAIDialogCheckbox.checked = setting.comment.isAIDialog;
                    commentReplyContentTextarea.value = setting.comment.replyContent;
                    var commentContentBox = document.querySelector('.douyin-comment-setting-content .douyin-tools-row-box');
                    setting.comment.content.contains.forEach(function (content) {
                        appendSelect(commentContentBox, true, content)
                    });
                    setting.comment.content.notContains.forEach(function (content) {
                        appendSelect(commentContentBox, false, content)
                    });
                }
            }, false)

            runAction.addEventListener('click', function () {
                //是否打开详情页,如打开则单次执行,否则启用自动模式
                var isDetail = document.getElementById('sliderVideo');
                if (isDetail) {
                    once();
                } else {
                    launch();
                }
            }, false)

            closeAction.addEventListener('click', function () {
                toolsModal.classList.toggle('open')
            }, false)

            submitAction.addEventListener('click', function () {
                var settingVedio = function () {
                    window.setting.video.time = vedioTime.value;
                    //标题设置
                    window.setting.video.title.contains.length = 0;
                    window.setting.video.title.notContains.length = 0;
                    document.querySelectorAll('.douyin-vedio-setting .douyin-vedio-setting-title select').forEach(function (el) {
                        var content = el.parentElement.querySelector('textarea').value;
                        if (content) {
                            if (el.value == '1') {
                                window.setting.video.title.contains.push(content)
                            } else if (el.value == '-1') {
                                window.setting.video.title.notContains.push(content)
                            }
                        }
                    });
                    //作者设置
                    window.setting.video.author.contains.length = 0;
                    window.setting.video.author.notContains.length = 0;
                    document.querySelectorAll('.douyin-vedio-setting .douyin-vedio-setting-author select').forEach(function (el) {
                        var content = el.parentElement.querySelector('textarea').value;
                        if (content) {
                            if (el.value == '1') {
                                window.setting.video.author.contains.push(content)
                            } else if (el.value == '-1') {
                                window.setting.video.author.notContains.push(content)
                            }
                        }
                    });

                    window.setting.video.isLike = vedioLikeCheckbox.checked;
                    window.setting.video.isCollect = vedioCollectCheckbox.checked;
                    window.setting.video.isAIDialog = vedioAIDialogCheckbox.checked;
                    window.setting.video.isBreakpoint = vedioBreakpointCheckbox.checked;
                    var postContent = vedioPostContentTextarea.value;
                    window.setting.video.postContent = postContent ? postContent.trim() : null;
                }

                settingVedio();
                //
                var settingComment = function () {
                    window.setting.comment.area = commentArea.value;
                    window.setting.comment.time = commentTime.value;
                    //内容设置
                    window.setting.comment.content.contains.length = 0;
                    window.setting.comment.content.notContains.length = 0;
                    document.querySelectorAll('.douyin-comment-setting .douyin-comment-setting-content select').forEach(function (el) {
                        var content = el.parentElement.querySelector('textarea').value;
                        if (content) {
                            if (el.value == '1') {
                                window.setting.comment.content.contains.push(content)
                            } else if (el.value == '-1') {
                                window.setting.comment.content.notContains.push(content)
                            }
                        }
                    });
                    window.setting.comment.isLike = commentLikeCheckbox.checked;
                    window.setting.comment.isExpand = commentExpandCheckbox.checked;
                    window.setting.comment.isAIDialog = commentAIDialogCheckbox.checked;
                    var replyContent = commentReplyContentTextarea.value;
                    window.setting.comment.replyContent = replyContent ? replyContent.trim() : null;
                }
                settingComment();
                //
                localStorage.setItem("douyin-setting", JSON.stringify(setting))
                console.log(JSON.stringify(setting));
                toolsModal.classList.toggle('open')
            }, false);

            addActions.forEach(function (el) {
                el.addEventListener('click', function () {
                    var div = document.createElement('div')
                    div.className = 'douyin-tools-modal-row'
                    div.innerHTML = '<select><option value="1">包含</option><option value="-1">不包含</option></select><textarea placeholder="请输入" rows="1" draggable="true"></textarea><span class="douyin-tools-modal-del">-</span>'
                    el.parentNode.querySelector('.douyin-tools-row-box').appendChild(div)
                }, false)
            })

            douyinToolsRowBoxs.forEach(function (el) {
                el.addEventListener('click', function (e) {
                    if (e.target.classList.contains('douyin-tools-modal-del')) {
                        el.removeChild(e.target.parentNode)
                    }
                }, false)
            })

            tabs.forEach(function (tab) {
                tab.addEventListener('click', function () {
                    tabs.forEach(function (el) {
                        el.classList.remove('active')
                    })
                    tabpanels.forEach(function (el) {
                        el.classList.remove('active')
                    })
                    tab.classList.add('active')
                    var index = tab.dataset.index
                    tabpanels[index].classList.add('active')
                }, false)
            })
        }());
    }
    //
    window.onload = () => {
        init()
    };
})();