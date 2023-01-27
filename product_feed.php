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
  select 
  p.id_product id
  ,name title
  ,COALESCE(IF(meta_description='',NULL,meta_description),IF(description_short='',NULL,description_short),NAME) description
  ,concat('https://www.gellifique.co.uk/--',link_rewrite,'(',p.id_product,').html') link
  ,concat('https://www.gellifique.co.uk/',i.id_image,'-medium_default/img.jpg') image_link
  ,price
  ,(select ean13 from ps17_product where id_product=p.id_product) gtin
  ,(select name from ps17_manufacturer where id_manufacturer=(select id_manufacturer from ps17_product where id_product=p.id_product)) brand
  from 
  ps17_product_shop p
  join ps17_product_lang l on p.id_product=l.id_product and l.id_lang=1 and l.id_shop=1
  left outer join ps17_image i on p.id_product=i.id_product and i.cover=1
  where p.active=1
  and p.id_shop=1
  AND NAME NOT LIKE 'In store%'
  order by p.id_product desc
EOD;

  $result = $db->executeS($request);
  return $result;
}




$pp = get_products();

$out = fopen('php://output', 'w');

fputcsv($out, 
    ['id','title','description','link','image_link','price','gtin','brand','availability','condition','google_product_category']
);
foreach ($pp as $p) {
  $line[0] = $p['id'];
  $line[1] = mb_convert_case($p['title'],MB_CASE_TITLE);
  $line[2] = trim(preg_replace('/\n/' ,' ',strip_tags($p['description'])));
  $line[3] = $p['link'];
  $line[4] = $p['image_link'];
  $line[5] = round($p['price']*1.2,2) . ' GBP';
  $line[6] = $p['gtin'];
  $line[7] = $p['brand'];
  $line[8] = 'in stock';
  $line[9] = 'new';
  $line[10] = '2683';

  //$line[3] = trim(strip_tags($line[3]));

  //$line[6] = round(floatval($line[6]),2) . ' GBP';
  //$line[7] = 'in stock';
  //$line[8] = 'new';
  //$line[9] = '2683';
  fputcsv($out,$line);
}

fclose($out);





