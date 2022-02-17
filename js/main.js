const key = 'CWB-CA80D2E2-8869-4DEB-BF30-CB3B4DFF1EB7'
const twoDaysDataId ='F-D0047-069'
const aWeekDataId = 'F-D0047-071'
const sunRSDataId = 'A-B0062-001'

let today = new Date()

let todayDate = today.toLocaleDateString('en-CA')
let timeFrom = new Date(today + 'UTC').toISOString().split('.')[0]
let timeTo = new Date(new Date(today.getTime() + 86400000) + 'UTC').toISOString().split('.')[0]

const todayURL = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/${twoDaysDataId}?Authorization=${key}&format=JSON&locationName=土城區&timeFrom=${timeFrom}&timeTo=${timeTo}`
const aWeekURL = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/${aWeekDataId}?Authorization=${key}&format=JSON&locationName=土城區`
let sunRSURL = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/${sunRSDataId}?Authorization=${key}&format=JSON&locationName=新北市&dataTime=${todayDate}`



// 抓現在時間
const getDateInfo = today => {
  let nowTime = document.querySelector('.now_time')
  let date = today.toString().slice(0, 10)

  nowTime.innerHTML = `
  <span>${date}</span>
  `
}

// unitButton click event
const unitSelect = document.querySelector('.unit_select')

unitSelect.addEventListener('click', e => {
  // unitButton target
  const target = e.target
  let targetContent = target.textContent
  
  // 抓取在每個有溫度的標籤上設置的data-unitvalue屬性值 
  const unitValue = document.querySelectorAll('[data-unitvalue]') 

  unitValue.forEach(i => {
    let valueC = i.dataset.unitvalue
    // °F = (°C * 9) / 5 + 32
    let valueF = Math.round(valueC * 9 / 5 + 32)

    // 判斷當前的unit 給予相對應的轉換單位與值
    let unit = targetContent === '°C' ? '°F' : '°C' 
    let value = targetContent === '°C' ? valueC : valueF
    target.textContent = unit 
    i.textContent = value + '°'
  })
})

// 帶入網址抓取資料
const getData = async URL => {
  let res = await fetch(URL)
  let data = await res.json()
  
  // 判斷使哪個網址 選擇要丟入哪個函式的參數
  if(URL === todayURL) {
    let loc = data.records.locations[0].location[0]

    getThreeDaysInfo(loc)
  }
  else if(URL === aWeekURL) {
    let loc = data.records.locations[0].location[0]

    getAWeekInfo(loc)
  } 
  else if(URL === sunRSURL) {
    let loc = data.records.locations.location[0]
    
    getSunRSInfo(loc)
  }
}

// 透過天氣現象描述 判斷適合的icon的函式
const cardbody = document.querySelector('.card')

cardbody.addEventListener('scroll', () => {
  if(cardbody.scrollTop + cardbody.clientHeight === cardbody.scrollHeight) console.log('finish')
})

const weatherStatus = (pheValue, ClassName, boolean, hours) => {
  let timeStatus = hours >= 6 && hours < 18 ? 'sun' : 'moon' 
  
  if(pheValue.includes('晴') && pheValue.includes('雷')){
    ClassName.innerHTML += `
      <span><i class="fas fa-thunderstorm-${timeStatus} weather_icon"></i></span>
    `
    // 更改背景顏色
    if(boolean) cardbody.classList.add('raniy')

  } else if(pheValue.includes('雨')) {
    ClassName.innerHTML += `
      <span><i class="fas fa-cloud-showers-heavy weather_icon"></i></span>
    `
    if(boolean) cardbody.classList.add('raniy')

  } else if(pheValue.includes('晴') && pheValue.includes('雲')) {
    ClassName.innerHTML += `
      <span><i class="fas fa-cloud-${timeStatus} weather_icon"></i></span>
    `
    if(boolean) cardbody.classList.add('sunny')

  } else if(pheValue.includes('晴')) {
    ClassName.innerHTML += `
      <span><i class="fas fa-${timeStatus} weather_icon"></i></span>
    `
    if(boolean) cardbody.classList.add('sunny')

  } else if(pheValue.includes('陰') || pheValue.includes('雲')) {
    ClassName.innerHTML += `
      <span><i class="fas fa-cloud weather_icon"></i></span>
    `
    if(boolean) cardbody.classList.add('cloudy')

  }  
}

// 從threeDaysURL當地資料裡抓 地名,均溫,天氣現象,最低溫,最高溫
const getThreeDaysInfo = loc => {
  let phe = loc.weatherElement[1].time
  let tem = loc.weatherElement[3].time

  dayWeatherInfo(phe, tem)
}

// 從aWeekURL當地資料裡抓 地名,均溫,天氣現象,最低溫,最高溫
const getAWeekInfo = loc => {
  let locName = loc.locationName
  let pop = loc.weatherElement[0].time
  let avgTem = loc.weatherElement[1].time
  let humidity = loc.weatherElement[2].time
  let phe = loc.weatherElement[6].time
  let lowTem = loc.weatherElement[8].time
  let uv = loc.weatherElement[9].time
  let highTem = loc.weatherElement[12].time

  mainWeatherInfo(locName, avgTem, phe, lowTem, highTem)
  weekWeatherInfo(pop, avgTem, phe, lowTem, highTem)
  extraWeatherInfo(pop, humidity, uv)
}

// 抓該屬性的值函式
const getValue = el => {
  return el.elementValue[0].value
}

// 主要顯示現在的天氣資訊區域
const mainWeatherInfo = (locName, avgTemTime, pheTime, lowTime, highTime) => {
  let mainboxInfo = document.querySelector('.mainbox_info')
  let mainboxIconWrap = document.querySelector('.mainbox_icon_wrap')
  let pheDescription = getValue(pheTime[0])
  let hoursValue = today.getHours()

  weatherStatus(pheDescription, mainboxIconWrap, true, hoursValue)  
  
  mainboxInfo.innerHTML = `
  <div class="mainbox_info_top dp-f g-1">        
    <div class="city">${locName}</div>
    <div class="description">${getValue(pheTime[0])}</div>
  </div>
  <div class="mainbox_info_bottom dp-f g-1">
    <div class="avg_tem" data-unitvalue="${getValue(avgTemTime[0])}">${getValue(avgTemTime[0]) + '°'}</div>
    <div class="tem dp-f g-2">
      <div class="tem_highest dp-f g-1">
        <span>H</span>
        <span data-unitvalue="${getValue(highTime[0])}">${getValue(highTime[0]) + '°'}</span>
      </div>
      <div class="tem_lowest dp-f g-1">
        <span>L</span>
        <span data-unitvalue="${getValue(lowTime[0])}">${getValue(lowTime[0]) + '°'}</span>
      </div>
    </div>
  </div>
  `
}

// 當天每個時段的天氣資訊區域
const dayWeatherInfo = (pheTimeDurations, temTimeDurations) => {
  let daytimesTop = document.querySelector('.daytimes_top')
  let daytimesBottom = document.querySelector('.daytimes_bottom')

  // 時間和溫度
  temTimeDurations.forEach(i => {
    let temDataTime = i.dataTime
    let temValue = getValue(i)
    // toLocaleString() 日期時間格式化 AM PM 
    let hours = new Date(temDataTime).toLocaleString('en-US', {
      hour:'numeric',
      hour12: true
    })

    daytimesTop.innerHTML +=  ` 
    <div class="daytimes_top_wrap dp-f">    
      <div class="daytimes_top_wrap_time dp-f g-1">
        <span>${hours}</span>
      </div>
      <div class="daytimes_top_wrap_tem mbs-1">
        <span data-unitvalue="${temValue}">${temValue + '°'}</span> 
      </div>   
    </div>
    `
  })

  // 天氣icon
  pheTimeDurations.forEach(i => {
    let pheTime = i.startTime
    let hoursValue = new Date(pheTime).getHours()
    let pheValue = getValue(i)

    weatherStatus(pheValue, daytimesBottom, false, hoursValue)
  })
}

// 一周內的天氣資訊區域
const weekWeatherInfo = (popTime, avgTime, pheTime, lowTemTime, highTemTime) => {
  let days = document.querySelector('.days')
  let popsIcon = document.querySelector('.pops_icon')
  let popsValue = document.querySelector('.pops_value')
  let temsHigh = document.querySelector('.tems_high')
  let temsLow = document.querySelector('.tems_low')

  avgTime.splice(0, 2)
  pheTime.splice(0, 2)
  popTime.splice(0, 2)
  highTemTime.splice(0, 2)
  lowTemTime.splice(0, 2)
  
  let avgTemLoop = avgTime.map((i, j) => {
    let avgTemDate = i.startTime
    let day = new Date(avgTemDate).toString().slice(0, 3)

    if(j % 2 === 0) {
      return `
      <div class="day">
        <span>${day}</span>
      </div>
      `
    }
  }).join('')

  pheTime.forEach((i, j) => {
    let pheValue = getValue(i)

    if(j % 2 === 0) weatherStatus(pheValue, popsIcon, false, 12)
  })

  let popLoop = popTime.map((i, j) => {
    let popValue = getValue(i)

    if(j % 2 === 0) {
      let val =  popValue > 0 ? popValue : 0
      return `
      <span>${val}%</span>
      `
    }
  }).join('')

  let hignTemLoop = highTemTime.map((i, j) => {
    let hignValue = getValue(i)

    if(j % 2 === 0) {
      return `
      <span data-unitvalue="${hignValue}">${hignValue + '°'}</span>
      `
    }
  }).join('')

  let lowTemLoop = lowTemTime.map((i, j) => {
    let lowValue = getValue(i)

    if(j % 2 === 0) {
      return `
      <span data-unitvalue="${lowValue}">${lowValue + '°'}</span>
      `
    }
  }).join('')

  days.innerHTML = avgTemLoop
  popsValue.innerHTML = popLoop
  temsHigh.innerHTML = hignTemLoop
  temsLow.innerHTML = lowTemLoop
}

// 額外天氣資訊
const extraWeatherInfo = (pop, humidity, uv) => {
  const popContent = document.querySelector('.pop')
  const humidityContent = document.querySelector('.humidity')
  const uvContent = document.querySelector('.uv')
  let popValue = getValue(pop[0])
  let humidityValue = getValue(humidity[0])
  let uvValue = getValue(uv[0])

  popContent.innerHTML = `
  <span>降雨機率</span>
  <span>${popValue + '%'}</span>
  `
  humidityContent.innerHTML = `
  <span>濕度</span>
  <span>${humidityValue + '%'}</span>
  `
  uvContent.innerHTML = `
  <span>紫外線指數</span>
  <span>${uvValue}</span>
  `
}

// 抓取及放入日出日落時間
const getSunRSInfo = loc => {
  const sunRiseContent = document.querySelector('.sunrise')
  const sunSetContent = document.querySelector('.sunset')
  let sunRise = loc.time[0].parameter[1].parameterValue
  let sunSet = loc.time[0].parameter[5].parameterValue 

  sunRiseContent.innerHTML = `
  <span>日出時刻</span>
  <span>${sunRise}</span>
  `
  sunSetContent.innerHTML =  `
  <span>日落時刻</span>
  <span>${sunSet}</span>
  `
}
 
// 載入就執行
// fetch API threeDaysURL
getData(todayURL)
// fetch API aWeekURL
getData(aWeekURL)
// fetch API sunRSURL
getData(sunRSURL)
// nowdate
getDateInfo(today)