(function() {
  var OptionView, QuizCollection, QuizModel, QuizRouter, QuizView;

  QuizModel = Backbone.Model.extend({
    toggleState: function(state) {
      if (this.get("state") === state) state = void 0;
      return this.set({
        "state": state
      });
    }
  });

  QuizCollection = Backbone.Collection.extend({
    model: QuizModel,
    url: 'js/kanji-collection.json'
  });

  OptionView = Backbone.View.extend({
    events: {
      "click #shuffle": "shuffleQuestions",
      "click #first": "firstQuestion",
      "click #favorites": "changeStateDisplayed",
      "click #rights": "changeStateDisplayed",
      "click #wrongs": "changeStateDisplayed"
    },
    template: _.template($("#options-view-tmpl").html()),
    el: "#options",
    render: function() {
      return $(this.el).html(this.template());
    },
    shuffleQuestions: function() {
      return quizRouter.navigate("questions/shuffle", true);
    },
    firstQuestion: function() {
      return quizRouter.navigate("questions/first", true);
    },
    changeStateDisplayed: function() {
      var collection;
      collection = new QuizCollection;
      collection.reset(quizCollection.filter(function(model) {
        return ($("#favorites").is(":checked") && model.get("state") === "favorite") || ($("#rights").is(":checked") && model.get("state") === "right") || ($("#wrongs").is(":checked") && model.get("state") === "wrong") || model.get("state") === void 0;
      }));
      quizRouter.collection = collection;
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
      var el;
      this.question = parseInt(index - 1);
      if (this.quizView !== null) this.quizView.remove();
      this.quizView = new QuizView({
        model: this.collection.at(this.question)
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
