const apiKey = "3d62b472";
const placeholderPoster = "./placeholder.png";

const form = document.getElementById("searchForm");
const searchInput = document.getElementById("movieSearch");
const yearInput = document.getElementById("yearFilter");
const typeSelect = document.getElementById("choice");
const genreSelect = document.getElementById("genreFilter");
const sortSelect = document.getElementById("sortFilter");
const cardsContainer = document.getElementById("movieCards");
const playerContainer = document.getElementById("moviePlayer");
const titleElement = document.getElementById("latestHeader");
const eyebrowElement = document.getElementById("eyebrow");
const statusMessage = document.getElementById("statusMessage");
const backButton = document.getElementById("backToResults");
const sourceControls = document.getElementById("sourceControls");
const loadMoreButton = document.getElementById("loadMoreBtn");
const browseButtons = document.querySelectorAll("[data-browse]");

const embedSources = [
  {
    name: "VidSrc",
    buildUrl: (movie) => buildEmbedUrl("https://vidsrc.to/embed", movie),
  },
  {
    name: "VidSrc CC",
    buildUrl: (movie) => `${buildEmbedUrl("https://vidsrc.cc/v2/embed", movie)}?autoPlay=false`,
  },
  {
    name: "VidSrc FYI",
    buildUrl: (movie) => buildEmbedUrl("https://vidsrc.fyi/embed", movie),
  },
  {
    name: "VidSrc MOV",
    buildUrl: (movie) => buildEmbedUrl("https://vidsrc.mov/embed", movie),
  },
];

const browseLabels = {
  "movie:new": ["Latest Movies", "New movie releases"],
  "movie:add": ["Recently Added Movies", "Freshly indexed movies"],
  "tv:new": ["Latest TV", "New TV releases"],
  "tv:add": ["Recently Added TV", "Freshly indexed shows"],
  "episode:latest": ["Latest Episodes", "Recently added episodes"],
};

const latestReleaseProviders = ["https://vidsrc.to", "https://vidsrc.fyi", "https://vidsrc.mov"];
const detailCache = new Map();
const fallbackBrowseLists = {
  "movie:new": [
    { imdbID: "tt16366836", Title: "Venom: The Last Dance", Year: "2024", Type: "movie" },
    { imdbID: "tt6263850", Title: "Deadpool & Wolverine", Year: "2024", Type: "movie" },
    { imdbID: "tt15239678", Title: "Dune: Part Two", Year: "2024", Type: "movie" },
    { imdbID: "tt11389872", Title: "Kingdom of the Planet of the Apes", Year: "2024", Type: "movie" },
    { imdbID: "tt12037194", Title: "Furiosa: A Mad Max Saga", Year: "2024", Type: "movie" },
    { imdbID: "tt14539740", Title: "Godzilla x Kong: The New Empire", Year: "2024", Type: "movie" },
  ],
  "movie:add": [
    { imdbID: "tt6718170", Title: "The Super Mario Bros. Movie", Year: "2023", Type: "movie" },
    { imdbID: "tt9362722", Title: "Spider-Man: Across the Spider-Verse", Year: "2023", Type: "movie" },
    { imdbID: "tt1517268", Title: "Barbie", Year: "2023", Type: "movie" },
    { imdbID: "tt15398776", Title: "Oppenheimer", Year: "2023", Type: "movie" },
    { imdbID: "tt1745960", Title: "Top Gun: Maverick", Year: "2022", Type: "movie" },
    { imdbID: "tt1877830", Title: "The Batman", Year: "2022", Type: "movie" },
  ],
  "tv:new": [
    { imdbID: "tt0944947", Title: "Game of Thrones", Year: "2011", Type: "tv" },
    { imdbID: "tt11198330", Title: "House of the Dragon", Year: "2022", Type: "tv" },
    { imdbID: "tt3581920", Title: "The Last of Us", Year: "2023", Type: "tv" },
    { imdbID: "tt11280740", Title: "Severance", Year: "2022", Type: "tv" },
    { imdbID: "tt13622776", Title: "The Bear", Year: "2022", Type: "tv" },
    { imdbID: "tt1405406", Title: "The Mandalorian", Year: "2019", Type: "tv" },
  ],
  "tv:add": [
    { imdbID: "tt4574334", Title: "Stranger Things", Year: "2016", Type: "tv" },
    { imdbID: "tt0903747", Title: "Breaking Bad", Year: "2008", Type: "tv" },
    { imdbID: "tt2861424", Title: "Rick and Morty", Year: "2013", Type: "tv" },
    { imdbID: "tt1190634", Title: "The Boys", Year: "2019", Type: "tv" },
    { imdbID: "tt3032476", Title: "Better Call Saul", Year: "2015", Type: "tv" },
    { imdbID: "tt7366338", Title: "Chernobyl", Year: "2019", Type: "tv" },
  ],
  "episode:latest": [
    { imdbID: "tt0944947", Title: "Game of Thrones S1 E1", Year: "2011", Type: "episode", Season: "1", Episode: "1" },
    { imdbID: "tt11198330", Title: "House of the Dragon S1 E1", Year: "2022", Type: "episode", Season: "1", Episode: "1" },
    { imdbID: "tt3581920", Title: "The Last of Us S1 E1", Year: "2023", Type: "episode", Season: "1", Episode: "1" },
    { imdbID: "tt11280740", Title: "Severance S1 E1", Year: "2022", Type: "episode", Season: "1", Episode: "1" },
    { imdbID: "tt13622776", Title: "The Bear S1 E1", Year: "2022", Type: "episode", Season: "1", Episode: "1" },
    { imdbID: "tt1405406", Title: "The Mandalorian S1 E1", Year: "2019", Type: "episode", Season: "1", Episode: "1" },
  ],
};

let lastResults = [];
let lastTitle = "Latest Releases";
let lastEyebrow = "New movie releases";
let activeBrowse = { contentType: "movie", listType: "new", page: 1 };
let lastMode = "browse";
let lastSearchQuery = "";
let isLoading = false;

function setStatus(message = "") {
  statusMessage.textContent = message;
}

function normalisePoster(poster) {
  return poster && poster !== "N/A" ? poster : placeholderPoster;
}

function setHeader(title, eyebrow = "Now showing") {
  titleElement.textContent = title;
  eyebrowElement.textContent = eyebrow;
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

function buildEmbedUrl(baseUrl, movie) {
  if (movie.Type === "episode" && movie.Season && movie.Episode) {
    return `${baseUrl}/tv/${movie.imdbID}/${movie.Season}/${movie.Episode}`;
  }

  return `${baseUrl}/${movie.Type === "movie" ? "movie" : "tv"}/${movie.imdbID}`;
}

function parseImdbId(movie) {
  return movie.imdbID || movie.imdb_id || movie.imdbId || movie.id;
}

function parseTitle(movie) {
  return movie.Title || movie.title || movie.name || movie.show_title || movie.episode_title || "Untitled";
}

function parseYear(movie) {
  const value = movie.Year || movie.year || movie.release_year || movie.released;
  const year = String(value || "").match(/\d{4}/);
  return year ? year[0] : "";
}

function parseEpisodeNumber(movie, key) {
  const value = movie[key] || movie[key.toLowerCase()] || movie[key.toUpperCase()];
  return value ? String(value) : "";
}

function normaliseMovie(movie, fallbackType) {
  const type = fallbackType === "episode" ? "episode" : fallbackType === "tv" ? "tv" : movie.Type || movie.type || "movie";

  return {
    imdbID: parseImdbId(movie),
    Title: parseTitle(movie),
    Year: parseYear(movie),
    Poster: normalisePoster(movie.Poster || movie.poster),
    Type: type === "series" ? "tv" : type,
    Season: parseEpisodeNumber(movie, "season") || parseEpisodeNumber(movie, "Season"),
    Episode: parseEpisodeNumber(movie, "episode") || parseEpisodeNumber(movie, "Episode"),
    Genre: movie.Genre || movie.genre || "",
    imdbRating: movie.imdbRating || movie.rating || "",
    Runtime: movie.Runtime || movie.runtime || "",
    Plot: movie.Plot || movie.plot || "",
  };
}

async function getOmdbDetails(movie) {
  if (!movie.imdbID || detailCache.has(movie.imdbID)) {
    return detailCache.get(movie.imdbID) || movie;
  }

  try {
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.imdbID}&plot=short`;
    const data = await fetchJson(url);

    if (data.Response === "False") {
      detailCache.set(movie.imdbID, movie);
      return movie;
    }

    const enriched = {
      ...movie,
      Title: data.Title || movie.Title,
      Year: data.Year || movie.Year,
      Poster: normalisePoster(data.Poster || movie.Poster),
      Genre: data.Genre || movie.Genre,
      imdbRating: data.imdbRating && data.imdbRating !== "N/A" ? data.imdbRating : movie.imdbRating,
      Runtime: data.Runtime && data.Runtime !== "N/A" ? data.Runtime : movie.Runtime,
      Plot: data.Plot && data.Plot !== "N/A" ? data.Plot : movie.Plot,
    };

    if (movie.Type === "episode") {
      enriched.Title = movie.Title;
      enriched.Type = "episode";
      enriched.Season = movie.Season;
      enriched.Episode = movie.Episode;
    }

    detailCache.set(movie.imdbID, enriched);
    return enriched;
  } catch (error) {
    console.warn("OMDb detail lookup failed", movie.imdbID, error);
    detailCache.set(movie.imdbID, movie);
    return movie;
  }
}

async function enrichMovies(movies) {
  return Promise.all(movies.filter((movie) => movie.imdbID).map(getOmdbDetails));
}

function filterAndSortMovies(movies) {
  const genre = genreSelect.value;
  const sortMode = sortSelect.value;

  let filtered = [...movies];

  if (genre) {
    filtered = filtered.filter((movie) =>
      String(movie.Genre || "")
        .toLowerCase()
        .split(",")
        .map((item) => item.trim())
        .includes(genre.toLowerCase())
    );
  }

  const yearNumber = (movie) => Number(String(movie.Year || "").match(/\d{4}/)?.[0] || 0);
  const ratingNumber = (movie) => Number(movie.imdbRating || 0);

  if (sortMode === "rating") {
    filtered.sort((a, b) => ratingNumber(b) - ratingNumber(a));
  } else if (sortMode === "year-desc") {
    filtered.sort((a, b) => yearNumber(b) - yearNumber(a));
  } else if (sortMode === "year-asc") {
    filtered.sort((a, b) => yearNumber(a) - yearNumber(b));
  } else if (sortMode === "title") {
    filtered.sort((a, b) => a.Title.localeCompare(b.Title));
  }

  return filtered;
}

async function getSearch(page = 1) {
  const searchValue = searchInput.value.trim();

  if (!searchValue) {
    return [];
  }

  const selectedType = typeSelect.value === "tv" ? "series" : "movie";
  const params = new URLSearchParams({
    apikey: apiKey,
    s: searchValue,
    type: selectedType,
    page: String(page),
  });

  if (yearInput.value.trim()) {
    params.set("y", yearInput.value.trim());
  }

  const data = await fetchJson(`https://www.omdbapi.com/?${params.toString()}`);

  if (data.Response === "False" || !Array.isArray(data.Search)) {
    return [];
  }

  const results = data.Search.map((movie) => normaliseMovie(movie, typeSelect.value));
  return enrichMovies(results);
}

function createCard(movie, index) {
  const button = document.createElement("button");
  button.className = "movie-card";
  button.type = "button";
  button.style.animationDelay = `${Math.min(index * 55, 420)}ms`;
  button.setAttribute("aria-label", `Play ${movie.Title}`);
  button.addEventListener("click", () => embedVideo(movie));

  const posterWrap = document.createElement("div");
  posterWrap.className = "poster-wrap";

  const poster = document.createElement("img");
  poster.src = normalisePoster(movie.Poster);
  poster.alt = `${movie.Title} poster`;
  poster.loading = "lazy";
  poster.onerror = () => {
    poster.src = placeholderPoster;
  };

  const meta = document.createElement("div");
  meta.className = "movie-meta";

  const type = document.createElement("span");
  type.className = "movie-type";
  type.textContent = movie.Type === "episode" ? "Episode" : movie.Type === "tv" ? "TV" : "Movie";

  const title = document.createElement("h3");
  title.className = "movie-title";
  title.textContent = movie.Year ? `${movie.Title} (${movie.Year})` : movie.Title;

  const detailLine = document.createElement("p");
  detailLine.className = "movie-detail-line";
  detailLine.textContent = [movie.Genre, movie.Runtime].filter(Boolean).join(" • ");

  posterWrap.appendChild(poster);

  if (movie.imdbRating) {
    const rating = document.createElement("span");
    rating.className = "rating-pill";
    rating.textContent = `IMDb ${movie.imdbRating}`;
    posterWrap.appendChild(rating);
  }

  meta.appendChild(type);
  meta.appendChild(title);
  if (detailLine.textContent) {
    meta.appendChild(detailLine);
  }
  button.appendChild(posterWrap);
  button.appendChild(meta);

  return button;
}

function renderCards(movieData, append = false) {
  if (!append) {
    cardsContainer.innerHTML = "";
    playerContainer.innerHTML = "";
    playerContainer.classList.remove("active");
    backButton.hidden = true;
    sourceControls.hidden = true;
    sourceControls.innerHTML = "";
  }

  const visibleMovies = filterAndSortMovies(movieData);

  if (!visibleMovies.length) {
    setStatus("No results matched those filters. Try another genre, year or category.");
    loadMoreButton.hidden = lastMode !== "browse" && lastMode !== "search";
    return;
  }

  setStatus("");
  const fragment = document.createDocumentFragment();
  visibleMovies.forEach((movie, index) => fragment.appendChild(createCard(movie, index)));
  cardsContainer.appendChild(fragment);
  loadMoreButton.hidden = false;
}

function embedVideo(movie) {
  cardsContainer.innerHTML = "";
  setStatus("");
  setHeader(movie.Title, movie.Type === "episode" ? "Playing episode" : movie.Type === "tv" ? "Playing TV show" : "Playing movie");
  backButton.hidden = false;
  loadMoreButton.hidden = true;
  sourceControls.hidden = false;
  sourceControls.innerHTML = "";

  embedSources.forEach((source, index) => {
    const sourceButton = document.createElement("button");
    sourceButton.type = "button";
    sourceButton.className = `btn btn-sm ${index === 0 ? "btn-info" : "btn-outline-light"}`;
    sourceButton.textContent = source.name;
    sourceButton.addEventListener("click", () => {
      document.querySelectorAll("#sourceControls .btn").forEach((button) => {
        button.className = "btn btn-sm btn-outline-light";
      });
      sourceButton.className = "btn btn-sm btn-info";
      loadPlayerFrame(movie, source);
    });
    sourceControls.appendChild(sourceButton);
  });

  loadPlayerFrame(movie, embedSources[0]);
  playerContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadPlayerFrame(movie, source) {
  const url = source.buildUrl(movie);
  const frameWrap = document.createElement("div");
  frameWrap.className = "video-frame-wrap";

  const frame = document.createElement("iframe");
  frame.src = url;
  frame.title = `${movie.Title} player via ${source.name}`;
  frame.allowFullscreen = true;
  frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";

  const fallback = document.createElement("div");
  fallback.className = "player-fallback";
  fallback.innerHTML = `
    <p>${source.name} may take a moment to load. If it stays blank, try another source or open it directly.</p>
    <a class="btn btn-outline-light btn-sm" href="${url}" target="_blank" rel="noopener noreferrer">Open source</a>
  `;

  frameWrap.appendChild(frame);
  frameWrap.appendChild(fallback);
  playerContainer.innerHTML = "";
  playerContainer.appendChild(frameWrap);
  playerContainer.classList.add("active");
}

function extractListItems(data) {
  if (Array.isArray(data?.result?.items)) return data.result.items;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data)) return data;

  return [];
}

async function fetchBrowseList(contentType, listType, page = 1) {
  const basePath = contentType === "episode" ? "/vapi/episode/latest" : `/vapi/${contentType}/${listType}`;
  const pathCandidates = page === 1 ? [basePath, `${basePath}/1`] : [`${basePath}/${page}`];

  for (const provider of latestReleaseProviders) {
    for (const path of pathCandidates) {
      try {
        const data = await fetchJson(`${provider}${path}`);
        const items = extractListItems(data);

        if (items.length) {
          const fallbackType = contentType === "episode" ? "episode" : contentType;
          return enrichMovies(items.map((movie) => normaliseMovie(movie, fallbackType)));
        }
      } catch (error) {
        console.warn(`Browse list failed from ${provider}${path}`, error);
      }
    }
  }

  return [];
}

async function getFallbackBrowseList(contentType, listType) {
  const key = `${contentType}:${listType}`;
  const fallbackItems = fallbackBrowseLists[key] || fallbackBrowseLists["movie:new"];
  return enrichMovies(fallbackItems.map((movie) => normaliseMovie(movie, movie.Type)));
}

async function loadBrowse(contentType = "movie", listType = "new", page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;
  lastMode = "browse";
  activeBrowse = { contentType, listType, page };

  const key = `${contentType}:${listType}`;
  const [title, eyebrow] = browseLabels[key] || browseLabels["movie:new"];
  setHeader(title, eyebrow);
  setStatus(append ? "Loading more..." : "Loading titles...");
  loadMoreButton.disabled = true;

  try {
    const movies = await fetchBrowseList(contentType, listType, page);
    const fallbackUsed = !movies.length && page === 1;
    const usableMovies = fallbackUsed ? await getFallbackBrowseList(contentType, listType) : movies;
    lastResults = append ? [...lastResults, ...usableMovies] : usableMovies;
    lastTitle = title;
    lastEyebrow = eyebrow;
    renderCards(lastResults);

    if (fallbackUsed) {
      setStatus("VidSrc's latest feed did not return results in the browser, so showing a fallback set. Search and playback still use live APIs.");
    }
  } catch (error) {
    console.error(error);
    const fallbackMovies = page === 1 ? await getFallbackBrowseList(contentType, listType) : [];
    lastResults = append ? [...lastResults, ...fallbackMovies] : fallbackMovies;
    renderCards(lastResults);
    setStatus("VidSrc's latest feed is unavailable in the browser, so showing a fallback set. Search and playback still use live APIs.");
  } finally {
    isLoading = false;
    loadMoreButton.disabled = false;
  }
}

async function handleSearch(event, page = 1, append = false) {
  event?.preventDefault();

  const query = searchInput.value.trim();

  if (!query) {
    searchInput.focus();
    setStatus("Type a title to search.");
    return;
  }

  if (isLoading) return;
  isLoading = true;
  lastMode = "search";
  lastSearchQuery = query;
  setHeader(`Results for "${query}"`, typeSelect.value === "tv" ? "TV search" : "Movie search");
  setStatus(append ? "Loading more results..." : "Searching...");
  loadMoreButton.disabled = true;

  try {
    const results = await getSearch(page);
    lastResults = append ? [...lastResults, ...results] : results;
    lastTitle = titleElement.textContent;
    lastEyebrow = eyebrowElement.textContent;
    activeBrowse.page = page;
    renderCards(lastResults);
  } catch (error) {
    console.error(error);
    setStatus("Something went wrong while searching. Please try again.");
    renderCards([]);
  } finally {
    isLoading = false;
    loadMoreButton.disabled = false;
  }
}

function setActiveBrowseButton(value) {
  browseButtons.forEach((button) => {
    button.className = `btn btn-sm ${button.dataset.browse === value ? "btn-info" : "btn-outline-light"}`;
  });
}

browseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const [contentType, listType] = button.dataset.browse.split(":");
    setActiveBrowseButton(button.dataset.browse);
    loadBrowse(contentType, listType, 1);
  });
});

backButton.addEventListener("click", () => {
  setHeader(lastTitle, lastEyebrow);
  renderCards(lastResults);
  window.scrollTo({ top: document.querySelector("main").offsetTop, behavior: "smooth" });
});

loadMoreButton.addEventListener("click", () => {
  const nextPage = activeBrowse.page + 1;

  if (lastMode === "search" && lastSearchQuery) {
    handleSearch(null, nextPage, true);
    return;
  }

  loadBrowse(activeBrowse.contentType, activeBrowse.listType, nextPage, true);
});

[genreSelect, sortSelect].forEach((element) => {
  element.addEventListener("change", () => {
    renderCards(lastResults);
  });
});

form.addEventListener("submit", (event) => handleSearch(event, 1));

window.addEventListener("load", () => {
  setActiveBrowseButton("movie:new");
  loadBrowse("movie", "new", 1);
});
