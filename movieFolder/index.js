const apiKey = '3d62b472'


async function getSearch(){
    let url
    let typeSearch
    const searchValue = document.getElementById('movieSearch').value;
    const typeChoice = document.getElementById('choice').value
    if(typeChoice === 'movie'){
        typeSearch = 'movie' 
        url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${searchValue}&type=movie`
    }else{

        typeSearch = 'series'
        url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${searchValue}&type=series`
    }
    const data = await fetch(url)
    if(typeSearch ==='series'){typeSearch = 'tv'}
    const movieData = await data.json();
    return [movieData, typeSearch]
}

function searchResults(data){
    const movieList = data[0]['Search']
    //const newMovieList = movieList.slice(0,5)
    const updatedList = movieList.map(movie => ({
    imdbID: movie['imdbID'],
    Title: movie['Title'],
    Poster: movie['Poster'],
    Type: data[1]
    }))
    return updatedList
}

//darkModeClick event listener activates darkMode using bootstraps data-bs-theme
const darkModeClick = document.getElementById('darkModeButton');
darkModeClick.addEventListener('click', () => {
    const htmlElement = document.querySelector('html');
    if(htmlElement.dataset.bsTheme == ''){
        const htmlElement = document.querySelector('html'); // Select the HTML element
        htmlElement.dataset.bsTheme = 'dark';
    }else{
        const htmlElement = document.querySelector('html'); // Select the HTML element
        htmlElement.dataset.bsTheme = '';
    }
})


function createCard(movieData){
    //Creating the card div here
    const container = document.getElementById('movieCards');
    container.innerHTML = ''
    container.className = 'd-flex flex-wrap justify-content-center'
    container.style.marginLeft = '20%'
    container.style.marginRight = '20%'
    container.style.marginBottom = '20%'
    for(let movie of movieData){
        const aTag = document.createElement('a')
        const cardDiv = document.createElement('div')
        cardDiv.className = 'card'
        cardDiv.id = 'movieCard'
        cardDiv.style.display = 'block'
        cardDiv.style.width = '12rem'
        aTag.addEventListener('click', () => {

            embedVideo(movie.imdbID, movie.Type)
            const clearHeader = document.getElementById('latestHeader')
            clearHeader.innerHTML = ''

        })
        aTag.appendChild(cardDiv)
        aTag.className = 'singleCard'
        aTag.style.textDecoration = 'none'
        container.appendChild(aTag)

        //Adding the img to the card
        const moviePoster = document.createElement('img')
        moviePoster.className = 'card-img-top'
        moviePoster.src = movie.Poster
        moviePoster.alt = movie.Title + 'Poster'
        moviePoster.style.height = '300px'
        moviePoster.style.width ='200px'
        moviePoster.style.objectFit ='cover'
        cardDiv.appendChild(moviePoster)


        //creating the card body that contains the name of the film
        const cardBody = document.createElement('div')
        cardBody.className = 'card-body'
        const cardText = document.createElement('p')
        cardText.className = 'card-text'
        cardText.innerText = movie.Title
        //appending the div's and text to the master div of the card - in this case the variable cardDiv.
        cardBody.appendChild(cardText)
        cardDiv.appendChild(cardBody)

    }
}



function embedVideo(id, type){
    let url
    if(type === 'movie'){url = `https://vidsrc.to/embed/movie/${id}`}
    else{url = `https://vidsrc.to/embed/tv/${id}`}
    const videoMainContainer = document.getElementById('moviePlayer')
    videoMainContainer.style.height = '80%'
    const mainContainer = document.getElementById('movieCards');
    mainContainer.innerHTML = ''
    mainContainer.style.margin = '0px'
    const videoDivContainer = document.createElement('div')
    videoDivContainer.className = "justify-content-center"
    videoDivContainer.style.width = '100%'
    videoDivContainer.style.height = '100%'
    const newDiv = document.createElement('div')
    newDiv.className = 'embed-responsive'
    const frame = document.createElement('iframe')
    const darkmode = document.getElementById('darkmodeContainer');
    darkmode.style.display = 'none'
    frame.src = url
    frame.id = 'videoPlayer'
    frame.allowFullscreen = true
    videoDivContainer.appendChild(newDiv)
    newDiv.appendChild(frame)
    videoMainContainer.appendChild(videoDivContainer)
}





const btnClick = document.getElementById('searchBtn');
btnClick.addEventListener('click', async () => {
        const clearHeader = document.getElementById('latestHeader')
        clearHeader.innerHTML = ''
        const clearFunc = document.getElementById('moviePlayer')
        clearFunc.innerHTML = ''
        clearFunc.style.height = ''
        const data = await getSearch();
        const movieData = await searchResults(data)
        createCard(movieData)
        const darkmode = document.getElementById('darkmodeContainer');
        darkmode.style.display = 'inline-block'
});

async function latestMovies() { // Explicitly include API key parameter

    const url = 'https://vidsrc.to/vapi/movie/new/1';
    const response = await fetch(url);
    const movieData = await response.json();

    // Access movies using appropriate path within your response data
    const movies = movieData['result']['items']; // Adjust path as needed

    const updatedData = await Promise.all(
      movies.map(async (movie) => {
        try {
          const omdbURL = `https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.imdb_id}`;
          const posterFetch = await fetch(omdbURL);
          const jsonFetchUpdate = await posterFetch.json();
          
          return { ...movie, Poster: jsonFetchUpdate['Poster'] }; // Update and return
        } catch (error) {
          console.error('Error fetching poster for', movie.title, error);
          // Optional: handle the error differently (e.g., skip the movie)
          return movie; // Or return the original movie object (consider options)
        }
      })
    );

    const updatedData0 = updatedData.map(movie => ({

        Title: movie['title'],
        imdbID: movie['imdb_id'],
        Poster: movie['Poster'] || './placeholder.png'

    }))
    return updatedData0
  }


window.onload= async () => {

    const clearFunc0 = document.getElementById('moviePlayer')
    clearFunc0.innerHTML = ''
    clearFunc0.style.height = ''
    const latestHeader = document.getElementById('latestHeader')
    latestHeader.innerText = 'Latest Releases'
    const movieData0 = await latestMovies()
    createCard(movieData0)

}

