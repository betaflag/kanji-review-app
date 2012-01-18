# This model represent a card from the quiz
# Attributes : niveau, prononciation, kanji, hint
# It also contains one state (favorite, right, wrong, undefined)
QuizModel = Backbone.Model.extend({
  initialize: -> this.set({"state": "normal"})

  # Set or remove a state
  toggleState: (state) ->
    state = undefined if this.get("state") == state
    this.set({"state": state})

  level: -> parseInt(this.get("niveau"))
})

# This collection is like a deck of cards. 
# It contains all the QuizModel. 
QuizCollection = Backbone.Collection.extend({
  model: QuizModel
  # URL of the json file containing all cards
  url: 'js/kanji-collection.json'

  levels: -> _.uniq(this.invoke('level')).sort((a, b) -> a - b)
})

# This view allows the user to set options
# for his review
OptionView = Backbone.View.extend({
  events: {
    "click #shuffle": "shuffleQuestions"
    "click #first": "firstQuestion"
    "click #favorite": "filterModels"
    "click #right": "filterModels"
    "click #wrong": "filterModels"
    "click #normal": "filterModels"
    "change #levels": "filterModels"
  }

  template: _.template($("#options-view-tmpl").html())

  el: "#options"

  render: -> $(this.el).html(this.template({ collection: quizRouter.collection }))

  # These actions only navigate to the correct route
  shuffleQuestions: -> quizRouter.shuffleQuestion()
  firstQuestion: -> quizRouter.firstQuestion()

  # This action update the deck (collection) when a state
  # display is changed. The user can select to state to display wihtin
  # his favorites, rigts and wrongs cards.
  filterModels: ->
    levels = _.map($("#levels option:selected"), (option) -> $(option).attr('value'))
    states = _.map($("#states input:checked"), (input) -> $(input).attr('id'))

    # Filter model to selected states
    models = _.filter(quizCollection.models, (model) ->
      model.get('niveau').toString() in levels &&
      model.get('state') in states
    )

    quizRouter.collection = new QuizCollection().reset(models)
    quizRouter.navigate("questions/first", true)
})

# This view show a card of the quiz. It shows the pronociation of the
# kanji and the user have to guess it. It also let him navigate through 
# the deck and mark cards as favorite, right and wrong state.
QuizView = Backbone.View.extend({
  initialize: ->
    # When the model state is changed, redraw the view
    this.options.model.bind("change:state", this.updateState, this)

  events: {
    "click #hint": "showHint"
    "click #answer": "showAnswer"
    "click #previous": "previousQuestion"
    "click #next": "nextQuestion"
    "click #favorite": "toggleFavorite"
    "click #right": "toggleRight"
    "click #wrong": "toggleWrong"
  }

  template: _.template($('#quiz-view-tmpl').html())

  render: ->
    $(this.el).html(this.template({
      model: this.model, 
      # Navigation variables
      quizIndex: quizRouter.question + 1, 
      quizLength: quizRouter.collection.length
    }))
    # When the template is rendered, we need to show his state
    this.updateState()
    return this.el

  # Update the view according to the model state
  updateState: ->
    # Remove classes of the prononciation section
    $(this.el).children("#deck").children("#prononciation").removeClass()
    # If state is setted, add it as a class
    if (this.model.get("state") != undefined)
      $(this.el).children("#deck").children("#prononciation").addClass(this.model.get("state"))

  # Show a hint for the kanji
  showHint: -> alert(this.model.get("hint"))
  # Show the answer (the kanji)
  showAnswer: -> alert(this.model.get("kanji"))
  # Navigate to the correct routes
  previousQuestion: -> quizRouter.previousQuestion()
  nextQuestion: -> quizRouter.nextQuestion()
  # Toggle for model states
  toggleFavorite: -> this.model.toggleState("favorite")
  toggleRight: -> this.model.toggleState("right")
  toggleWrong: -> this.model.toggleState("wrong")
})

# This is the main router of the application
# It allows the user to navigate through questions
QuizRouter = Backbone.Router.extend({
  initialize: (options) ->
    # initialize the router's collection
    this.collection = options.collection

  # The container to draw the quiz
  quizViewContainer: $('#quiz')
  # The rendered quizView
  quizView: null
  # The question as an index of the collection
  question: 1

  routes: {
    "": "startQuiz"
    "questions/shuffle": "shuffleQuestion"
    "questions/next": "nextQuestion"
    "questions/previous": "previousQuestion"
    "questions/first": "firstQuestion"
    "questions/last": "lastQuestion"
    "questions/redraw": "redrawQuestion"
    "questions/:index": "showQuestion"
  }

  # Start the quiz
  startQuiz: -> this.navigate("questions/1", true)
  # Show the first question
  firstQuestion: -> this.navigate("questions/1", true)
  # Show the last question
  lastQuestion: -> this.navigate("questions/" + this.collection.length, true)
  # Redraw the question
  redrawQuestion: -> this.navigate("questions/" + (this.question + 1), true)
  # Shuffle questions and rewind the deck
  shuffleQuestion: -> 
    this.collection.models = _.shuffle(quizCollection.models)
    this.navigate("questions/first", true)
  # Go to previous question
  previousQuestion: ->
    index = if this.question > 1 then this.question else 1
    this.navigate("questions/" + index , true)
  # Go to next question
  nextQuestion: ->
    index = if this.question < this.collection.length - 1 then this.question + 2 else this.collection.length
    this.navigate("questions/" + index, true)

  # Render the question
  showQuestion: (index) ->
    # Set the index so the router can remember it.
    # The index is 1 based instead of 0 based for the collection we need 
    # to substract 1.
    this.question = parseInt(index - 1)
    # Remove the old view and all it's bindings
    this.quizView.remove() if this.quizView != null
    # Render the new view with the new question
    model = if this.collection.length > 0 then this.collection.at(this.question) else new QuizModel
    this.quizView = new QuizView({ model: model })
    el = this.quizView.render()
    this.quizViewContainer.html(el)
})

$ ->
  # Load the data and start the quiz
  $.getJSON("js/kanji-collection.json", (data) -> 
    # Initialize the collection
    window.quizCollection = new QuizCollection
    # Set the json models (shuffled)
    quizCollection.reset(_.shuffle(data))
    # Initialize the router
    window.quizRouter = new QuizRouter({ collection: quizCollection })
    # Render the options
    new OptionView().render()
    # Start the application
    Backbone.history.start()
  )
