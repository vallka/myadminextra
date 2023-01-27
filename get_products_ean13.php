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

PrestaShopLogger::addLog('myadminextra get_product_ean13');  

$db = \Db::getInstance();
$_DB_PREFIX_ = _DB_PREFIX_;


function get_products($ids) {
  global $db,$_DB_PREFIX_;

  $request =<<<EOD
  select * from (
    select 
    p.id_product
    ,(select ean13 from ps17_product where id_product=p.id_product) gtin
    ,(select substr(ean13,1,12) from ps17_product where id_product=p.id_product) gtin12
    ,(select reference from ps17_product where id_product=p.id_product) reference
    ,name
    ,round(price,2) ex_vat
    ,round(price*1.2,2) with_vat
    from 
    ps17_product_shop p
    join ps17_product_lang l on p.id_product=l.id_product and l.id_lang=1 and l.id_shop=1
    left outer join ps17_image i on p.id_product=i.id_product and i.cover=1
    where p.id_shop=1
    ) qq
    where id_product in ($ids)
EOD;

  $result = $db->executeS($request);
  return $result;
}


$ids = $_GET['ids'];
$n = $_GET['n'];

$ids = preg_replace('/[^0-9,]/','',$ids);
$n = preg_replace('/[^0-9]/','',$n);

if (!$n) $n = 1;


$pp = get_products($ids);

$fileName = "dymo-labels.csv";

header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Cache-Control: private', false);
header('Content-Type: text/csv');
header('Content-Disposition: attachment;filename=' . $fileName);    


$out = fopen('php://output', 'w');

fputcsv($out, 
    ['ID','EAN-13','EAN-12','Reference','Product Name','Price ExVat','Price IncVat']
);


foreach ($pp as $p) {
    $line[0] = $p['id_product'];
    $line[1] = $p['gtin'];
    $line[2] = $p['gtin12'];
    $line[3] = $p['reference'];
    $line[4] = $p['name'];
    $line[5] = $p['ex_vat'];
    $line[6] = $p['with_vat'];

    for ($i=0;$i<$n;++$i) {
      fputcsv($out,$line);
    }
  }
  

fclose($out);
