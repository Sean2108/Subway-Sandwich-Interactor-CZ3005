// capitalise first letter of word
function capitaliseWord(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

// capitalise first letter of each word in a phrase
function capitalisePhrase(phrase) {
    return phrase.split("_").map(x => capitaliseWord(x)).join(" ");
}

// capitalise all first letters of phrases in an array
function capitaliseArray(arr) {
    return arr.map(x => capitalisePhrase(x)).join(", ");
}

function getChosenValues() { 
    var chosen = [];
    $('input[name=choice]:checked').each(function(){
        chosen.push($(this).val());
    });
    return chosen;
}

function addQueryOptionsHtml(json, currentChoice) {
    var inputType = currentChoice == 'meals' || currentChoice == 'breads' || currentChoice == 'meats' ? "radio" : "checkbox";
    var displayedChoice = inputType == "radio" ? currentChoice.slice(0, -1) : currentChoice;
    $("#title").text("Please select your " + displayedChoice + ".");
    for (var i = 0; i < json['choices'].length; i++) {
        var option = json['choices'][i];
        if (i == 0 && inputType == "radio") var new_option = '<input type="' + inputType + '" name="choice" value="' + option + '" checked> ' + capitalisePhrase(option) + '<br>';
        else var new_option = '<input type="' + inputType + '" name="choice" value="' + option + '"> ' + capitalisePhrase(option) + '<br>';
        $("#options").append($(new_option));
    }
    $("#options").append($('<input type="submit" value="Submit">'));
}

function addConfirmDisplayHtml(json) {
    $("#title").text("Please confirm your order.");
    $("#orderConfirm").append("You ordered:<br><br>");
    for (var key in json['choices']) { 
        $("#orderConfirm").append("<b>" + capitaliseWord(key) + "</b>:<br>" + capitaliseArray(json['choices'][key]) + "<br>");
    }
    for (var i = 0; i < json['choices'].length; i++) {
        var order = json['choices'][i];
        var order_html = capitaliseWord(order) + '<br>';
        $("#orderConfirm").append(order_html);
    }
    $("#orderConfirm").append("<br>Thank you.");
}

// when submit button is clicked, send data to /data, get return from /queries and display as options
$('#options').submit(function(e) {
    chosen = getChosenValues();

    // post chosen options to /data
    $.ajax({ // create an AJAX call...
        data: JSON.stringify({'value': chosen}),
        type: "POST",
        contentType: 'application/json',
        datatype: 'jsonp',
        url: "/data"
    });

    // get response containing result from ask query
    var request = $.ajax({
        type: "GET",
        url: "/queries"
    });

    // display options
    request.done(function(json) {
        $('#options').text("");
        currentChoice = json['query'];
        if (currentChoice == 'end') {
            addConfirmDisplayHtml(json);
            return;
        }
        addQueryOptionsHtml(json, currentChoice);
        return false;
    });
    return false; // cancel original event to prevent form submitting
});
