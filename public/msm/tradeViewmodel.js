var Card = function() {
    var self = this;

    self.Name = "";
    self.Set = "";
    self.Cost = 0;
};

var Set = function() {
    var self = this;

    self.Id = 0;
    self.Order = 0;
    self.Name = "";
};

var ViewModel = function() {
    var self = this;

    self.WantCards = ko.observableArray([]);
    self.TradeCards = ko.observableArray([]);
    self.Sets = ko.observableArray([]);
    self.CardFilter = ko.observable("");
    self.SetFilter = ko.observable("");
    self.CostFilter = ko.observable("");

    self.FilteredCards = ko.computed(function() {
        return ko.utils.arrayFilter(self.WantCards(), function(card) {
            return (card.Name.indexOf(self.CardFilter()) > -1
                    && (card.Set == self.SelectedSet().Name || self.SelectedSet().Id == 0));
                    //&& card.Cost.indexOf(self.CostFilter()) > -1);
        });
    });

    self.PurchaseTotal = ko.pureComputed(function() {
        var total = 0;
        var cards = self.TradeCards();

        for(var i = 0; i < cards.length; i++) {
            total += Number(cards[i].Cost);
        }

        return total;
    }, this);

    self.SelectedSet = ko.observable(new Set());

    // Methods
    self.Init = function() {
        self.GetSets();
    };

    self.SetWantCard = function(cardData) {
        var newCard = new Card();

        if (cardData) {
            newCard.Name = cardData.name;
            newCard.Set = cardData.set;
            newCard.Cost = cardData.cost.replace("$", "");
        }

        self.WantCards.push(newCard);
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
        self.TradeCards.push(card);
    };

    self.RemoveCard = function(card)
    {
        self.TradeCards.remove(card);
    };

    // API Methods
    self.GetWantCards = function() {
        $.ajax({
            url: "/msmWantCards",
            type: "GET",
            dataType: "json",
            success: function(data) {
                for(var i = 0; i < data.length; i ++){
                    self.SetWantCard(data[i]);
                }
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

                self.GetWantCards();
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
