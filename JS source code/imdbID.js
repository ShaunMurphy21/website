const fetch = require('node-fetch')
const cheerio = require('cheerio');

const imdbId = async function (title) {
  const url = `https://corsproxy.io/?https://www.imdb.com/find/?s=all&q=${encodeURIComponent(title)}`;
  const datalist = []
  const body = await fetch(url).then(res => res.text());

  const $ = cheerio.load(body);
  const movieLink = $("#__next > main > div.ipc-page-content-container.ipc-page-content-container--full.sc-c2d23b21-0.jUDJkt > div.ipc-page-content-container.ipc-page-content-container--center > section > div > div.ipc-page-grid__item.ipc-page-grid__item--span-2 > section:nth-child(3) > div.sc-17bafbdb-2.iUyFfD > ul")
 

  const listElements = movieLink;

// Iterate through each list element
  listElements.each(function(i, element) {
  // Find all child anchor (`a`) elements within the current list element
    const anchorElements = $(this).find('a');

    // Iterate through each anchor element and extract the `href` attribute
    anchorElements.each(function(j, anchor) {
      const href = $(this).attr('href');
      const nregex = /\/title\/(t{2}\d+)\/?/;
      const [,id] = nregex.exec(href)
      datalist.push([[$(this).text()], [id]])
 
    });
  });



  if (!movieLink) throw new Error('Movie not found');
  return datalist; //outputs imdbID
}


module.exports = imdbId;