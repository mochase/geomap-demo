/* eslint-disable */
import counties from './counties.js'
import busLines from './paths.json'


export default function initMap() {
  let theme = 2
  let map
  let amap
  let colors = {}
  let pointsLayer
  let mapConf = {
    '2': {
      map: {
        mapStyle: 'amap://styles/3f077ca639bcf0ebc25d5153582e5a8b',
        features: ['bg'],
        zoom: 11,
        zooms: [9, 17],
        pitch: 30,
        eventSupport: true,
      },
      visualLayer: {
        showLines: true,
        showDistrictLayer: false
      }
    }
  }

  return {
    render
  }
  
  function render() {
    if (map) {
      map.destroy()
    }
    map = Loca.create('container', mapConf[theme].map);
    if (mapConf[theme].visualLayer.showLines) {
      drawLinesLayer()
    }
    pointsLayer = drawPointsLayer()
    map.on('mapload', function () {
      amap = map.getMap()
      drawCountyName()
      amap.plugin(['Map3D', 'AMap.DistrictLayer'], function () {
        drawDistrictLayer()
      })
    })
    return {
      pointsLayer,
      render
    }
  }

  function drawCountyName() {
    let markerList = []
    for (let i = 0; i < counties.length; i++) {
      const content = `<span style="font-size:14px;color:#fefeff">${counties[i].name}</span>`
      const marker = new AMap.Marker({
        content: content,
        position: counties[i].lngLat
        // offset: new AMap.Pixel(-17, -42)
      })
      markerList.push(marker)
    }
    amap.add(markerList)
  }

  function drawDistrictLayer() {
    let disProvince = new AMap.DistrictLayer.Province({
      zIndex: 12,
      adcode: [420100],
      depth: 2,
      eventSupport: true,
      styles: {
        'fill': function (properties) {
          // properties为可用于做样式映射的字段，包含
          // NAME_CHN:中文名称
          // adcode_pro
          // adcode_cit
          // adcode
          if (mapConf[theme].visualLayer.showDistrictLayer) {
            let adcode = properties.adcode;
            return getColorByAdcode(adcode)
          }
          return ''
        },
        'province-stroke': '#cccfff',
        'city-stroke': '', // 中国地级市边界
        'county-stroke': '' // 中国区县边界
      }
    });
    disProvince.setMap(amap);
    amap.on('click', (e) => {
      var px = e.pixel
      var props = disProvince.getDistrictByContainerPos(px);
      if (props) {
        const adcode = props.adcode
        disProvince.setStyles({
          'fill': function (properties) {
            if (properties.adcode === adcode) {
              return '#FF0000'
            }
            return ''
          },
          'province-stroke': '',
          'city-stroke': '', // 中国地级市边界
          'county-stroke': '' // 中国区县边界
        })
      }
    })
  }

  function drawPointsLayer() {
    let layer = Loca.visualLayer({
      container: map,
      eventSupport: true,
      blendMode: 'lighter',
      type: 'point',
      shape: 'circle'
    });

    layer.setOptions({
      style: {
        // 默认半径单位为像素
        radius: {
          key: 'traceAmount',
          value: [2, 15]
        },
        color: '#ffcc00',
        borderColor: '#c3faff',
        borderWidth: 1,
        opacity: 0.8
      }
    });

    var infoWin;
    var contentWrapper;
    /**
     * 封装便捷的info
     * @param {AMap.Map} map
     * @param {Array} event
     * @param {Object} content
     */
    function openInfoWin(map, event, content) {
      if (!infoWin) {
        infoWin = new AMap.InfoWindow({
          isCustom: true, //使用自定义窗体
          offset: new AMap.Pixel(130, 100)
        });
      }

      var x = event.offsetX;
      var y = event.offsetY;
      var lngLat = map.containerToLngLat(new AMap.Pixel(x, y));

      if (!contentWrapper) {
        let infoDom = document.createElement('div');
        infoDom.className = 'info-tooltip';
        contentWrapper = document.createElement('div');
        infoDom.appendChild(contentWrapper);
        infoWin.setContent(infoDom);
      }

      var trStr = `
          <p>${content.area} ${content.storeName}</p>
          <p>销售金额: ${content.traceAmount} 元</p>
        `
      contentWrapper.innerHTML = trStr;
      infoWin.open(map, lngLat);
    }

    function closeInfoWin() {
      if (infoWin) {
        infoWin.close();
      }
    }

    layer.on('mousemove', function (ev) {
      // 事件类型
      var type = ev.type;
      // 当前元素的原始数据
      var rawData = ev.rawData;
      // 原始鼠标事件
      var originalEvent = ev.originalEvent;

      openInfoWin(map.getMap(), originalEvent, {
        'area': rawData.area,
        'storeName': rawData.storeName,
        'traceAmount': rawData.traceAmount
      });
    });

    layer.on('mouseleave', function (ev) {
      closeInfoWin();
    });
    return layer
  }

  function drawLinesLayer() {
    var layer = Loca.visualLayer({
      container: map,
      type: 'line',
      shape: 'line',
    });
    layer.setData(busLines, {
      lnglat: 'linePath'
    });

    layer.setOptions({
      style: {
        // 3D Line 不支持设置线宽，线宽为 1px
        // borderWidth: 1,
        opacity: 0.5,
        color: '#b7eff7',
      }
    });
    layer.render();
  }

  // 颜色辅助方法
  function getColorByAdcode(adcode) {
    if (!colors[adcode]) {
      if (/420116|420117|420114|420113/.test(adcode)) {
        // 偏远地区(黄陂,蔡甸,新洲,汉南)
        colors[adcode] = 'rgba(56,45,110,0.35)'
      } else if (adcode > 420100 && adcode < 420110) {
        colors[adcode] = 'rgba(255,51,0,0.6)' //中心城区
      } else if (adcode > 420110 && adcode < 420114) {
        colors[adcode] = 'rgba(0,51,255,0.5)'
      } else {
        colors[adcode] = 'rgba(16,65,168,0.5)' //江夏区
      }
    }
    return colors[adcode];
  }
}