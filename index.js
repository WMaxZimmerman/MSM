var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var app = express();
app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

var bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res) {
  res.render('pages/index');
});

app.get('/mainstreetmagic', function(req, res) {
  res.render('pages/mainstreetmagic');
});

app.get('/msmWantCards', function(req, res){
  //Web SCrapping done here
  var url = 'http://www.msmmm.com/wantlist';

  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);

      var content = $('.view-content');
      var children = content.children();
      var sets = content.find('h3');
      var tables = content.find('table');
      var setsLength = sets.length;
      var tablesLength = tables.length;
      var cards = [];

      for(var i = 0; i < setsLength; i++){
        var setName = $(sets[i]).text();
        var rows = $(tables[i]).find('tr');
        var rowLength = rows.length;

        for(var j = 0; j < rowLength; j++){
          var cols = $(rows[j]).find('td');
          var colLength = cols.length;

          for(var x = 0; x < colLength; x++){
            var cardName = $(cols[x]).children().first().children().first().text();
            var cardCost = $(cols[x]).children().last().children().first().text();

            cards.push({ name: cardName, set: setName, cost: cardCost });
          }
        }
      }

      res.send(JSON.stringify(cards));
    }
  });
});

app.get('/msmSets', function(req, res){
  //Web SCrapping done here
  var url = 'http://www.msmmm.com/pricelist';

  request(url, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);
      var content = $('#edit-field-magic-setname-nid');
      var sets = content.find('option');
      var setsLength = sets.length;
      var setList = [];

      for(var i = 0; i < setsLength; i++){
        var setName = $(sets[i]).text();
        var setId = $(sets[i]).val();
        setList.push({ id: setId, order: i, name: setName });
      }

      res.send(JSON.stringify(setList));
    }
  });
});

app.post('/tcgCard', function(req, res) {
  var setName = req.body.set;
  var cardName = req.body.card;
  var url = 'https://shop.tcgplayer.com/magic/' + setName + '/' + cardName;

  console.log(url);

  request(url, function(error, response, html){
    if(!error){
      function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
          if ((new Date().getTime() - start) > milliseconds){
            break;
          }
        }
      }

      var $ = cheerio.load(html);
      var cardPrice = $('.price-point__data').first().text();
      console.log(JSON.stringify(cardPrice));

      var returnCard = { name: cardName, price: cardPrice };
      res.send(JSON.stringify(returnCard));
    }
  });
});

app.post('/msmPriceCards', function(req, res) {
  var setId = req.body.id;
  var url = 'http://www.msmmm.com/pricelist';
  var cardList = [];

  var queryString = '?field_magic_color_nid_op=in'
        + '&field_magic_price_value_op=%3D'
        + '&field_magic_price_value%5Bvalue%5D='
        + '&field_magic_price_value%5Bmin%5D='
        + '&field_magic_price_value%5Bmax%5D='
        + '&field_magic_rarity_value_op=or'
        + '&field_magic_setname_nid_op=in'
        + '&field_magic_setname_nid%5B%5D=' + setId
        + '&title='
        + '&items_per_page=200';

  var urlString = url + queryString;
  console.log(urlString);

  request(urlString, function(error, response, html){
    if(!error){
      var $ = cheerio.load(html);

      var content = $('.views-table');
      var cards = content.find('tr');
      var cardsLength = cards.length;

      for(var y = 0; y < cardsLength; y++){
        var cols = $(cards[y]).find('td');
        var colLength = cols.length;

        var cardName = $(cols[0]).text().replace(/\r?\n|\r/, "").trim();
        var cardColor = $(cols[1]).text().replace(/\r?\n|\r/, "").trim();
        var cardCost = $(cols[2]).text().replace(/\r?\n|\r/, "").trim();
        var cardRarity = $(cols[3]).text().replace(/\r?\n|\r/, "").trim();
        var cardSet = $(cols[4]).text().replace(/\r?\n|\r/, "").trim();
        var cardWantList = $(cols[5]).text().replace(/\r?\n|\r/, "").trim();

        if (cardSet != ""){
          var card = { name: cardName, color: cardColor, cost: cardCost, rarity: cardRarity, set: cardSet, wantList: cardWantList };
          console.log(JSON.stringify(card));

          cardList.push(card);
        }
      }

      res.send(JSON.stringify(cardList));
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
