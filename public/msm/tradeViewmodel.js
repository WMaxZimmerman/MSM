var Card = function() {
  var self = this;

  self.Name = "";
  self.Set = "";
  self.Cost = 0;
  self.TcgPrice = ko.observable(0);
};

var Set = function() {
  var self = this;

  self.Id = 0;
  self.Order = 0;
  self.Name = "";
};

var ViewModel = function() {
  var self = this;

  self.ShopCards = ko.observableArray([]);
  self.CustCards = ko.observableArray([]);
  self.Sets = ko.observableArray([]);
  self.CardFilter = ko.observable("");
  self.SetFilter = ko.observable("");
  self.CostFilter = ko.observable(0);
  self.SelectedOperator = ko.observable();

  self.Operators = ko.observableArray([]);

  self.FilteredCards = ko.computed(function() {
    return ko.utils.arrayFilter(self.ShopCards(), function(card) {
      return (card.Name.indexOf(self.CardFilter()) > -1
              && (card.Set == self.SelectedSet().Name || self.SelectedSet().Id == 0)
              && self.CompareCost(Number(card.Cost)));
    });
  });

  self.CompareCost = function(cardCost){
    var operator = self.SelectedOperator().name;
    var filterCost = Number(self.CostFilter());
    if (operator == ">="){
      return cardCost >= filterCost;
    } else {
      return cardCost <= filterCost;
    }
  };

  self.PurchaseTotal = ko.pureComputed(function() {
    var total = 0;
    var cards = self.CustCards();

    for(var i = 0; i < cards.length; i++) {
      total += Number(cards[i].Cost);
    }

    return total;
  }, this);

  self.SelectedSet = ko.observable(new Set());

  // Methods
  self.Init = function() {
    self.SetOperators();
    self.GetSets();
  };

  self.SetOperators = function(){
    self.Operators.push({ id: 0, name: ">=" });
    self.Operators.push({ id: 0, name: "<=" });
  };

  self.SetShopCard = function(cardData) {
    var newCard = new Card();

    if (cardData) {
      newCard.Name = cardData.name;
      newCard.Set = cardData.set;
      newCard.Cost = cardData.cost.replace("$", "");
    }

    self.ShopCards.push(newCard);
  };

  self.SetSet = function(setData) {
    var newSet = new Set();

    if (setData) {
      newSet.Id = setData.id;
      newSet.Order = setData.order;
      newSet.Name = setData.name;
    }

    self.Sets.push(newSet);
  };

  self.AddCard = function(card)
  {
    self.CustCards.push(card);
  };

  self.RemoveCard = function(card)
  {
    self.CustCards.remove(card);
  };

  // API Methods
  self.GetCardTcgPrice = function(givenCard) {
    var jsonData = {
      card: givenCard.Name.replace(/ /g, "-"),
      set: givenCard.Set.replace(/ /g, "-")
    };

    $.ajax({
      url: "/tcgCard",
      type: "POST",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(jsonData),
      success: function (data) {
        givenCard.TcgPrice(data.price);
      },
      error: function (request, error) {
        //alert("An error occured!");
      }
    });
  };

  self.GetShopCards = function() {
    $.ajax({
      url: "/msmWantCards",
      type: "GET",
      dataType: "json",
      success: function(data) {
        self.ProcessArray(data, self.SetShopCard, self.Done);
      },
      error: function(request, error) {
        alert(error.responseJSON.Message);
      }
    });
  };

  self.Done = function() {
    console.log("I finished");
  };

  self.GetSets = function() {
    var allSets = new Set();
    allSets.Id = 0;
    allSets.Order = -1;
    allSets.Name = "All";

    $.ajax({
      url: "/msmSets",
      type: "GET",
      dataType: "json",
      success: function(data) {
        self.Sets.push(allSets);
        for(var i = 0; i < data.length; i ++){
          self.SetSet(data[i]);
        }

        self.GetShopCards();
      },
      error: function(request, error) {
        alert(error.responseJSON.Message);
      }
    });
  };

  self.ProcessArray = function(data, handler, callback) {
    var maxtime = 100;         // chunk processing time
    var delay = 20;            // delay between processes
    var queue = data.concat(); // clone original array

    setTimeout(function() {

      var endtime = +new Date() + maxtime;

      do {
        handler(queue.shift());
      } while (queue.length > 0 && endtime > +new Date());

      if (queue.length > 0) {
        setTimeout(arguments.callee, delay);
      }
      else {
        if (callback) callback();
      }

    }, delay);
  };    // end of ProcessArray function

  self.Init();
};

$(document).ready(function () {
  ko.applyBindings(new ViewModel());
});
