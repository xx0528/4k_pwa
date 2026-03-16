const installProgressEl = document.getElementById('installProgress')
const appCompanyEl = document.getElementById('appCompany')
const iconLoadingEl = document.getElementById('iconLoading')
const headerIconEl = document.getElementById('headerIcon')
const apkButtonEl = document.getElementById('countdown')
const installButton = document.getElementById("installButton")
const toChromeButton = document.getElementById('toChromeButton')
const toW2AButton = document.getElementById('toW2AButton')
const paLoadingEl = document.getElementById('paLoading')


function App() {
    this.isLoading = true
    this.isServiceWorkerSupported = function () {//是否支持pwa
        return "serviceWorker" in navigator;
    }
    this.registerServiceWorker = function () {
        if (this.isServiceWorkerSupported()) {
            navigator.serviceWorker.register("service-worker.js")
                .then(function (reg) {
                    console.log("Successfully registered service worker", reg);
                })
                .catch(function (err) {
                    console.log("Error whilst registering service worker", err);
                });
        }else{
            console.log("ServiceWorker not Supported");
        }
    }
    this.isInStandaloneMode = function () {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document
            .referrer.includes('android-app://')
    }
    this.setInstalled = function () {
        var t = `${channel_id}_pwa_install_flag`;
        localStorage.setItem(t, "true"); // 显式存储为字符串"true"
    }
    this.setUnInstalled = function () {
        var t = `${channel_id}_pwa_install_flag`;
        localStorage.setItem(t, false)
    }
    this.isInstalled = function () {
        var t = `${channel_id}_pwa_install_flag`;
        var v = localStorage.getItem(t);
        return v === "true"; // 严格判断为"true"
    }
    this.changeToOpen = function () {
        document.getElementById("rapidDiv").style.display = "none";
        document.getElementById("openDiv").style.display = "block";
    }
    this.changeToInstall = function () {
        document.getElementById("rapidDiv").style.display = "block";
        document.getElementById("openDiv").style.display = "none";
    }
    this.showInstallAni = function () {
        installButton.setAttribute("disabled", true);
        installButton.style.opacity = 0.4
        installProgressEl.style.display = "block";
        appCompanyEl.style.display = "none"
        iconLoadingEl.classList.add('header-icon-loading-show')
        headerIconEl.style.padding = '18px'

        // 隐藏倒计时元素（关键新增代码）
        apkButtonEl.style.display = 'none';

        var d = 0
        // 间隔从120ms改为140ms，100次×140ms=14秒
        var interval = setInterval((() => {
            d += 1
            var e = 10 - Math.floor(10 * d * .01)
            e = e <= 0 ? 0 : e
            if (d >= 100) {
                clearInterval(interval)
                installButton.removeAttribute("disabled");
                installButton.style.opacity = 1
                iconLoadingEl.classList.remove('header-icon-loading-show')
                headerIconEl.style.padding = '0'
                this.changeToOpen()
            } else {
                apkButtonEl.innerHTML = `${e}`
            }
            installProgressEl.innerHTML = `${d}%`
        }), 140) // 核心修改：120→140ms
    }
    this.isChrome = function () {
        if (platform.name.indexOf("Chrome") >= 0) {
            return true;
        }
        return false;
    }
    //是否android浏览器
    this.isAndroidBrowser = function () {
        var userAgent = navigator.userAgent.toLowerCase();
        return /android/.test(userAgent);
    }
    //跳转到google浏览器
    this.toChrome = function () {
        var ul = new URL(location.href);
        var ulS = ul.toString()
        var href = `intent://${ulS.replace(/(https|http):\/\//, "")}`

        var u = href + `#Intent;scheme=https;action=android.intent.action.VIEW;component=com.android.chrome;end`
        // var u = href + `#Intent;scheme=https;action=android.intent.action.VIEW;component=com.android.chrome;package=com.android.chrome;end`
        //var u = href + `#Intent;scheme=https;action=android.intent.action.VIEW;component=com.android.browser;package=com.android.browser;end`
        toChromeButton.href = u
        toChromeButton.click()
    }
    this.recordPwaInstallUser = function (name, ul) {
        console.log(name)
    }
}


var app = new App();
var startD = new Date();
var documentVisibleTime = new Date();
var documentHiddenTime = null;
var isStartToChrome = false;
var startToChromeTime = null;
var startChromeNum = 0;
(function () {
    //开始等待 记录访问日志
    app.isLoading = true;
    app.recordPwaInstallUser("accessInstall")
    var isGetBeforeinstallprompt = false
    paLoadingEl.classList.add('pa-loading-show')
    var intervalLoading = setInterval((() => {
        var endD = new Date()
        var d = Math.abs(endD.getTime() - startD.getTime())
        if (d >= 3000 || isGetBeforeinstallprompt || (d >= 2000 && app.isInstalled())) {
            clearInterval(intervalLoading)
            paLoadingEl.classList.remove('pa-loading-show');
            app.isLoading = false;
        }
    }), 1000)
    let appPromptEvent = null;
    if (app.isInstalled()) {//安装按钮文字变为 "open" 打开
        app.changeToOpen()
    }
    app.registerServiceWorker()
    window.addEventListener('beforeinstallprompt', function (event) {
        event.preventDefault();
        isGetBeforeinstallprompt = true
        appPromptEvent = event;
        app.setUnInstalled()
        app.changeToInstall()
        app.recordPwaInstallUser("beforeInstallPrompt")
        return false;
    });
    //点击事件
    var isHandling = false;
    installButton.addEventListener('click', function () {
        if (app.isLoading) {
            return
        }
        sendClientEventReport(CLIENT_EVENT_TYPE.CLICK_INSTALL_BUTTON, "点击了安装按钮")
        //sendSaveFbData()
        sendSaveShareData()

        // 无论是否在独立模式，只要已安装就直接打开游戏页
        if (app.isInstalled()) {
            sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_OPEN, "安装PWA后，并打开H5");
            console.log('=== install.js: 已安装，直接打开 ===', {
                h5_link,
                standalone: app.isInStandaloneMode(),
                device_code,
                channel_id
            });
            if (app.isInStandaloneMode()) {
                window.location.replace(h5_link);
            } else {
                window.open(h5_link, '_blank');
            }
            return; // 直接返回，避免执行后续逻辑
        }

        if(isIOSOrMac()){//苹果设备
            console.log("=== install.js: 检测到iOS/Mac设备 ===")
            console.log("User Agent:", navigator.userAgent)
            console.log("当前URL:", window.location.href)

            // 跳转到iOS安装引导页面，显示安装步骤图片
            const channelId = new URLSearchParams(window.location.search).get('channel_id') || '10001';
            const deviceCode = new URLSearchParams(window.location.search).get('device_code') || '';
            let targetUrl = `./ios-guide.html?channel_id=${channelId}`;
            if (deviceCode) {
                targetUrl += `&device_code=${encodeURIComponent(deviceCode)}`;
            }
            console.log("准备跳转到ios-guide.html:", targetUrl)

            window.location.href = targetUrl;
            return
        }
        console.log('=== install.js: Android/PC 安装流程 ===', {
            h5_link,
            device_code,
            channel_id,
            isAndroidBrowser: app.isAndroidBrowser(),
            isStandalone: app.isInStandaloneMode(),
            userAgent: navigator.userAgent
        })
        app.recordPwaInstallUser("clickInstallButton")
        if (!isGetBeforeinstallprompt) {//没有安装环境
            console.log("当前没有安装环境")
            // window.location.href = h5_link
            if (startChromeNum < 1) {
                startChromeNum++
                //等待3秒的动画
                app.isLoading = true;
                paLoadingEl.classList.add('pa-loading-show')
                var intervalWait = setInterval((() => {
                    var endD = new Date()
                    var d = Math.abs(endD.getTime() - startD.getTime())
                    if (d >= 3000) {
                        clearInterval(intervalWait)
                        paLoadingEl.classList.remove('pa-loading-show');
                        app.isLoading = false;
                    }
                }), 500)
                //跳转到chrome
                if(app.isAndroidBrowser()){
                    sendClientEventReport(CLIENT_EVENT_TYPE.OPEN_EXTERNAL_BROWSER, "外跳浏览器")
                    app.toChrome()
                }
            }else{
                sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_ERROR, "无法安装PWA，直接打开H5")
                window.location.href = h5_link
            }
        } else {//已打开chrome
            if (!isHandling) {
                isHandling = true;
                paLoadingEl.classList.add('pa-loading-show')
                var intervalInstall = setInterval((() => {
                    var endD = new Date()
                    var d = Math.abs(endD.getTime() - startD.getTime())
                    if (appPromptEvent !== null) {//每一秒检查一次是否得到了PWA安装事件
                        isHandling = false;
                        paLoadingEl.classList.remove('pa-loading-show');
                        clearInterval(intervalInstall);
                        appPromptEvent.prompt();
                        appPromptEvent.userChoice.then(function (result) {
                            if (result.outcome === 'accepted') {
                                sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_ACCEPT, "同意安装PWA")
                                app.recordPwaInstallUser("userAccept")
                                app.setInstalled()
                                app.showInstallAni()
                            } else {
                                sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_CANCEL, "取消安装PWA")
                                app.recordPwaInstallUser("userCancel")
                            }
                            appPromptEvent = null;
                        });
                    } else {
                        if (app.isInstalled()) {//pwa安装完成
                            sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_OPEN, "安装PWA后，并打开H5")
                            isHandling = false;
                            paLoadingEl.classList.remove('pa-loading-show');
                            clearInterval(intervalInstall);
                            if(app.isInStandaloneMode()){
                                //window.location.replace(h5_link);
                                 //let newWindow = window.open(h5_link, '_blank');
                                 //if (!newWindow) {// 新窗口被浏览器拦截，未能成功打开
                                 //    window.location.replace(h5_link);
                                // }
                            }else{
                                //window.location.href = h5_link
 				                window.open(h5_link, '_blank');


                            }
                            return
                        }
                    }
                    if (d >= 12000) {
                        isHandling = false;
                        paLoadingEl.classList.remove('pa-loading-show');
                        clearInterval(intervalInstall);
                    }
                }), 500);
            }
        }
    });
    //华为等手机不支持此方法
    // window.addEventListener('appinstalled', function() {

    // });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            documentVisibleTime = new Date()
        } else if (document.visibilityState === 'hidden') {
            documentHiddenTime = new Date()
        }
    });

})();