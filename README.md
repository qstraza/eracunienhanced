# Eracuni Enhanced
This extension includes all kinds of enhancments for e-racuni.com application.

It contains
- Serial number parser
- Item Code copier
- Ean-13 barcode generator

## Serials Parser
E-racuni.com offers you one text input per serial number, which is OK until you
have to enter 100 serial numbers. This chrome extension simply creates a
textarea next to serial input form in to which you can paste serial numbers
seperated by comma or any whitespace (space, newline, tab...).


### How to use
Paste or type (and press Go) in serial numbers seperated by
comma or any whitespace (tab, newline, space) and they will
be parsed and filled in into text fields on the left as expected.
You can also enter sequental serials as such "ABC001-ABC010"
and parser will fill them in as expected. Just make sure,
Starting serial has the same total length as end and there
can only be one - (dash) in total.

## Item code copier
Adds a button to copy item code to clipboard on all item list pages.

## Ean-13 barcode generator
When you are on item edit/create page, you can now click on "generate" button
next to barcode text field for generating a random ean-13 barcode.
