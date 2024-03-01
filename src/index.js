import fetch from 'node-fetch';
import imdbId from 'imdb-id'
import "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
import { Button } from 'bootstrap';

const movieButton = document.getElementById('movieSearch')
movieButton.onclick = movieGet

window.onload = ios;

input.onfocus = function () {
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
}

function ios(){
  if((navigator.userAgent).match(/iPhone|iPod|iPad|Android/))
  {
    const n = document.getElementById('lc')
    const n1 = document.getElementById('new')
    n.className = 'btn-group-vertical d-flex justify-content-center mx-auto'
    n.role = 'group'
    const searchBtn = document.getElementById('movieSearch')
    searchBtn.addEventListener("click", clearinfobox);
    n.style.maxWidth = '85vw' 
    n1.className = 'd-flex justify-content-center mx-auto w-75 mt-4'
  }else
      {
        
        console.log('no')
      
      }
  }

  function clearinfobox(){

    const infoBox = document.getElementById('info')
    infoBox.innerHTML = ''


  }

function movieGet(){
  (async () =>  {
    const movieTitle = document.getElementById('movieInput').value
    try {
      const n = document.getElementById('lc')
      n.innerHTML = ''
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
    btn.style.display = 'inline-block'
    btn.style.color = '#17a5bb'
    btn.style.backgroundColor = '#fff'
    btn.style.borderColor = '#17a5bb'
    try{
    btn.onclick = function() {embedvideo(this.id)};
    }catch(err){

      alert(err + 'error with getting film/code please contact shaun.murphy@smurphy.uk')

    }
    divElement.appendChild(btn)
  }


function embedvideo(obj){
  clearhtml()
  const divElement = document.getElementById('lc1')
  const url = 'https://vidsrc.to/embed/movie/'
  const frame = document.createElement("iframe");
  frame.src = url + obj
  if((navigator.userAgent).match(/iPhone|iPod|iPad|Android/))
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

function clearhtml(){
    const generated_buttons = document.getElementById('lc')
    const search = document.getElementById('new')
    const video_player = document.getElementById('lc1')
    const info = document.getElementById('info')
    generated_buttons.innerHTML = ''
    search.innerHTML = ''
    video_player.innerHTML = ''
    info.innerHTML = ''
    search.className = 'd-flex justify-content-center mx-auto w-50 mt-1'
    generated_buttons.className = 'd-flex justify-content-center'

}