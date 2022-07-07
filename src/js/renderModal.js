import MovieApiService from './MovieApiService';
import { loadAnimationAction } from './renderTrendingPage';
import { refs } from './refs';
import * as basicLightbox from 'basiclightbox';
import { Notify } from 'notiflix/build/notiflix-notify-aio';

const movieApiService = new MovieApiService();

const lightBoxOptions = {
  onShow: function (instance) {
    instance.element().querySelector('.close-modal').onclick = instance.close;
  },
  onClose: () => {
    window.removeEventListener('keydown', keydownHandler);
  },
};

let modal; //собственно будущая модалка

refs.mainMarkup.addEventListener('click', onMovieCardClick);

export async function onMovieCardClick(e) {
  e.preventDefault();
  const movieId = e.path.find(el => el.className === 'movie-card').id; //get movie ID
  loadAnimationAction.classList.remove('is-hiden'); //loader animation switched-on
  const movieData = await movieApiService.getMovieById(movieId); //get from srver movie info
  const movieDatavideo = await movieApiService.getMovieByIdvideos(movieId);
  const videoId = movieDatavideo.results.find(el =>
    el.name.includes('Trailer')
  ).key;
  const modalMarkup = itemMarkup(movieData, videoId); // create markup
  modal = basicLightbox.create(modalMarkup, lightBoxOptions); //create modal window//
  modalShow();
  handleButtons();
  loadAnimationAction.classList.add('is-hiden'); //loader animation switched-off
}

function modalShow() {
  modal.show(); //show modal window
  window.addEventListener('keydown', keydownHandler);
}

function keydownHandler(e) {
  if (e.code === 'Escape') {
    modal.close();
  }
}

function genresToString(genres) {
  let arr = [];
  genres.forEach(el => {
    arr.push(el.name);
  });
  return arr.join(', ');
}

export function itemMarkup(
  {
    id,
    poster_path,
    title,
    vote_average,
    vote_count,
    popularity,
    original_title,
    genres,
    overview,
  },
  videoId
) {
  return `
  <div class='modal'>
  <button class="close-modal"></button>
  <section class="modal-rendered">
    <div class="card-div"
      ><img
        class="movie-poster"
        src="https://image.tmdb.org/t/p/w500/${poster_path}"
        alt="${title}"
        loading="lazy"
        data-video='${videoId}'
    /></div>

    <div class="info-modal">
      <h2 class="card-title">${title.toUpperCase()}</h2>
      
      <table class="info-block">
        <tbody>
          <tr>
            <td class="list-keys">Vote / Votes</td>
            <td class="list-values">
              <span class="vote-span">${vote_average.toFixed(
                1
              )}</span> / ${vote_count}
            </td>
          </tr>
          <tr>
            <td class="list-keys">Popularity</td>
            <td class="list-values">${popularity.toFixed(1)}</td>
          </tr>
          <tr>
            <td class="list-keys">Original Title</td>
            <td class="list-values">${original_title.toUpperCase()}</td>
          </tr>
          <tr>
            <td class="list-keys">Genres</td>
            <td class="list-values">${genresToString(genres)}</td>
          </tr>
        </tbody>
      </table>

      <p class="info-about">About</p>
      <p class="info-overview">${overview}</p>
      <div class="buttons">
        <button class="button-watched" data-movieId='${id}'>Add to watched</button>
        <button class="button-queue" data-movieId='${id}'>Add to queue</button>
      </div>
    </div>
  </section>
  </div>`;
}

function handleButtons() {
  document
    .querySelector('.button-watched')
    .addEventListener('click', addToWatched);
  document.querySelector('.button-queue').addEventListener('click', addToQueue);
  document
    .querySelector('.movie-poster')
    .addEventListener('click', onPosterClick);
}

function onPosterClick(e) {
  e.preventDefault();
  const player = basicLightbox.create(`
    <iframe src="https://www.youtube.com/embed/${e.target.dataset.video}" width="80%" height="70%" frameborder="0"></iframe>
`);
  player.show();
}

function addToWatched(e) {
  addToStorage(e, 'watched');
}

function addToQueue(e) {
  addToStorage(e, 'queue');
}

function addToStorage(event, key) {
  let arr =
    localStorage.getItem(key) !== null
      ? JSON.parse(localStorage.getItem(key))
      : [];
  if (arr.includes(event.target.dataset.movieid)) {
    Notify.failure('The movie has been already added');
  } else {
    arr.push(event.target.dataset.movieid);
    localStorage.setItem(key, JSON.stringify(arr));
    Notify.success(`The movie successfully has been added to ${key}`);
  }
}