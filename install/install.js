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
    this.isServiceWorkerSupported = function () {//閺勵垰鎯侀弨顖涘瘮pwa
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
        localStorage.setItem(t, "true"); // 閺勬儳绱＄€涙ê鍋嶆稉鍝勭摟缁楋缚瑕?true"
    }
    this.setUnInstalled = function () {
        var t = `${channel_id}_pwa_install_flag`;
        localStorage.setItem(t, false)
    }
    this.isInstalled = function () {
        var t = `${channel_id}_pwa_install_flag`;
        var v = localStorage.getItem(t);
        return v === "true"; // 娑撱儲鐗搁崚銈嗘焽娑?true"
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

        // 闂呮劘妫岄崐鎺曨吀閺冭泛鍘撶槐鐙呯礄閸忔娊鏁弬鏉款杻娴狅絿鐖滈敍?
        apkButtonEl.style.display = 'none';

        var d = 0
        // 闂傛挳娈ф禒?20ms閺€閫涜礋140ms閿?00濞嗏埗?40ms=14缁?
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
        }), 140) // 閺嶇绺炬穱顔芥暭閿?20閳?40ms
    }
    this.isChrome = function () {
        if (platform.name.indexOf("Chrome") >= 0) {
            return true;
        }
        return false;
    }
    //閺勵垰鎯乤ndroid濞村繗顫嶉崳?
    this.isAndroidBrowser = function () {
        var userAgent = navigator.userAgent.toLowerCase();
        return /android/.test(userAgent);
    }
    //鐠哄疇娴嗛崚鐧祇ogle濞村繗顫嶉崳?
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

    // ??????? PWA???????? H5 ??
    this.openPriorityPWA = async function (targetLink) {
        try {
            if (this.isInStandaloneMode()) {
                window.location.replace(targetLink);
                return;
            }

            let isPWAOpened = false;
            if ('launchQueue' in window) {
                window.launchQueue.setConsumer((launchParams) => {
                    if (launchParams.targetURL === targetLink) {
                        isPWAOpened = true;
                        window.location.href = targetLink;
                    }
                });
            }

            const pwaWindow = window.open(targetLink, '_blank');
            if (!pwaWindow) {
                isPWAOpened = false;
            } else {
                await new Promise(resolve => setTimeout(resolve, 500));
                try {
                    isPWAOpened = typeof pwaWindow.document === 'undefined';
                } catch (e) {
                    isPWAOpened = true;
                }
            }

            if (!isPWAOpened) {
                if (pwaWindow) {
                    pwaWindow.close();
                }
                window.location.replace(targetLink);
                console.log('PWA ?????????? H5 ??');
            }
        } catch (error) {
            console.error('?? PWA ??????? H5?', error);
            window.location.replace(targetLink);
        }
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
    //瀵偓婵鐡戝?鐠佹澘缍嶇拋鍧楁６閺冦儱绻?
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
    if (app.isInstalled()) {//鐎瑰顥婇幐澶愭尦閺傚洤鐡ч崣妯硅礋 "open" 閹垫挸绱?
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
    //閻愮懓鍤禍瀣╂
    var isHandling = false;
    installButton.addEventListener('click', function () {
        if (app.isLoading) {
            return
        }
        sendClientEventReport(CLIENT_EVENT_TYPE.CLICK_INSTALL_BUTTON, "点击了安装按钮")
        //sendSaveFbData()
        sendSaveShareData()

        // 閺冪姾顔戦弰顖氭儊閸︺劎瀚粩瀣佸蹇ョ礉閸欘亣顩﹀鎻掔暔鐟佸懎姘ㄩ惄瀛樺复閹垫挸绱戝〒鍛婂灆妞?
        if (app.isInstalled()) {
            sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_OPEN, "安装PWA后，优先唤起PWA");
            app.openPriorityPWA(h5_link);
            return;
        }

        if(isIOSOrMac()){//閼昏鐏夌拋鎯ь槵
            console.log("=== install.js: 濡偓濞村鍩宨OS/Mac鐠佹儳顦?===")
            console.log("User Agent:", navigator.userAgent)
            console.log("瑜版挸澧燯RL:", window.location.href)

            // 鐠哄疇娴嗛崚鐧稯S鐎瑰顥婂鏇烆嚤妞ょ敻娼伴敍灞炬▔缁€鍝勭暔鐟佸懏顒炴銈呮禈閻?
            const channelId = new URLSearchParams(window.location.search).get('channel_id') || '10001';
            const deviceCode = new URLSearchParams(window.location.search).get('device_code') || '';
            let targetUrl = `./ios-guide.html?channel_id=${channelId}`;
            if (deviceCode) {
                targetUrl += `&device_code=${encodeURIComponent(deviceCode)}`;
            }
            console.log("閸戝棗顦捄瀹犳祮閸掔櫡os-guide.html:", targetUrl)

            window.location.href = targetUrl;
            return
        }
        console.log('=== install.js: Android/PC 鐎瑰顥婂ù浣衡柤 ===', {
            h5_link,
            device_code,
            channel_id,
            isAndroidBrowser: app.isAndroidBrowser(),
            isStandalone: app.isInStandaloneMode(),
            userAgent: navigator.userAgent
        })
        app.recordPwaInstallUser("clickInstallButton")
        if (!isGetBeforeinstallprompt) {//濞屸剝婀佺€瑰顥婇悳顖氼暔
            console.log("瑜版挸澧犲▽鈩冩箒鐎瑰顥婇悳顖氼暔")
            // window.location.href = h5_link
            if (startChromeNum < 1) {
                startChromeNum++
                //缁涘绶?缁夋帞娈戦崝銊ф暰
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
                //鐠哄疇娴嗛崚鐧県rome
                if(app.isAndroidBrowser()){
                    sendClientEventReport(CLIENT_EVENT_TYPE.OPEN_EXTERNAL_BROWSER, "外跳浏览器")
                    app.toChrome()
                }
            }else{
                sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_ERROR, "无法安装PWA，直接打开H5")
                window.location.href = h5_link
            }
        } else {//瀹稿弶澧﹀鈧琧hrome
            if (!isHandling) {
                isHandling = true;
                paLoadingEl.classList.add('pa-loading-show')
                var intervalInstall = setInterval((() => {
                    var endD = new Date()
                    var d = Math.abs(endD.getTime() - startD.getTime())
                    if (appPromptEvent !== null) {//濮ｅ繋绔寸粔鎺擃梾閺屻儰绔村▎鈩冩Ц閸氾箑绶遍崚棰佺啊PWA鐎瑰顥婃禍瀣╂
                        isHandling = false;
                        paLoadingEl.classList.remove('pa-loading-show');
                        clearInterval(intervalInstall);
                        appPromptEvent.prompt();
                        appPromptEvent.userChoice.then(function (result) {
                            if (result.outcome === 'accepted') {
                                sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_ACCEPT, "閸氬本鍓扮€瑰顥奝WA")
                                app.recordPwaInstallUser("userAccept")
                                app.setInstalled()
                                app.showInstallAni()
                            } else {
                                sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_CANCEL, "閸欐牗绉风€瑰顥奝WA")
                                app.recordPwaInstallUser("userCancel")
                            }
                            appPromptEvent = null;
                        });
                    } else {
                        if (app.isInstalled()) {//pwa????
                            sendClientEventReport(CLIENT_EVENT_TYPE.PWA_INSTALL_OPEN, "安装PWA后，优先唤起PWA")
                            isHandling = false;
                            paLoadingEl.classList.remove('pa-loading-show');
                            clearInterval(intervalInstall);
                            app.openPriorityPWA(h5_link);
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
    //閸楀簼璐熺粵澶嬪閺堣桨绗夐弨顖涘瘮濮濄倖鏌熷▔?
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