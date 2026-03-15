
const databaseURL = "https://forest-air-polution-default-rtdb.firebaseio.com/"

firebase.initializeApp(firebaseConfig)

const db = firebase.firestore()

let tempChart
let humChart
let pmChart

function showTab(tab)
{

document.getElementById("currentTab").style.display="none"
document.getElementById("historyTab").style.display="none"

if(tab==="current")
{
document.getElementById("currentTab").style.display="block"
}
else
{
document.getElementById("historyTab").style.display="block"
}

}

function createCharts()
{

const ctx1=document.getElementById("tempChart")

const ctx2=document.getElementById("humChart")

const ctx3=document.getElementById("pmChart")

tempChart=new Chart(ctx1,
{
type:"line",
data:
{
labels:[],
datasets:[
{
label:"Nhiệt độ",
data:[],
borderWidth:2
}
]
}
})

humChart=new Chart(ctx2,
{
type:"line",
data:
{
labels:[],
datasets:[
{
label:"Độ ẩm",
data:[],
borderWidth:2
}
]
}
})

pmChart=new Chart(ctx3,
{
type:"line",
data:
{
labels:[],
datasets:[
{
label:"PM2.5",
data:[],
borderWidth:2
}
]
}
})

}

createCharts()

async function loadCurrentData()
{

let range=document.getElementById("timeRange").value

let start
let end=new Date()

if(range==="3")
{
start=new Date(end.getTime()-3*3600*1000)
}
else if(range==="6")
{
start=new Date(end.getTime()-6*3600*1000)
}
else
{
start=new Date(document.getElementById("startTime").value)
end=new Date(document.getElementById("endTime").value)
}

const response=await fetch(databaseURL + ".json")

const data=await response.json()

let labels=[]
let temp=[]
let hum=[]
let pm=[]

for(const key in data)
{

let d=data[key]

let t=new Date(d.time)

if(t>=start && t<=end)
{
labels.push(t.toLocaleTimeString())
temp.push(d.temp)
hum.push(d.humi)
pm.push(d.dust)
}

}

updateChart(tempChart,labels,temp)
updateChart(humChart,labels,hum)
updateChart(pmChart,labels,pm)

}


function updateChart(chart,labels,data)
{

chart.data.labels=labels

chart.data.datasets[0].data=data

chart.update()

}

function calcAQI(pm)
{

let aqi=0

if(pm<=12)
{
aqi=pm*50/12
}
else if(pm<=35.4)
{
aqi=50+(pm-12)*(50/23.4)
}
else if(pm<=55.4)
{
aqi=100+(pm-35.4)*(50/20)
}
else
{
aqi=150+(pm-55.4)*(100/94.6)
}

return Math.round(aqi)

}

function getWarning(aqi)
{

if(aqi<=50)
return "Tốt"

if(aqi<=100)
return "Trung bình"

if(aqi<=150)
return "Không tốt cho nhạy cảm"

return "Nguy hại"

}

async function loadHistory()
{

let start=new Date(document.getElementById("historyStart").value)

let end=new Date(document.getElementById("historyEnd").value)

const response=await fetch(databaseURL + ".json")

const data=await response.json()

const tbody=document.querySelector("#historyTable tbody")

tbody.innerHTML=""

for(const key in data)
{

let d=data[key]

let t=new Date(d.time)

if(t>=start && t<=end)
{

let pm=d.dust

let aqi=calcAQI(pm)

let warn=getWarning(aqi)

let tr=document.createElement("tr")

tr.innerHTML=`
<td>${t.toLocaleString()}</td>
<td>${d.temp}</td>
<td>${d.humi}</td>
<td>${d.dust}</td>
<td>${aqi}</td>
<td>${warn}</td>
`

tbody.appendChild(tr)

}

}

}

function downloadExcel()
{

let table=document.getElementById("historyTable")

let wb=XLSX.utils.table_to_book(table)

XLSX.writeFile(wb,"air_quality_data.xlsx")

}
