
const searchButton = document.getElementById('searchButton')

var map

searchButton.addEventListener("click", () => {
    let searchArray = [];
    const searchValue = document.getElementById('searchValue').value
    
    searchArray.push(searchValue.split(' '))
    console.log(searchArray)
    document.getElementById('map').innerHTML = ''
    document.getElementById('map').className = 'd-flex justify-content-center'
    document.getElementById('todoList').innerHTML = ''
    document.getElementById('useage').innerHTML = ''
    console.log(handleButtonClick(searchArray))

} )

async function handleButtonClick(postcode){
    const postCodeData = `https://corsproxy.io/?https://api.postcodes.io/postcodes/${postcode[0][0]}/nearest`
    const apiCall = await fetch(postCodeData);
    const locationData = await apiCall.json();
    let location = []
    for(let i = 0; i < locationData['result'].length; i++){

        location.push([(locationData['result'][i]['latitude']),(locationData['result'][i]['longitude']),(postcode[0][1])])

    }
    console.log(location)
    policeAPICall(location.filter(function (element){

       return element !== undefined;

    }))
}

async function policeAPICall(location){
    let policeAPIUrl
    let crimeData = []
    console.log(location.length)
    for(let i =0; i < location.length; i++){
    if(location[i] < 3){
        policeAPIUrl = `https://corsproxy.io/?https://data.police.uk/api/crimes-at-location?lat=${location[i][0]}&lng=${location[i][1]}`
        
    }else{
        policeAPIUrl = `https://corsproxy.io/?https://data.police.uk/api/crimes-at-location?date=${location[i][2]}&lat=${location[i][0]}&lng=${location[i][1]}`
    }
    const rawCrimeData = await fetch(policeAPIUrl);
    const data = await rawCrimeData.json();
    crimeData.push(data)
    console.log(data[''])

    }
    console.log(crimeData)
    outputCrimeData(crimeData, location[0][0], location[0][1])

}


//Below function is to deal with partial postcodes such as NG6 7D, NG6, NG6 7 etc
async function partialPostCode(partialPostCode){

    const postCodeUrl = `https://api.postcodes.io/postcodes/${partialPostCode}/autocomplete`


}

function outputCrimeData(data, lng, lat){
    var map = L.map('map').setView([lng,lat], 15);
    for(let x = 0; x != data.length; x++){
        const singlePost = data[x];
        for(let i = 0; i != singlePost.length; i++){
            try{
            console.log(singlePost[i]['category']+' | '+
            singlePost[i]['location']['street']['name']+' | '+
            singlePost[i]['outcome_status']['category'])}catch{console.log('passing')}
            try{
            var marker = L.marker([singlePost[i]['location']['latitude'], singlePost[i]['location']['longitude']]).addTo(map);
            marker.bindPopup("<b>"+ singlePost[i]['category'] +"</b><br>"+ singlePost[i]['location']['street']['name'] +"</br><br>"+ singlePost[i]['outcome_status']['category'] +"</br>").openPopup();
            }
            catch{console.log('no location data')}

        }}

    L.tileLayer('https://corsproxy.io/?https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://corsproxy.io/?https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    n = document.getElementById('searchButton')
    n.addEventListener("click", () => {

        map.remove();

    })
}