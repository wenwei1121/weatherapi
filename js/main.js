// API Authorization key
const key = 'CWB-CA80D2E2-8869-4DEB-BF30-CB3B4DFF1EB7'

const today = new Date()

//--- 這兩天新北市的天氣資料Id ---
const twoDaysDataId ='F-D0047-069'
// 因為 timeFrom & timeTo 要帶入的參數格式限定為 YYYY-MM-DDTHH:mm:ss
// 所以先用 toISOString() 轉換成 YYYY-MM-DDTHH:mm:ss.sssZ 字串格式 
// 然後再用 split('.')[0] 擷取點號前面的字串(split() 回傳是一個array)
// 因為 toISOString() 為+0時間 台灣是+8 所以現在時間加上'UTC'
const timeFrom = new Date(today + 'UTC').toISOString().split('.', 1)
// 因為抓剛好一天時間的間距 所以先把當下時刻用 getTime() 轉換成毫秒後再加上一天的毫秒數 然後再轉換成需要的格式
const timeTo = new Date(new Date(today.getTime() + 86400000) + 'UTC').toISOString().split('.', 1)
const todayURL = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/${twoDaysDataId}?Authorization=${key}&format=JSON&locationName=土城區&timeFrom=${timeFrom}&timeTo=${timeTo}`

//--- 未來一個禮拜新北市的天氣資料Id ---
const aWeekDataId = 'F-D0047-071'
const aWeekURL = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/${aWeekDataId}?Authorization=${key}&format=JSON&locationName=土城區`

//--- 當天日出日落時刻資料Id ---
const sunRSDataId = 'A-B0062-001'
// 因為 dataTime 要帶入的參數格式限定為 YYYY-MM-DD => 所以 locales 設為 'en-CA' 
// toLocaleDateString(locales, [, options])
// 該方法返回該日期對象日期部分的字符串 字符串格是因不同語言而不同
const todayDate = today.toLocaleDateString('en-CA')
const sunRSURL = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/${sunRSDataId}?Authorization=${key}&format=JSON&locationName=新北市&dataTime=${todayDate}`

//--- 當下日期 要顯示在最上方的日期 ---
const getDateInfo = today => {
  let nowTime = document.querySelector('.now_time')
  // 切字串第1個到第10個
  let date = today.toString().slice(0, 10)

  nowTime.innerHTML = `
  <span>${date}</span>
  `
}

// --- 單位按鈕事件 ---
const unitSelect = document.querySelector('.unit_select')

unitSelect.addEventListener('click', e => {
  const target = e.target
  const targetContent = target.textContent

  // 抓取在每個有溫度的標籤上設置的data-unitvalue屬性值 
  const unitValue = document.querySelectorAll('[data-unitvalue]') 
  unitValue.forEach(i => {
    const valueC = i.dataset.unitvalue
    // °F = (°C * 9) / 5 + 32
    // Math.round() => 四捨五入
    const valueF = Math.round(valueC * 9 / 5 + 32)

    // 判斷當前的unit 給予相對應的轉換單位與值
    const unit = targetContent === '°C' ? '°F' : '°C' 
    target.textContent = unit 

    const value = targetContent === '°C' ? valueC : valueF
    i.textContent = value + '°'
  })
})

//--- 帶入網址抓取資料函式 ---
const getData = async URL => {
  const res = await fetch(URL)
  const data = await res.json()
  
  // 判斷是哪個網址 選擇要丟入哪個函式的參數
  if(URL === todayURL) {
    const loc = data.records.locations[0].location[0]

    todayInfo(loc)
  }
  else if(URL === aWeekURL) {
    const loc = data.records.locations[0].location[0]

    getAWeekInfo(loc)
  } 
  else if(URL === sunRSURL) {
    const loc = data.records.locations.location[0]
    
    getSunRSInfo(loc)
  }
}

//--- 透過天氣現象描述 判斷適合的icon的函式 ---
const cardbody = document.querySelector('.card')
const weatherStatus = (pheValue, ClassName, boolean, hours) => {
  // 帶進來的hours參數值 會先去判斷 是否在6到18之間
  // 如果是 讓timeStatus為sun 反之為moon
  // 再把timeStatus值帶入icon class名稱 判別為是早上還是晚上的icon(但不適用沒有sun跟moon字詞的icon)
  const timeStatus = hours >= 6 && hours < 18 ? 'sun' : 'moon' 
  
  if(pheValue.includes('晴') && pheValue.includes('雷')){
    ClassName.innerHTML += `
      <span><i class="fas fa-thunderstorm-${timeStatus} weather_icon"></i></span>
    `

    //--- 更改背景顏色---
    // boolean值是寫死的 在主要顯示當下天氣資訊要帶來的boolean參數設為true 其他設為false
    // 因為每個資訊區域都有icon 然後參數都會丟進這個判斷icon函式
    // 所以為了不讓其他區域影響背景顏色而做區分 只有主要當下的天氣資訊可以影響背景色
    if(boolean) cardbody.classList.add('rainy')

  } else if(pheValue.includes('雨')) {
    ClassName.innerHTML += `
      <span><i class="fas fa-cloud-showers-heavy weather_icon"></i></span>
    `

    if(boolean) cardbody.classList.add('rainy')

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

//*** 從todayaysURL當地資料裡抓地名,均溫,天氣現象,最低溫,最高溫 ***//
const todayInfo = loc => {
  const phe = loc.weatherElement[1].time
  const tem = loc.weatherElement[3].time

  // 當天每個時段的天氣資訊區域函式放入參數
  dayWeatherInfo(phe, tem)
}

//*** 從aWeekURL資料裡抓地名,均溫,天氣現象,最低溫,最高溫 ***//
const getAWeekInfo = loc => {
  const locName = loc.locationName
  const pop = loc.weatherElement[0].time
  const avgTem = loc.weatherElement[1].time
  const humidity = loc.weatherElement[2].time
  const phe = loc.weatherElement[6].time
  const lowTem = loc.weatherElement[8].time
  const uv = loc.weatherElement[9].time
  const highTem = loc.weatherElement[12].time

  // 放參數於各個區塊
  mainWeatherInfo(locName, avgTem, phe, lowTem, highTem)
  weekWeatherInfo(pop, avgTem, phe, lowTem, highTem)
  extraWeatherInfo(pop, humidity, uv)
}

// 取該參數的值函式
const getValue = el => {
  return el.elementValue[0].value
}

/////--- 主要顯示現在的天氣資訊區域 --- /////
const mainWeatherInfo = (locName, avgTemTime, pheTime, lowTime, highTime) => {
  const mainboxInfo = document.querySelector('.mainbox_info')
  const mainboxIconWrap = document.querySelector('.mainbox_icon_wrap')
  const pheDescription = getValue(pheTime[0])
  const hoursValue = today.getHours()

  // 要判斷天氣的icon
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

/////--- 當天每個時段的天氣資訊區域 --- /////
const dayWeatherInfo = (pheTimeDurations, temTimeDurations) => {
  const daytimesTimeAndTem = document.querySelector('.daytimes_top')
  const daytimesIconArea = document.querySelector('.daytimes_bottom')

  // 時間和溫度
  temTimeDurations.forEach(i => {
    const temDataTime = i.dataTime
    const temValue = getValue(i)
    // toLocaleString(locales, [, options]) 日期時間格式化 AM PM 
    const hours = new Date(temDataTime).toLocaleString('en-US', {
      hour:'numeric',
      hour12: true
    })

    daytimesTimeAndTem.innerHTML +=  ` 
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

  // 要判斷天氣的icon
  pheTimeDurations.forEach(i => {
    const pheTime = i.startTime
    const hoursValue = new Date(pheTime).getHours()
    const pheValue = getValue(i)

    weatherStatus(pheValue, daytimesIconArea, false, hoursValue)
  })
}

/////--- 一周內的天氣資訊 --- /////
const weekWeatherInfo = (popTime, avgTime, pheTime, lowTemTime, highTemTime) => {
  const days = document.querySelector('.days')
  const popsIcon = document.querySelector('.pops_icon')
  const popsValue = document.querySelector('.pops_value')
  const temsHigh = document.querySelector('.tems_high')
  const temsLow = document.querySelector('.tems_low')
  
  const avgTemLoop = avgTime.map((i, j) => {
    const avgTemDate = i.startTime
    const day = new Date(avgTemDate).toString().slice(0, 3)

    if(j % 2 === 0) {
      return `
      <div class="day">
        <span>${day}</span>
      </div>
      `
    }
  }).join('')

  pheTime.forEach((i, j) => {
    const pheValue = getValue(i)

    if(j % 2 === 0) weatherStatus(pheValue, popsIcon, false, 12)
  })

  const popLoop = popTime.map((i, j) => {
    const popValue = getValue(i)

    if(j % 2 === 0) {
      const val =  popValue > 0 ? popValue : 0
      return `
      <span>${val}%</span>
      `
    }
  }).join('')

  const hignTemLoop = highTemTime.map((i, j) => {
    const hignValue = getValue(i)

    if(j % 2 === 0) {
      return `
      <span data-unitvalue="${hignValue}">${hignValue + '°'}</span>
      `
    }
  }).join('')

  const lowTemLoop = lowTemTime.map((i, j) => {
    const lowValue = getValue(i)

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

//--- 額外天氣資訊 ---
const extraWeatherInfo = (pop, humidity, uv) => {
  const popContent = document.querySelector('.pop')
  const humidityContent = document.querySelector('.humidity')
  const uvContent = document.querySelector('.uv')
  const popValue = getValue(pop[0])
  const humidityValue = getValue(humidity[0])
  const uvValue = getValue(uv[0])

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

//--- 日出日落時間 ---
const getSunRSInfo = loc => {
  const sunRiseContent = document.querySelector('.sunrise')
  const sunSetContent = document.querySelector('.sunset')
  const sunRise = loc.time[0].parameter[1].parameterValue
  const sunSet = loc.time[0].parameter[5].parameterValue 

  sunRiseContent.innerHTML = `
  <span>日出時刻</span>
  <span>${sunRise}</span>
  `
  sunSetContent.innerHTML =  `
  <span>日落時刻</span>
  <span>${sunSet}</span>
  `
}
 
// fetch API topdaysURL
getData(todayURL)
// fetch API aWeekURL
getData(aWeekURL)
// fetch API sunRSURL
getData(sunRSURL)
// nowdate
getDateInfo(today)



// cardbody.addEventListener('scroll', () => {
//   if(cardbody.scrollTop + cardbody.clientHeight === cardbody.scrollHeight) console.log('finish')
// })