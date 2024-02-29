import fetch from 'node-fetch';
import imdbId from 'imdb-id'
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"

const movieButton = document.getElementById('movieSearch')
movieButton.onclick = movieGet

window.onload = ios;


function ios(){
  if((navigator.userAgent).match(/iPhone|iPod|iPad/))
  {
    const n = document.getElementById('lc')
    n.className = 'btn-group-vertical d-flex justify-content-center mx-auto'
    n.role = 'group'
    n.style.maxWidth = '85vw'
  }else
      {
        
        console.log('no')
      
      }
  }


function movieGet(){
  (async () =>  {
    const movieTitle = document.getElementById('movieInput').value
    try {
      const n = document.getElementById('lc')
      n.innerHTML = ''
      const divElement = document.getElementById('lc1')
      divElement.innerHTML = ''
      let id = await imdbId(movieTitle);
      id.forEach(myFunction);
    } catch (e) {
      console.error('Error :', e)
    }
  })();}





function myFunction(item, i, nlist) {
 
    const divElement = document.getElementById('lc')
    const btn = document.createElement("button");
    btn.innerHTML = nlist[i][0][0];
    btn.id = nlist[i][1][0]
    btn.className = 'btn btn-outline-primary m-1';
    //btn.type = 'button'
    btn.style.display = 'inline-block'
    btn.style.color = '#17a5bb'
    btn.style.backgroundColor = '#fff'
    btn.style.borderColor = '#17a5bb'
    btn.onclick = function() {embedvideo(this.id)};
    divElement.appendChild(btn)
  }


function embedvideo(obj){
  const n = document.getElementById('lc')
  const clearSearch = document.getElementById('new')
  clearSearch.className = 'd-flex justify-content-center mx-auto w-50 mt-1'
  const divElement = document.getElementById('lc1')
  divElement.innerHTML = ''
  clearSearch.innerHTML = ''
  n.innerHTML = ''
  const url = 'https://vidsrc.to/embed/movie/'
  const frame = document.createElement("iframe");
  frame.src = url + obj
  if((navigator.userAgent).match(/iPhone|iPod|iPad/))
  {
  frame.id = 'videoPlaying'
  frame.allowFullscreen = true
  divElement.appendChild(frame)
  
  }else{

    frame.id = 'desktopPlaying'
    frame.allowFullscreen = true
    divElement.appendChild(frame)


  }
}