const apiKey = "3d62b472";
const placeholderPoster = "./placeholder.png";

const form = document.getElementById("searchForm");
const searchInput = document.getElementById("movieSearch");
const yearInput = document.getElementById("yearFilter");
const typeSelect = document.getElementById("choice");
const genreSelect = document.getElementById("genreFilter");
const sortSelect = document.getElementById("sortFilter");
const subtitleUrlInput = document.getElementById("subtitleUrl");
const subtitleLangInput = document.getElementById("subtitleLang");
const seasonInput = document.getElementById("seasonNumber");
const episodeInput = document.getElementById("episodeNumber");
const autoplayToggle = document.getElementById("autoplayToggle");
const autonextToggle = document.getElementById("autonextToggle");
const cardsContainer = document.getElementById("movieCards");
const playerContainer = document.getElementById("moviePlayer");
const titleElement = document.getElementById("latestHeader");
const eyebrowElement = document.getElementById("eyebrow");
const statusMessage = document.getElementById("statusMessage");
const backButton = document.getElementById("backToResults");
const sourceControls = document.getElementById("sourceControls");
const loadMoreButton = document.getElementById("loadMoreBtn");
const browseButtons = document.querySelectorAll("[data-browse]");

const vsembedDomains = ["https://vidsrc-embed.ru", "https://vidsrc-embed.su", "https://vidsrcme.su", "https://vsrc.su"];
const embedSources = vsembedDomains.map((domain) => ({
  name: new URL(domain).hostname,
  buildUrl: (movie) => buildVsembedEmbedUrl(domain, movie),
}));

const browseLabels = {
  "movie:latest": ["Latest Movies", "Recently added movies"],
  "tv:latest": ["Latest TV Shows", "Recently added TV shows"],
  "episode:latest": ["Latest Episodes", "Recently added episodes"],
};

const latestReleaseProviders = [...vsembedDomains];
const detailCache = new Map();
const fallbackBrowseLists = {
  "movie:latest": [
    { imdbID: "tt16366836", Title: "Venom: The Last Dance", Year: "2024", Type: "movie" },
    { imdbID: "tt6263850", Title: "Deadpool & Wolverine", Year: "2024", Type: "movie" },
    { imdbID: "tt15239678", Title: "Dune: Part Two", Year: "2024", Type: "movie" },
    { imdbID: "tt11389872", Title: "Kingdom of the Planet of the Apes", Year: "2024", Type: "movie" },
    { imdbID: "tt12037194", Title: "Furiosa: A Mad Max Saga", Year: "2024", Type: "movie" },
    { imdbID: "tt14539740", Title: "Godzilla x Kong: The New Empire", Year: "2024", Type: "movie" },
  ],
  "tv:latest": [
    { imdbID: "tt0944947", Title: "Game of Thrones", Year: "2011", Type: "tv" },
    { imdbID: "tt11198330", Title: "House of the Dragon", Year: "2022", Type: "tv" },
    { imdbID: "tt3581920", Title: "The Last of Us", Year: "2023", Type: "tv" },
    { imdbID: "tt11280740", Title: "Severance", Year: "2022", Type: "tv" },
    { imdbID: "tt13622776", Title: "The Bear", Year: "2022", Type: "tv" },
    { imdbID: "tt1405406", Title: "The Mandalorian", Year: "2019", Type: "tv" },
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
let activeBrowse = { contentType: "movie", listType: "latest", page: 1 };
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

function getMediaId(movie) {
  return movie.tmdbID || movie.imdbID;
}

function getEpisodeParts(movie) {
  return {
    season: movie.Season || seasonInput.value.trim(),
    episode: movie.Episode || episodeInput.value.trim(),
  };
}

function buildVsembedEmbedUrl(domain, movie) {
  const mediaId = getMediaId(movie);
  const { season, episode } = getEpisodeParts(movie);
  const shouldLoadEpisode = movie.Type === "episode" || (season && episode);
  const encodedId = encodeURIComponent(mediaId);
  const params = new URLSearchParams();

  if (subtitleLangInput.value.trim()) {
    params.set("ds_lang", subtitleLangInput.value.trim());
  }

  if (subtitleUrlInput.value.trim() && (movie.Type === "movie" || shouldLoadEpisode)) {
    params.set("sub_url", subtitleUrlInput.value.trim());
  }

  if (movie.Type === "movie" || shouldLoadEpisode) {
    params.set("autoplay", autoplayToggle.checked ? "1" : "0");
  }

  if (shouldLoadEpisode) {
    params.set("autonext", autonextToggle.checked ? "1" : "0");
  }

  let url = movie.Type === "movie" ? `${domain}/embed/movie/${encodedId}` : `${domain}/embed/tv/${encodedId}`;

  if (shouldLoadEpisode && season && episode) {
    url = `${domain}/embed/tv/${encodedId}/${encodeURIComponent(season)}-${encodeURIComponent(episode)}`;
  }

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

function parseImdbId(movie) {
  const id = movie.imdbID || movie.imdb_id || movie.imdbId || movie.imdb || movie.id;
  return String(id || "").startsWith("tt") ? String(id) : "";
}

function parseTmdbId(movie) {
  const id = movie.tmdbID || movie.tmdb_id || movie.tmdbId || movie.tmdb || movie.id;
  return id && !String(id).startsWith("tt") ? String(id) : "";
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
    tmdbID: parseTmdbId(movie),
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
    Actors: movie.Actors || movie.actors || "",
    Director: movie.Director || movie.director || "",
    Writer: movie.Writer || movie.writer || "",
    Rated: movie.Rated || movie.rated || "",
    Released: movie.Released || movie.released || "",
    Language: movie.Language || movie.language || "",
    Country: movie.Country || movie.country || "",
    Awards: movie.Awards || movie.awards || "",
    totalSeasons: movie.totalSeasons || movie.seasons || "",
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
      Actors: data.Actors && data.Actors !== "N/A" ? data.Actors : movie.Actors,
      Director: data.Director && data.Director !== "N/A" ? data.Director : movie.Director,
      Writer: data.Writer && data.Writer !== "N/A" ? data.Writer : movie.Writer,
      Rated: data.Rated && data.Rated !== "N/A" ? data.Rated : movie.Rated,
      Released: data.Released && data.Released !== "N/A" ? data.Released : movie.Released,
      Language: data.Language && data.Language !== "N/A" ? data.Language : movie.Language,
      Country: data.Country && data.Country !== "N/A" ? data.Country : movie.Country,
      Awards: data.Awards && data.Awards !== "N/A" ? data.Awards : movie.Awards,
      totalSeasons: data.totalSeasons && data.totalSeasons !== "N/A" ? data.totalSeasons : movie.totalSeasons,
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
  return Promise.all(movies.filter((movie) => getMediaId(movie)).map(getOmdbDetails));
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

  if (/^(tt\d+|\d+)$/.test(searchValue)) {
    const isTmdb = /^\d+$/.test(searchValue);
    const isEpisode = typeSelect.value === "tv" && seasonInput.value.trim() && episodeInput.value.trim();
    const directMovie = normaliseMovie(
      {
        imdbID: isTmdb ? "" : searchValue,
        tmdbID: isTmdb ? searchValue : "",
        Title: `${isTmdb ? "TMDB" : "IMDb"} ${searchValue}`,
        Type: isEpisode ? "episode" : typeSelect.value,
        Season: seasonInput.value.trim(),
        Episode: episodeInput.value.trim(),
      },
      isEpisode ? "episode" : typeSelect.value,
    );

    return enrichMovies([directMovie]);
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
    playerContainer.style.removeProperty("--player-backdrop");
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

function createMetaPill(label, value) {
  if (!value) return null;

  const pill = document.createElement("span");
  pill.className = "meta-pill";
  pill.textContent = label ? `${label} ${value}` : value;
  return pill;
}

function createInfoRow(label, value) {
  if (!value) return null;

  const row = document.createElement("div");
  row.className = "info-row";

  const term = document.createElement("dt");
  term.textContent = label;

  const detail = document.createElement("dd");
  detail.textContent = value;

  row.appendChild(term);
  row.appendChild(detail);
  return row;
}

function createPlayerInfo(movie) {
  const info = document.createElement("article");
  info.className = "player-info";

  const poster = document.createElement("img");
  poster.className = "player-poster";
  poster.src = normalisePoster(movie.Poster);
  poster.alt = `${movie.Title} poster`;
  poster.onerror = () => {
    poster.src = placeholderPoster;
  };

  const body = document.createElement("div");
  body.className = "player-info-body";

  const type = document.createElement("p");
  type.className = "kicker mb-2";
  type.textContent = movie.Type === "episode" ? "Episode details" : movie.Type === "tv" ? "TV show details" : "Film details";

  const title = document.createElement("h3");
  title.textContent = movie.Title;

  const meta = document.createElement("div");
  meta.className = "player-meta";
  [
    createMetaPill("", movie.Year),
    createMetaPill("", movie.Rated),
    createMetaPill("", movie.Runtime),
    createMetaPill("IMDb", movie.imdbRating),
    movie.Type === "episode" && movie.Season && movie.Episode ? createMetaPill("", `S${movie.Season} E${movie.Episode}`) : null,
    movie.Type === "tv" ? createMetaPill("Seasons", movie.totalSeasons) : null,
  ]
    .filter(Boolean)
    .forEach((pill) => meta.appendChild(pill));

  const plot = document.createElement("p");
  plot.className = "player-plot";
  plot.textContent = movie.Plot || "No description is available for this title yet.";

  const facts = document.createElement("dl");
  facts.className = "info-list";
  [
    createInfoRow("Cast", movie.Actors),
    createInfoRow("Director", movie.Director),
    createInfoRow("Writer", movie.Writer),
    createInfoRow("Genre", movie.Genre),
    createInfoRow("Released", movie.Released),
    createInfoRow("Language", movie.Language),
    createInfoRow("Country", movie.Country),
    createInfoRow("Awards", movie.Awards),
  ]
    .filter(Boolean)
    .forEach((row) => facts.appendChild(row));

  body.appendChild(type);
  body.appendChild(title);
  if (meta.children.length) {
    body.appendChild(meta);
  }
  body.appendChild(plot);
  if (facts.children.length) {
    body.appendChild(facts);
  }

  info.appendChild(poster);
  info.appendChild(body);
  return info;
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
  playerContainer.style.setProperty("--player-backdrop", `url("${normalisePoster(movie.Poster)}")`);
  playerContainer.appendChild(frameWrap);
  playerContainer.appendChild(createPlayerInfo(movie));
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
  const feedPath =
    contentType === "episode"
      ? `/episodes/latest/page-${page}.json`
      : contentType === "tv"
        ? `/tvshows/latest/page-${page}.json`
        : `/movies/latest/page-${page}.json`;

  for (const provider of latestReleaseProviders) {
    try {
      const data = await fetchJson(`${provider}${feedPath}`);
      const items = extractListItems(data);

      if (items.length) {
        const fallbackType = contentType === "episode" ? "episode" : contentType;
        return enrichMovies(items.map((movie) => normaliseMovie(movie, fallbackType)));
      }
    } catch (error) {
      console.warn(`Browse list failed from ${provider}${feedPath}`, error);
    }
  }

  return [];
}

async function getFallbackBrowseList(contentType, listType) {
  const key = `${contentType}:${listType}`;
  const fallbackItems = fallbackBrowseLists[key] || fallbackBrowseLists["movie:latest"];
  return enrichMovies(fallbackItems.map((movie) => normaliseMovie(movie, movie.Type)));
}

async function loadBrowse(contentType = "movie", listType = "latest", page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;
  lastMode = "browse";
  activeBrowse = { contentType, listType, page };

  const key = `${contentType}:${listType}`;
  const [title, eyebrow] = browseLabels[key] || browseLabels["movie:latest"];
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
  setActiveBrowseButton("movie:latest");
  loadBrowse("movie", "latest", 1);
});
