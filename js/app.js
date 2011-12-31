(function() {
  var OptionView, QuizCollection, QuizModel, QuizRouter, QuizView,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  QuizModel = Backbone.Model.extend({
    initialize: function() {
      return this.set({
        "state": "normal"
      });
    },
    toggleState: function(state) {
      if (this.get("state") === state) state = void 0;
      return this.set({
        "state": state
      });
    }
  });

  QuizCollection = Backbone.Collection.extend({
    model: QuizModel,
    url: 'js/kanji-collection.json',
    levels: function() {
      return _.uniq(this.invoke('get', 'niveau')).sort();
    }
  });

  OptionView = Backbone.View.extend({
    events: {
      "click #shuffle": "shuffleQuestions",
      "click #first": "firstQuestion",
      "click #favorite": "filterModels",
      "click #right": "filterModels",
      "click #wrong": "filterModels",
      "click #normal": "filterModels",
      "change #levels": "filterModels"
    },
    template: _.template($("#options-view-tmpl").html()),
    el: "#options",
    render: function() {
      return $(this.el).html(this.template({
        collection: quizRouter.collection
      }));
    },
    shuffleQuestions: function() {
      return quizRouter.navigate("questions/shuffle", true);
    },
    firstQuestion: function() {
      return quizRouter.navigate("questions/first", true);
    },
    filterModels: function() {
      var levels, models, states;
      levels = _.map($("#levels option:selected"), function(option) {
        return $(option).attr('value');
      });
      states = _.map($("#states input:checked"), function(input) {
        return $(input).attr('id');
      });
      models = _.filter(quizCollection.models, function(model) {
        var _ref, _ref2;
        return (_ref = model.get('niveau').toString(), __indexOf.call(levels, _ref) >= 0) && (_ref2 = model.get('state'), __indexOf.call(states, _ref2) >= 0);
      });
      quizRouter.collection = new QuizCollection().reset(models);
      return quizRouter.navigate("questions/redraw", true);
    }
  });

  QuizView = Backbone.View.extend({
    initialize: function() {
      return this.options.model.bind("change:state", this.updateState, this);
    },
    events: {
      "click #hint": "showHint",
      "click #answer": "showAnswer",
      "click #previous": "previousQuestion",
      "click #next": "nextQuestion",
      "click #last": "lastQuestion",
      "click #favorite": "toggleFavorite",
      "click #right": "toggleRight",
      "click #wrong": "toggleWrong",
      "click #hide": "hideQuestion"
    },
    template: _.template($('#quiz-view-tmpl').html()),
    render: function() {
      $(this.el).html(this.template({
        model: this.model,
        quizIndex: quizRouter.question + 1,
        quizLength: quizRouter.collection.length
      }));
      this.updateState();
      return this.el;
    },
    hideQuestion: function() {
      quizCollection.remove(this.model);
      return quizRouter.navigate("questions/redraw", true);
    },
    updateState: function() {
      $(this.el).children("#deck").children("#prononciation").removeClass();
      if (this.model.get("state") !== void 0) {
        return $(this.el).children("#deck").children("#prononciation").addClass(this.model.get("state"));
      }
    },
    showHint: function() {
      return alert(this.model.get("hint"));
    },
    showAnswer: function() {
      return alert(this.model.get("kanji"));
    },
    previousQuestion: function() {
      return quizRouter.navigate("questions/previous", true);
    },
    nextQuestion: function() {
      return quizRouter.navigate("questions/next", true);
    },
    lastQuestion: function() {
      return quizRouter.navigate("questions/last", true);
    },
    toggleFavorite: function() {
      return this.model.toggleState("favorite");
    },
    toggleRight: function() {
      return this.model.toggleState("right");
    },
    toggleWrong: function() {
      return this.model.toggleState("wrong");
    }
  });

  QuizRouter = Backbone.Router.extend({
    initialize: function(options) {
      return this.collection = options.collection;
    },
    quizViewContainer: $('#quiz'),
    quizView: null,
    question: 1,
    routes: {
      "": "startQuiz",
      "questions/shuffle": "shuffleQuestion",
      "questions/next": "nextQuestion",
      "questions/previous": "previousQuestion",
      "questions/first": "firstQuestion",
      "questions/last": "lastQuestion",
      "questions/redraw": "redrawQuestion",
      "questions/:index": "showQuestion"
    },
    startQuiz: function() {
      return this.navigate("questions/1", true);
    },
    firstQuestion: function() {
      return this.navigate("questions/1", true);
    },
    lastQuestion: function() {
      return this.navigate("questions/" + this.collection.length, true);
    },
    redrawQuestion: function() {
      return this.navigate("questions/" + (this.question + 1), true);
    },
    shuffleQuestion: function() {
      this.collection.models = _.shuffle(quizCollection.models);
      return this.navigate("questions/first", true);
    },
    previousQuestion: function() {
      var index;
      index = this.question > 1 ? this.question : 1;
      return this.navigate("questions/" + index, true);
    },
    nextQuestion: function() {
      var index;
      index = this.question < this.collection.length - 1 ? this.question + 2 : this.collection.length;
      return this.navigate("questions/" + index, true);
    },
    showQuestion: function(index) {
      var el, model;
      this.question = parseInt(index - 1);
      if (this.quizView !== null) this.quizView.remove();
      model = this.collection.length > 0 ? this.collection.at(this.question) : new QuizModel;
      this.quizView = new QuizView({
        model: model
      });
      el = this.quizView.render();
      return this.quizViewContainer.html(el);
    }
  });

  $(function() {
    return $.getJSON("js/kanji-collection.json", function(data) {
      window.quizCollection = new QuizCollection;
      quizCollection.reset(_.shuffle(data));
      window.quizRouter = new QuizRouter({
        collection: quizCollection
      });
      new OptionView().render();
      return Backbone.history.start();
    });
  });

}).call(this);
