/**
 * Author: Rok Avbar, qstraza, rok@rojal.si
 * Date: 19.1.2018
 */
 var proxyurl;
$( document ).ready(function() {
  var mainIframe = $("#mainContentFrame");
  // Checking if user clicked on create/edit item.
  $("body").on("DOMNodeInserted", "#articleCreate", function(el){
    if ($("input[name=sifraArtikla]", el.target).length && $("input[name=crtnaKoda]", el.target).length == 1) {
      createBarCodeButton($("#barcodeType", el.target));
    }
  });
  $("body").on("click", ".ean13Generator", function(e){
    e.preventDefault();
    var prefix = Math.floor(Math.random() * (29 - 20 + 1) ) + 20;
    var ean = "" + prefix + (Math.floor(Math.random() * (9999999999 - 1000000000 + 1) ) + 1000000000);
    ean = "" + ean + ean13CheckSum(ean);
    $("input[name=crtnaKoda]").val(ean);
  });
  // More rows are inserted via Ajax.
  $("body").on("DOMNodeInserted", "#vTContainer table", function(el){
    if ($("select[name=skladisce]").length == 1 && $("input#articleId").length == 1) {
      addCopyButton();
    }
  });
  // We suppose to be on inventory list page
  if ($("select[name=skladisce]").length == 1 && $("input#articleId").length == 1) {
    addCopyButton();
  }
  $("body").on("click", ".copyCodeNumber", function(e){
    e.preventDefault();
    var code = $(e.target).parent().find("a").text();
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(code).select();
    document.execCommand("copy");
    $temp.remove();
  });
  $("body").on("DOMNodeInserted", ".DialogBox .DialogBoxContent", function(el){
    // Checking if hidden input field exists which determens popup is a Serial
    // number popup.
    if (!$(el.target).prop('id').length) {
      if ($(el.target).parents('form').has('input[value=ajaxPostUpdateItemSerialNumbers]').length) {
        // Add class for styling.
        $(el.currentTarget).parents('.DialogBox').addClass('serialParser');
        // Inject HTML in to DOM.
        $(el.currentTarget).append('<div id="serialParserWrapper"><div><h3>Serial Parser</h3></div><div><button name="go">Go</button><button name="clear">Clear Current Serials</button><button name="cleartextarea">Clear Text Below</button></div><textarea></textarea><div id="serialParserHelp"><div class="serialParserHelpTitle">How to use?</div><div class="serialParserHelpBody">Paste or type (and press Go) in serial numbers seperated by comma or any whitespace (tab, newline, space) and they will be parsed and filled in into text fields on the left as expected. You can also enter sequental serials as such "ABC001-ABC010" and parser will fill them in as expected. Just make sure, Starting serial has the same total length as end and there can only be one - (dash) in total.</div></div></div>');
      }
    }
  });
  // Listener when user clicks on help text.
  $("body").on('click', "#serialParserHelp .serialParserHelpTitle", function(event){
    $('#serialParserHelp .serialParserHelpBody').toggle();
  });
  // Listener when user clicks a button to clear a textarea.
  $("body").on('click', ".DialogBox .DialogBoxContent button[name=cleartextarea]", function(event){
    event.preventDefault();
    $('textarea', $(event.target).parents('#serialParserWrapper')).val('');
  });
  // Listener when user clicks OK to submit serial numbers to the server.
  $("body").on('click', "input[name=BUTTON_ajaxPostUpdateItemSerialNumbers]", function(event){
    var inputValues = Array.from($('input[type=text]', $(event.target).closest('form')).serializeArray(), x => x.value).filter(x => x.length);
    var duplicateSerials = getNonUniqueElements(inputValues);
    if (duplicateSerials !== false) {
      // TODO: Try to stop other events from firing.
      alert('Following serials are entered mutiple times: ' + duplicateSerials.join(", "));
    }
  });
  // Listener when user clicks a Go button to parse the serials.
  $("body").on('click', ".DialogBox .DialogBoxContent div#serialParserWrapper button[name=go]", function(event){
    event.preventDefault();
    fillSerials($('textarea', $(event.target).parents('#serialParserWrapper')).val(), $(event.target).closest('form'));
  });
  // Listener when user pastes text in to textarea.
  $("body").on('paste', ".DialogBox .DialogBoxContent div#serialParserWrapper textarea", function(event){
    fillSerials(event.originalEvent.clipboardData.getData('text'), $(event.target).closest('form'));
  });
  // Listener when user clicks to clear all current serial numbers entered.
  $("body").on('click', ".DialogBox .DialogBoxContent button[name=clear]", function(event){
    event.preventDefault();
    $('table input[type=text]', $(event.target).closest("form")).val('');
  });

  if ($("#main-content #header-text span").length && $("#main-content #header-text span").first().text() == "Šifra artikla") {
    product_code_span = $("#main-content #header-text span").next();
    var product_code = product_code_span.text();
    addProductInfoFromWeb(product_code);
    product_code_span.html('<input type="text" value="' + product_code + '" readonly/>');
  }
});

/**
 * Gets text from and tries to return array of serial numbers.
 *
 * Serial numbers in txt can be seperated by comma or whitespace (\s). Serial
 * can be sequential, meaning if user enters ABC001-ABC005, five serials will
 * be returned by the function. All mentioned can be combined, eg:
 * if txt = "1,2   5 123   BC005,ABC001-ABC003", function will return:
 * ["1", "2", "5", "123", "BC005", "ABC001", "ABC002", "ABC003"]
 *
 * @param  {String} txt text which contains serial numbers.
 * @return {Array}     Parsed serial numbers.
 */
function parseSerials(txt) {
  // Getting serials numbers split by whitespace. Zero length elements are
  // ommited.
  var serials = txt.split(/[\s,]/).filter(s => s.length>0);
  // This is where we will save actual serial numbers to return at the end.
  var newSerials = [];
  // Looping thru serials.
  for (var i = 0; i < serials.length; i++) {
    var serial = serials[i];
    // We found a "-" which means that serial has "from to", eg:
    // 111-114, which means we need to create 111,112,113,114.
    // eg2: 17A00321-17A00323 which translates to 17A00321,17A00322,17A00323
    if ((serial.match(/-/g) || []).length === 1) {
      var parts = serial.split('-');
      var start = parts[0];
      var end = parts[1];
      // First part must be the same length as end part. Reason for this is
      // because some serials have only one - but they are not meant to be
      // continues. Eg: ABC-1324.
      if (start.length === end.length) {
        // Getting all the numeric parts from the start and end of serial.
        var partedSerialStart = start.match(/\d+/g);
        var partedSerialEnd = end.match(/\d+/g);
        // If we have a match...
        if (partedSerialStart && partedSerialEnd) {
          // Pushing first serial in sequence.
          newSerials.push(start);
          // Getting the last set of numbers in a serial.
          var originalNumberStart = partedSerialStart.pop();
          // Parse it as an integer so we can do math.
          var currentNumberStart = parseInt(originalNumberStart);
          do {
            // Increasing serial for one.
            currentNumberStart++;
            // Making sure we keep leading zeros. Eg: if start is ABC001 we want
            // to keep fixed width, so after 10, we get ABC010.
            var newSerial = currentNumberStart.toString().padStart(originalNumberStart.length, "0");
            // Replacing number part of start with the new digit.
            newSerial = start.replace(originalNumberStart, newSerial);
            // Saving it.
            newSerials.push(newSerial);
          }
          // Do that until we get to the end.
          while (newSerial != end);
        }
      }
      else {
        newSerials.push(serial);
      }
    }
    else {
      newSerials.push(serial);
    }
  }
  return newSerials;
}

/**
 * Fills native eracuni text fields meant for serial numbers.
 *
 * @param  {String} textareaValue Value of the textare.
 * @param  {jQuery Element} $form     jQuery form of serial popup.
 */
function fillSerials(textareaValue, $form) {
  // Getting array of parsed serial numbers.
  var serials = parseSerials(textareaValue);
  // Checking what is the quantity of the item (ergo, number of serials).
  var numberOfInputs = $('input[type=text]', $form).length;
  // Going thru parsed serial numbers and fill the inputs.
  for (var i = 0; i < serials.length; i++) {
    var $input = $('input[name=serijskaStevilka_' + (i+1) + ']', $form);
    if ($input.length) {
      $input.val(serials[i]);
    }
  }
  // Get all values from inputs which are not blank.
  var inputValues = Array.from($('input[type=text]', $form).serializeArray(), x => x.value).filter(x => x.length);
  // Check if user entered more serials as there are available inputs.
  if (i - numberOfInputs >= 1) {
    alert('You entered/pasted ' + i + ' serials but you only have ' + numberOfInputs + ' serial textfields!');
  }
  // Check if user entered less as available inputs.
  else if (inputValues.length != numberOfInputs) {
    alert('You entered ' + inputValues.length + ' serials but you have ' + numberOfInputs + ' serial textfields!');
  }
  // Check if there are any serials which are entered twice.
  var duplicateSerials = getNonUniqueElements(inputValues);
  if (duplicateSerials !== false) {
    alert('Following serials are entered mutiple times: ' + duplicateSerials.join(", "));
  }
}

/**
 * Returns array of elements which are found more than once in an inputed array.
 * @param  {Array} arr Array of elements.
 * @return {Array}     Elements which were duplicates in original array.
 */
function getNonUniqueElements(arr) {
  var sorted_arr = arr.slice().sort();
  var results = [];
  for (var i = 0; i < sorted_arr.length - 1; i++) {
    if (sorted_arr[i + 1] == sorted_arr[i]) {
        results.push(sorted_arr[i]);
    }
  }
  return results.length ? results : false;
}

/**
 * Goes through the rows in the table and adds a C button which has an event
 * binded on it which copies item code to clipboard.
 */
function addCopyButton() {
  $(".vTScrollableInnerTable tr").each(function(index){
    var $tds = $(this).find("td");
    var $div = $tds.first().find("div").first();
    if ($tds.length > 1 && index > 0 && !$div.find("button").length) {
      $div.prepend('<button class="copyCodeNumber">C</button>');
      $("div.cell-wrapper",$div).css("display", "inline");
    }
  });
}
/**
 * Calculates checksum digit for EAN-13.
 *
 * @param  {String|Integer} s Input number (12 digit) for which checksum is
 * calculated.
 * @return {Integer}   returns checksum digit.
 */
function ean13CheckSum(s){
  var result = 0;
  s = s.toString();
  for (counter = s.length-1; counter >=0; counter--){
    result = result + parseInt(s.charAt(counter)) * (1+(2*(counter % 2)));
  }
  return (10 - (result % 10)) % 10;
}

/**
 * Creates button for barcode generation on provided element.
 *
 * @param  {jQuery element} element Element on which button will be appended.
 */
function createBarCodeButton(element) {
  element.html('<a href="javascript:;" class="ean13Generator">' + element.text() + '</a>')
}

function addProductInfoFromWeb(product_code) {
  homeElement = $("#sidebar div.header > a");
  chrome.storage.sync.get('apiurl', function(data) {
    $.get(data.apiurl + product_code, function(data){
      if (data) {
        var productInfoContainer;
        productInfoContainer = productInfoContainerTemplate.replace(/%URL%/, data.link.details);
        productInfoContainer = productInfoContainer.replace(/%ID%/, data.item_id);
        productInfoContainer = productInfoContainer.replace(/%TITLE%/, data.item_name);
        productInfoContainer = productInfoContainer.replace(/%PRICE%/, data.price.default.your.price_format);
        productInfoContainer = productInfoContainer.replace(/%IMG%/, data.images[0].name);
        if ($("#itemWebWrapper").length) {
          $("#itemWebWrapper").remove();
        }

        $("#sidebar div.header").html(productInfoContainer);
        $("#sidebar div.header").append(homeElement);
        if (data.item_published == "1") {
          $("#itemWebWrapper input[name='item_published']").prop("checked", true);
        }
        if (data.item_stock == "1") {
          $("#itemWebWrapper input[name='item_onstock']").prop("checked", true);
        }
      }
      else {
        $("#sidebar div.header").html("<div id='itemWebWrapper'><h2>Rojal.si Info</h2><div class='content'><h4>Izdelka s to šifro ni na spletni strani.</h4></div></div>");
        $("#sidebar div.header").append(homeElement);
      }
    });
  });
}

function getItemStock(product_code){
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: proxyurl,
      data: {
        productCodes: [product_code],
        methodName: 'getArticleStock'
      },
      success: function(data){
        resolve(JSON.parse(data));
      },
      error: function(error){
        reject(error);
      }
    })
  })
}

var productInfoContainerTemplate = "\
<div id='itemWebWrapper'> \
  <h2>Rojal.si Info</h2> \
  <div class='content'> \
    <h4><a target='_blank' href='%URL%'>%TITLE%</a></h4> \
    <div><a target='_blank' href='https://www.rojal.si/admin/?group=items&section=edit&id=%ID%'>Edit</a></div> \
    <div><span>Price: %PRICE%</span></div> \
    <div><span>Published: </span><span><input type='checkbox' name='item_published' disabled='disabled'></span></div> \
    <div><span>In Stock: </span><span><input type='checkbox' name='item_onstock' disabled='disabled'></span></div> \
    <img src='https://www.rojal.si/images/products/260x200/%IMG%' /> \
  </div> \
</div> \
";
