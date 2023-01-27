<?php
require 'vendor/autoload.php';

// This will output the barcode as HTML output to display in the browser
$generator = new Picqer\Barcode\BarcodeGeneratorPNG();
//echo $generator->getBarcode('5060726307581', $generator::TYPE_EAN_13,3,50);
file_put_contents('barcode.png',$generator->getBarcode('5060726307581', $generator::TYPE_EAN_13,3,50));


