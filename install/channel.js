// ============================================
// PWA中转页配置（用于域名被封时切换）
// ============================================
// GitHub Pages 域名
// 用户安装PWA时，manifest会指向这个域名
const GITHUB_PWA_DOMAIN = "https://xx0528.github.io/4k_pwa";

// 备用域名列表（当GitHub不可用时使用）
const BACKUP_PWA_DOMAINS = [
    "https://7p.game",
    "https://4u.game"
];

const channelMap = {
    10001: {
        host_name: ['4k.game'],//域名列表
        pixel_list: ['']
    },
    10002: {
        host_name: ['4k.game'],//域名列表
        pixel_list: ['']
    }
}

var channel_id = 10001//渠道
var h5_link = ""//h5链接
var pixel_list = [];//像素列表
var browserName = ""//浏览器名字
var bigo_pixel_id = ""//bigo 像素id
var bbg = ""//bigo 像素id
var device_code = ""//账号锚点

//上报事件类型
const CLIENT_EVENT_TYPE = {
  PAGE_SHOW:0,//打开页面
  CLICK_INSTALL_BUTTON:1,//点击了安装按钮
  PWA_INSTALL_ACCEPT:2,//同意安装PWA
  PWA_INSTALL_CANCEL:3,//取消安装PWA
  PWA_INSTALL_ERROR:4,//无法安装PWA，直接打开H5
  PWA_INSTALL_OPEN:5,//安装PWA后，并打开H5
  OPEN_EXTERNAL_BROWSER:6,//外跳浏览器
};

//获取渠道信息
(function() {
  //根据指定域名来获取渠道
  let hostname = window.location.hostname
  for (const key in channelMap) {
    let host_list = channelMap[key].host_name
    if(host_list?.includes(hostname)){
      channel_id = key
      break
    }
  }
  const urlParams = new URLSearchParams(window.location.search);
  //渠道参数
  let param = urlParams.get("channel_id");
  if(param?.length>0){
    let number = Number(param)
    if(!isNaN(number)){
      channel_id = number
    }
  }

    bigo_pixel_id = urlParams.get("pixel_id");
    bbg = urlParams.get("bbg");
    device_code = urlParams.get("device_code") || "";
    //分享渠道参数
    param = urlParams.get("share");
  if(param?.length>0){
    let number = Number(param)
    if(!isNaN(number)){
      channel_id = number
    }
  }
  //像素列表
    param = urlParams.get("pixel_list");
    if (param?.length > 0) {
        pixel_list = param.split(",");
    }
    let channelData = channelMap[channel_id]
    if (channelData) {
        h5_link = channelData.h5_link
        if (pixel_list.length <= 0) {
            pixel_list = channelData.pixel_list || []
        }
    }
    h5_link = h5_link?.length > 0 ? h5_link : `/4k_pwa/redirect.html?channel_id=${channel_id}`

    if (device_code) {
      const h5Url = new URL(h5_link, window.location.origin);
      h5Url.searchParams.set('device_code', device_code);
      h5_link = h5Url.toString();
    }

    if (bbg) {
        const h5Url = new URL(h5_link, window.location.origin);
        h5Url.searchParams.set('bbg', encodeURIComponent(bbg));
        h5_link = h5Url.toString();
        console.log("xxxxxxxxxxxxxxyyyyyy最终的 h5_link：", h5_link);
    }
    let fbc = urlParams.get("fbc");
    let fbp = urlParams.get("fbp");
    console.log("获取到的 fbc：", fbc, "获取到的 fbp：", fbp);

    if (fbp && fbc) {
        const h5Url = new URL(h5_link, window.location.origin); // 第二个参数确保相对路径能正确解析
        h5Url.searchParams.set('fbp', encodeURIComponent(fbp)); // 存在则添加/覆盖
        h5Url.searchParams.set('fbc', encodeURIComponent(fbc)); // 存在则添加/覆盖
        h5_link = h5Url.toString();
    }


  const link = document.querySelector('link[rel="manifest"]');
  // 判断是否在GitHub页面运行
  const isGitHubPage = window.location.hostname.includes('github.io');

  // 更新link标签的href属性
  if (isGitHubPage) {
      // 在GitHub页面运行，使用相对路径加载本地manifest
      const manifestName = channel_id == 10001 ? 'manifest.json' : `${channel_id}.json`;
      link.href = `/4k_pwa/${manifestName}`;
  } else if (GITHUB_PWA_DOMAIN && GITHUB_PWA_DOMAIN !== "") {
      // 在其他域名运行时，使用GitHub上的manifest
      const manifestName = channel_id == 10001 ? 'manifest.json' : `${channel_id}.json`;
      link.href = `${GITHUB_PWA_DOMAIN}/${manifestName}`;
  } else {
      link.href = channel_id == 10001?'manifest.json':`./${channel_id}.json`
  }

  console.log("channel_id======================"+channel_id)

  browserName = getBrowserName()

  sendClientEventReport(CLIENT_EVENT_TYPE.PAGE_SHOW, "打开页面")
})();

//发送打点数据
function sendClientEventReport(eventType, eventData="") {
  // 创建请求体数据
  let data = {
      channel_id: Number(channel_id), // 强制转为数字
    eventType: eventType,
    device: isIOSOrMac()?1:0,
    browserName: browserName,
    eventData: eventData
  };
  sendData("/agent/clientEventReport", data)
}

//发送fb data到服务器保存
function sendSaveFbData() {
  let fbc = getFbc()
  if(fbc){
    let fbp = getFbp()
    // 创建请求体数据
    let data = {
      channel_id: channel_id,
      fbc: fbc,
      fbp: fbp
    };
    sendData("/user/v1/saveFbData", data)
  }
}

//发送分享码到服务器保存
function sendSaveShareData() {
  const urlParams = new URLSearchParams(window.location.search);
  let uid = urlParams.get("uid");
  let share = urlParams.get("share");
  if(uid?.length>0 && share?.length>0){
    uid = Number(uid)
    share = Number(share)
    // 创建请求体数据
    let data = {
      temporaryDataList:[
        {
          key:"ShareData",
          channel_id:share,
          data:JSON.stringify({
            agent_id: uid,
          })
        }
      ]
    }
    sendData("/configura/saveTemporaryData", data)
  }
}

//发送请求
function sendData(action, data) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", `https://game.4k.game${action}`, true); // 设置请求方式和目标URL
  // 设置请求头
  xhr.setRequestHeader("Content-Type", "application/json");
  // 设置响应回调
  xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {
      console.log(action, "请求成功", xhr.responseText);
    } else {
      console.log(action, "请求失败", xhr.status);
    }
  };
  xhr.onerror = function() {
    console.log(action, "请求出错");
  };
  // 发送请求
  xhr.send(JSON.stringify(data));
  console.log(JSON.stringify(data))
}

// 获取浏览器名称的函数
function getBrowserName() {
  const userAgent = navigator.userAgent.toLowerCase();
  // 检测顺序重要（Edge需在Chrome前）
  if (userAgent.includes('fbios') || userAgent.includes('fbrowser')) return "fbrowser";
  if (userAgent.includes("opera") || userAgent.includes("opr")) return "Opera";
  if (userAgent.includes("edg") || userAgent.includes("edge")) return "Edge";
  if (userAgent.includes("chrome")) return "Chrome";
  if (userAgent.includes("firefox")) return "Firefox";
  if (userAgent.includes("safari")) return "Safari";
  if (userAgent.includes("msie") || userAgent.includes("trident")) return "IE";
  return "Unknown";
}

//获取Cookie中的值
function getCookie(name) {
  let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

//获取fbc
function getFbc() {
  let _fbc = getCookie('_fbc')
  if(_fbc){
    return _fbc
  }
  const urlParams = new URLSearchParams(window.location.search);
  const fbclid = urlParams.get('fbclid');
  if (fbclid) {
    _fbc = `fb.1.${Date.now()}.${fbclid}`;
    document.cookie = `_fbc=${_fbc}; max-age=7776000; path=/; SameSite=None; Secure`;
    return _fbc
  }
  return null
}

//获取fbc
function getBbg() {
    const urlParams = new URLSearchParams(window.location.search);
    const _bbg = urlParams.get('bbg');
    if (_bbg) {
        return _bbg
    }
    return null
}

//获取fbp
function getFbp() {
  let _fbp = getCookie('_fbp')
  if(_fbp){
    return _fbp
  }
  _fbp = generateFbp()
  document.cookie = `_fbp=${_fbp}; max-age=7776000; path=/; SameSite=None; Secure`;
  return _fbp
}

//自动生成fpb
function generateFbp() {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomId = Math.floor(Math.random() * 1000000000);
  return `fb.1.${timestamp}.${randomId}`;
}

//是否ios或者mac
function isIOSOrMac() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  // 判断 iOS 设备（包括 iPhone、iPad、iPod）和 macOS
  return (/iPhone|iPad|iPod/.test(userAgent) || /Macintosh/.test(userAgent)) && !window.MSStream;
}

//设置游戏名字
function setGameName() {
 // const gameName = (channelMap[channel_id].host_name[0] || "4K.GAME");

    const gameName = (channel_id == 10001 || channel_id == 10002)
        ? "4K.GAME"
        : (channelMap[channel_id]?.host_name?.[0] || "4K.GAME");


  const gameNameText1El = document.querySelector('#gameNameText1')
  if(gameNameText1El){
    gameNameText1El.innerText = gameName
  }
  const gameNameText2El = document.querySelector('#gameNameText2')
  if(gameNameText2El){
    gameNameText2El.innerText = gameName
  }
}



