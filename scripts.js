function myFunction(){

//test
    let name = document.getElementById('name').value
    const namemovie = name.split(",")
    const settings = {
        async: true,
        crossDomain: true,
        url: 'https://imdb-com.p.rapidapi.com/auto-complete?q='+namemovie[0],
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': namemovie[1],
            'X-RapidAPI-Host': 'imdb-com.p.rapidapi.com'
        }
    };

    if(namemovie[1].length < 40){

        alert('Please enter valid password!')

    }
    
    $.ajax(settings).done(function (response) {
        let movUrl = 'https://vidsrc.to/embed/movie/'
        let obj = response
        let videourl = movUrl + obj.data.d[0].id
    //});

        document.getElementById('videoShow').src = videourl
    
    });
}
