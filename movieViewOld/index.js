
async function fetchMovieData() {
  const url = 'https://vidsrc.xyz/movies/latest/page-1.json';
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error fetching data: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
//apihere
async function fetchMovieDetails(imdbID) {
  const url = `http://www.omdbapi.com/?i=${imdbID}&apikey=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error fetching movie details: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

function createMovieCard(movieDetails) {
  if (!movieDetails || !movieDetails.Title || !movieDetails.Year) {
    console.warn('Skipping movie card creation due to missing title or year');
    return; 
  }
  const linkElement = document.createElement('a');
  const card = document.createElement('div');
  card.classList.add('movie-card');
  

  const img = document.createElement('img');
  img.style.width = '150px';
  img.style.height = '200px';
  img.src = movieDetails.Poster !== 'N/A' ? movieDetails.Poster : './placeholder.png'; 
  card.appendChild(img);

  const title = document.createElement('h3');
  title.style.fontSize = '18px';
  title.style.color = 'aliveblue';
  title.textContent = `${movieDetails.Title} (${movieDetails.Year})`;
  card.appendChild(title);
  linkElement.appendChild(card)


  return card;
}



async function displayMovies() {
  const movies = await fetchMovieData();
  const moviesToDisplay = movies.result.slice(0, 37); 

  const movieContainer = document.getElementById('movie-container');
  movieContainer.innerHTML = ''; 

  for (const movie of moviesToDisplay) {

    console.log(movie.Title, movie.Poster);

    try {
      const movieDetails = await fetchMovieDetails(movie.imdb_id);

      if (movieDetails) {
        const linkElement = document.createElement('a');
        linkElement.href = 'https://imdb.com/title/' + movie.imdb_id;
        linkElement.style.textDecoration = 'none'
        linkElement.style.color = 'aliceblue'
        const movieCard = createMovieCard(movieDetails);
        linkElement.appendChild(movieCard)
        linkElement.style.display = 'inline-block'
        movieCard.classList.add('col'); 
        movieContainer.appendChild(linkElement);
        linkElement.classList.add('col')
      } else {
        console.warn(`Movie details not found for ${movie.imdb_id} (might be a rate limit issue)`);
      }
    } catch (error) {
      console.error(`Error fetching details for ${movie.title}: ${error}`);
    }
  }
}







//apihere

if (apiKey) {
  displayMovies();
} else {
  console.error('Please set your OMDb API key!');
}