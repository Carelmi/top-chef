//var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var https = require('https')
var url = 'https://restaurant.michelin.fr/restaurants/france/restaurants-1-etoile-michelin/restaurants-2-etoiles-michelin/restaurants-3-etoiles-michelin/page-'
var url2= 'https://restaurant.michelin.fr'
var file = fs.createWriteStream('../Json/michelin.json')
var through = require('through2')
var fromArray = require('from2-array')
var temp = []
var pages = [];
var restoPageLinks = [];
const jsonFinal = []

for (let i = 1; i < 35; i++) {
  pages.push(i);
}
let i = 0;

getResto()

/*

 * First find out all the restaurant id of all the pages of the website
 * Then use the id tp geo to the url of each restaurant and find out more details
 * Recver for the  [name, city, zipcode, stars, 1 image] of each restaurant

 */


 //get the id
function getResto() {
  fromArray
    .obj(pages)
    .pipe(through.obj(fetchAndParse))
    .on('finish', () => getRestoInfos(restoPageLinks))
}

// get the additional informations
function getRestoInfos(restoPageLinks) {
  fromArray
   .obj(restoPageLinks)
   .pipe(through.obj(fetchAndParse2))
   .on('finish', () => file.write(JSON.stringify(jsonFinal)))
}



function fetchAndParse(buf, _, next) {
  i++
  https.get(url + i, req => {
    req.pipe(through.obj(parseId))
    next()
  });
}


function fetchAndParse2(link, _, next) {
  https.get(url2+link, req => {
    req.pipe(through.obj(parseDetails))
    next()
  });
}



// get resto Id
function parseId(buf, _, next) {
  const html = buf.toString()
  const $ = cheerio.load(html);

  $('.poi-card-link') ? $('.poi-card-link').each(function() { restoPageLinks.push($(this).attr('href')) }) : '';
  next();
}


// get resto Details
function parseDetails(buf, _, next) {
  const html = buf.toString()
  const $ = cheerio.load(html);
  const name =$('h1') ? $('h1').text().trim() : ''
  const locality= $('.locality') ? $('.locality').text() : ''
  const zipcode = $('.postal-code') ? $('.postal-code').text() : ''
  let ele = $('.guide').find('span').attr('class')
  const michelinStars = stars($('.guide').find('span').attr('class'));
  if(name.length && locality.length && zipcode.length) {
   jsonFinal.push({
     name, locality, zipcode, michelinStars
    })
   }
  next();
}

function stars(ele){
  switch (ele) {
    case 'guide-icon icon-mr icon-cotation1etoile':
        return 1;
      break;
    case 'guide-icon icon-mr icon-cotation2etoiles':
          return 2;
        break;

    case 'guide-icon icon-mr icon-cotation3etoiles':
          return 3;
        break;
 }
}
