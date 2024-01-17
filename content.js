/**
 * Author: Rok Avbar, qstraza, rok@rojal.si
 * Date: 19.1.2018
 */
 var companies = [
  'ROJAL NOVO MESTO, d.o.o.',
  'RTI TECHNOLOGIES d.o.o.'
 ];
 
$( document ).ready(function() {
  var currentCompany = "";
  try {
    currentCompany = JSON.parse(sessionStorage.getItem('erUserSession_SIUser'))[2];
  }
  catch(e){};
  
  if (companies.includes(currentCompany)) {
    

    $("#mainContentFrame").on('load', function(){
      var mainIframe = window.top.frames["mainContentFrame"].document;
      var pageTitle = $("#toolbarTitle", mainIframe).text();
      if (pageTitle.startsWith('Naročilo kupca')) {
        var match = pageTitle.match(/ (\d+)$/);
        if (match instanceof Array && match.length == 2) {
          let order_id = match[1]
          chrome.storage.sync.get('websiteurl', function(data) {
            let order_edit_url = data.websiteurl + "/wp-admin/post.php?post=" + order_id + "&action=edit";
            $("#edDiv_inlineEditSalesOrderStatus", mainIframe).parent().append("<br/><font class='dgLb'><a href='"+ order_edit_url +"' target='_blank'>Odpri naročilo<a></font>")
          });
          
        }
      }
    });

    // Checking if user clicked on create/edit item.
    $("body").on("DOMNodeInserted", "#articleCreate", function(el){
      if ($("input[name=sifraArtikla]", el.target).length && $("input[name=crtnaKoda]", el.target).length == 1) {
        createBarCodeButton($("#barcodeType", el.target));
      }
    });
    // $("body").on("click", ".ean13Generator", function(e){
    $("body").on("click", "div.form-row > div:nth-child(3) > div > font", function(e){
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
        // checkIfOnWebPage(getAllCodes());
      }
    });
    // We suppose to be on inventory list page
    if ($("select[name=skladisce]").length == 1 && $("input#articleId").length == 1) {
      addCopyButton();
    }
    $("body").on("click", "#tb_edit", function (e){
      console.log(e);
    });

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
      product_code_span.html('<input id="sifra_artikla" type="text" value="' + product_code + '" readonly/>');
    }
    $("#sifra_artikla").on("click", function(){
      $(this).select();
      document.execCommand('copy');
    });

    $("<a href='javascript:;' id='goldekspres' ><img src='https://gold-ekspres.si/img/ge-logo.png' height='18' /></a>").insertAfter("#tb_stickyNotes");

    // Create the modal structure with HTML and style it with CSS
    const modalHTML = `
    <div id="goldModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 999; justify-content: center; align-items: center;">
        <div style="background-color: white; padding: 20px; border-radius: 5px; width: 300px;
        margin-left: auto;
        margin-right: auto;
        margin-top: 50px;">
            <h2>Gold Ekspres</h2>
            <form id="goldModalForm">
                <label for="goldObcutljivo">Občutljivo</label>
                <input type="checkbox" id="goldObcutljivo" value="1"><br>

                <label for="goldStPaketov">Število paketov</label>
                <input type="number" min="1" max="30" id="goldStPaketov" value="1"><br>

                <label for="goldOpomba">Opomba</label>
                <textarea id="goldOpomba"></textarea><br>

                <button type="button" class="confirmButton">Confirm</button>
                <button type="button" class="cancelButton">Cancel</button>
            </form>
        </div>
    </div>
`;
    // Append the modal to the body
    $("body").append(modalHTML);
    // Open the modal when the "Open Modal" link is clicked
    $("#goldekspres").click(function() {
        $("#goldModal").css("display", "block");
    });

    // Close the modal when the "Cancel" button is clicked
    $("#goldModal .cancelButton").click(function() {
        $("#goldModal").css("display", "none");
    });

    $("#goldModal .confirmButton").click(function() {
        // Get values from the form
        const obcutljivo = $("#goldObcutljivo").prop("checked") ? 1 : 0;
        const stPaketov = $("#goldStPaketov").val();
        const opombe = $("#goldOpomba").val();

        var title = $("#toolbarTitle").text().split("št.");
        if (!title) return false;
        if (title.length != 2) return false;
        if (title[0].trim() == 'Naročilo kupca') {
          var tipDokumenta = 'narocilo';
        }
        else if (title[0].trim() == 'Račun') {
          var tipDokumenta = 'racun';
        }
        else {
          return false;
        }
        var dokument = title[1].trim()

        // Send an AJAX request (dummy URL, replace with your actual endpoint)
        $.ajax({
            url: "https://www.rojal.si/eracuni/index.php/gold/dodajPosiljko/" + tipDokumenta + "/" + dokument,
            type: "POST",
            data: {
                obcutljivo: obcutljivo,
                stevilopaketov: stPaketov,
                opombe: opombe
            },
            success: function(response) {
                // Display the AJAX response in an alert
                if (response.status == 1) {
                  alert("Nalepka je ustvarjena");
                }
                else {
                  alert("Napaka: " + response.msg);
                }
                // console.log(response);
            }
        });

        // Close the modal
        $("#goldModal").css("display", "none");
    });
    
    /**
     * When modal for creating new Product is opened, this code automatically sets
     * shop visibility to "visible online", so all newly created items will have this
     * option seleted.
     */
    // Create a new MutationObserver instance
    const observer = new MutationObserver((mutationsList) => {
      // Check each mutation for added nodes
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          // Check if any added node matches the target ID
          const addedNodes = Array.from(mutation.addedNodes);
          const targetNode = addedNodes.find((node) => node.id === 'articleCreate');
          // If the target node is found, execute your code here
          if (targetNode) {
            if (!$("#articleCreate input[name=sifraArtikla]").val()) {
              // Select "visible online".
              $("#onlineShopVisibility_div select").val("visibleOnline");
              // Izberi "kos" kot enoto.
              $("#articleCreate input[name=enotaMereString]").val("kos");
              $("#articleCreate input[name=enotaMere]").val(2);
            }
            // Forces the SKU to only allows letters, numbers and "- / _ # . ,"
            $("#articleCreate input[name=sifraArtikla]").on("input", function() {
              // Get the current value of the input
              var inputValue = $(this).val();
          
              // Remove any characters that are not allowed
              var updatedValue = inputValue.replace(/[^A-Za-z0-9\-/_#.,]/g, '');
          
              // Update the input with the cleaned value
              $(this).val(updatedValue);
            });
          }
        }
      }
    });

    // Start observing the body element for changes
    observer.observe(document.body, { childList: true, subtree: true });
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
    // var $input = $('input[name=sn_' + (i+1) + ']', $form);
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

function checkIfOnWebPage($codes) {

}

function getAllCodes() {
  var codes = [];
  $(".vTScrollableInnerTable tr").each(function(index){
    var $tds = $(this).find("td");
    var $div = $tds.first().find("div").first();
    var code = $("a",$div).text();
    if (code.length > 2) {
      codes.push(code);
    }
  });
  return codes;
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
  chrome.storage.sync.get(['websiteurl', 'authtoken'], function(local_storage) {
    var settings = {
      "url": local_storage.websiteurl + "/wp-json/wc/v3/product-by-sku?sku=" + product_code,
      "method": "GET",
      "timeout": 0,
      "headers": {
        "Authorization": "Basic " + local_storage.authtoken
      },
    };
    
    $.ajax(settings).done(function (data) {
      // console.log(response);
      var productInfoContainer;
        productInfoContainer = productInfoContainerTemplate.replace(/%URL%/, data.view_url);
        productInfoContainer = productInfoContainer.replace(/%EDIT_URL%/, data.edit_url);
        productInfoContainer = productInfoContainer.replace(/%TITLE%/, data.name);
        productInfoContainer = productInfoContainer.replace(/%IMG%/, data.image_url);
        productInfoContainer = productInfoContainer.replace(/%STATUS%/, data.status);
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
      
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      $("#sidebar div.header").html("<div id='itemWebWrapper'><h2>Rojal.si Info</h2><div class='content'><h4>Izdelka s to šifro ni na spletni strani.</h4></div></div>");
      $("#sidebar div.header").append(homeElement);
    });
  });
}

var productInfoContainerTemplate = "\
<div id='itemWebWrapper'> \
  <h2>Rojal.si Info</h2> \
  <div class='content'> \
    <h4><a target='_blank' href='%URL%'>%TITLE%</a></h4> \
    <div><a target='_blank' href='%EDIT_URL%'>Edit</a></div> \
    <div><span>%STATUS%</span></div> \
    <img src='%IMG%' /> \
  </div> \
</div> \
";
