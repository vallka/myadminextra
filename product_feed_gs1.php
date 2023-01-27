<?php
/*
*
*  @author vallka
*  @copyright  2021
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*/

ini_set('error_reporting', E_ALL);
ini_set('display_errors', 1);


include(dirname(__FILE__) . '/../../config/config.inc.php');

PrestaShopLogger::addLog('myadminextra product_feed');  

$db = \Db::getInstance();
$_DB_PREFIX_ = _DB_PREFIX_;


function get_products() {
  global $db,$_DB_PREFIX_;

  $request =<<<EOD
  select * from (
  select 
  p.id_product
  ,name
  ,COALESCE(meta_description,description,name) description
  ,concat('https://www.gellifique.co.uk/--',link_rewrite,'(',p.id_product,').html') link
  ,(select ean13 from ps17_product where id_product=p.id_product) gtin
  ,(select reference from ps17_product where id_product=p.id_product) sku
  ,(select name from ps17_manufacturer where id_manufacturer=(select id_manufacturer from ps17_product where id_product=p.id_product)) brand
  from 
  ps17_product_shop p
  join ps17_product_lang l on p.id_product=l.id_product and l.id_lang=1 and l.id_shop=1
  left outer join ps17_image i on p.id_product=i.id_product and i.cover=1
  where p.id_shop=1
  ) qq
  where gtin!='' and gtin is not null  AND brand='GellifiQue'
  order by gtin 
EOD;

  $result = $db->executeS($request);
  return $result;
}

function generateEAN($prefix,$number)
{
  $code = $prefix . str_pad($number, 12-strlen($prefix), '0',STR_PAD_LEFT);
  $weightflag = true;
  $sum = 0;
  // Weight for a digit in the checksum is 3, 1, 3.. starting from the last digit. 
  // loop backwards to make the loop length-agnostic. The same basic functionality 
  // will work for codes of different lengths.
  for ($i = strlen($code) - 1; $i >= 0; $i--)
  {
    $sum += (int)$code[$i] * ($weightflag?3:1);
    $weightflag = !$weightflag;
  }
  $code .= (10 - ($sum % 10)) % 10;
  return $code;
}

//5060726309998
$prefix = '506072630';


$pp = get_products();
$gtins = [];
foreach ($pp as $p) {
    $p['name'] = mb_convert_case($p['name'],MB_CASE_TITLE);
    $p['description'] = trim(strip_tags($p['description']));
    $p['description'] = str_replace("\n"," ",$p['description']);
    $p['description'] = str_replace("\r","",$p['description']);
    $p['description'] = str_replace('"',"'",$p['description']);
    $gtins[$p['gtin']] = $p;
}



$fileName = "gtin-13-ps.csv";

header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Cache-Control: private', false);
header('Content-Type: text/csv');
header('Content-Disposition: attachment;filename=' . $fileName);    


$out = fopen('php://output', 'w');

fputcsv($out, 
    ['Number','Product Name','Description','Main Brand','Sub Brand','Product Link','MPN','SKU','Updated']
);



for ($i=0;$i<1000;++$i){
    $gtin = generateEAN($prefix,$i);
    $prod = $gtins[$gtin];

    $line[0] = $gtin;
    $line[1] = $prod?$prod['name']:'';
    $line[2] = $prod?$prod['description']:'';
    $line[3] = $prod?$prod['brand']:'';
    $line[4] = '';
    $line[5] = $prod?$prod['link']:'';
    $line[6] = '';
    $line[7] = $prod?$prod['sku']:'';
    $line[8] = '';
  
    fputcsv($out,$line);
  /* print ($line[0].' '.$line[7]."\n");*/
}

fclose($out);
