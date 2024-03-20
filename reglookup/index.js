

async function vehicleDetails(reg){

    const url = 'https://corsproxy.io/?https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles'
    const response = await fetch(url, {

        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "x-api-key": "Su0NjdSA9G2JZ1tVFEmz632rKE2YuQAS6eryxIJw",
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({
            
            "registrationNumber": `${reg}`
        
        })// bo

    })
    console.log(response)
    const parsedResponse = await response.json();
    return parsedResponse
}


const testCase = document.getElementById('searchButton')
testCase.addEventListener("click", async () => {
    const search = document.getElementById('regValue').value
    const output1 = await vehicleDetails(search);
    const con = document.getElementById('infoContainer')
    con.innerHTML = ''
    Object.entries(output1).forEach((entry) => {
        const [key, value] = entry;
        const header = document.createElement('h5')
        header.className = 'm-3'
        header.innerText = `${key}: ` + `${value}`
        con.appendChild(header)


    });

})