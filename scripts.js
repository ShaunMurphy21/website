function myFunction(){


    let name = document.getElementById('name').value

    const settings = {
        async: true,
        crossDomain: true,
        url: 'https://imdb-com.p.rapidapi.com/auto-complete?q='+name,
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': 'e7db0383c3msh317381e7f613d22p15dfaajsn6a8157df7a98',
            'X-RapidAPI-Host': 'imdb-com.p.rapidapi.com'
        }
    };
    
    $.ajax(settings).done(function (response) {
        let movUrl = 'https://vidsrc.to/embed/movie/'
        let obj = response
        let videourl = movUrl + obj.data.d[0].id
    //});

        document.getElementById('videoShow').src = videourl
    
    });
}