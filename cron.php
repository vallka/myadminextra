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

PrestaShopLogger::addLog('myadminextra cron');  

$db = \Db::getInstance();
$_DB_PREFIX_ = _DB_PREFIX_;


function get_products($ids) {
  global $db,$_DB_PREFIX_;

  $request =<<<EOD
  SELECT p.id_product,p.reference,l.name,i.id_image
  FROM {$_DB_PREFIX_}product p join {$_DB_PREFIX_}product_lang l on p.id_product=l.id_product and l.id_lang=1
  join {$_DB_PREFIX_}image i on p.id_product=i.id_product and i.cover=1
  where p.id_product in ({$ids})
EOD;



  $result = $db->executeS($request);
  //$result = $db;
  

  return $result;
}

function get_order_products($id) {
  global $db,$_DB_PREFIX_;

  $request =<<<EOD
  SELECT p.id_order_detail,p.product_id as id_product,p.product_name,i.id_image
    FROM ps17_order_detail p 
    left outer join ps17_image i on p.product_id=i.id_product and i.cover=1 
  WHERE id_order={$id} order by product_name        
EOD;

  $result = $db->executeS($request);
  return $result;
}
  
function get_orders($n=14) {
  global $db,$_DB_PREFIX_;

  $request =<<<EOD
  SELECT 
  id_order,
  reference,
  c.firstname as firstname,
  c.lastname as lastname,
  c.email
  FROM `ps17_orders` o
  JOIN ps17_customer c on o.id_customer=c.id_customer
  WHERE o.current_state in (5)
  and o.id_shop=1
  and date(o.date_upd) = DATE_SUB(date(now()),INTERVAL {$n} day)
EOD;

  $result = $db->executeS($request);
  return $result;
}




function make_email($o,$pp) {
  $products_html='';
  $products_text='';
  foreach ($pp as $p) {

    $products_html .= <<<EOD
  <tr><td style="width:50%;">
    <img style="width:100%" alt="{$p['product_name']}" title="{$p['product_name']}" src="https://www.gellifique.co.uk/{$p['id_image']}-medium_default/img.jpg" />
  </td>
  <td style="width:50%;">
    <h3>{$p['product_name']}</h3>
    <a href="https://www.gellifique.co.uk/index.php?id_product={$p['id_product']}&controller=product&id_lang=1#writereview" target="_blank"><h4>Write your review</h4></a>
  </td></tr>
  
EOD;
  
    $products_text .= <<<EOD
{$p['name']}
Click on link below to write your review:
https://www.gellifique.co.uk/index.php?id_product={$p['id_product']}&controller=product&id_lang=1#writereview

EOD;
  }

  $sent = 0;
  $email = [];

  $email['email'] = 'vallka@vallka.com';
  $email['lastname'] = $o['lastname'];
  $email['firstname'] = $o['firstname'];
  $email['id_lang'] = 1;
  
  $template_vars = array(
      '{email}' => $email['email'],
      '{lastname}' => $email['lastname'],
      '{firstname}' => $email['firstname'],
      '{products_html}' => $products_html,
      '{products_text}' => $products_text
      );
  
  
  $sent = Mail::Send(
      (int)$email['id_lang'],
      'invite2review',
      Mail::l('Please review your purchase on GellifiQue.co.uk',(int)$email['id_lang']
      ),
      $template_vars,
      $email['email'],
      $email['firstname'] . ' ' . $email['lastname'],
      null,
      null,
      null,
      null,
      dirname(__FILE__).'/mails/'
  );
 
  print("200 myadminextra cron:$sent");
}


$oo = get_orders(13);
//`print (var_export($oo,true));

foreach ($oo as $o) {
  $pp =  get_order_products($o['id_order']);

  print ($o['email']);
  print ($o['firstname']);
  print ($o['lastname']);

  print (var_export($pp,true));

  make_email($o,$pp);
}

/*
$pp = get_products("1371,1372");


foreach ($pp as $p) {

  $name = $p['name'];
  $id_product = $p['id_product'];
  $id_image = $p['id_image'];


  $product_html=<<<EOD
<div><img alt="{$name}" title="{$name}" src="https://www.gellifique.co.uk/{$id_image}-medium_default/img.jpg" />
<h3>{$name}</h3>
<a href="https://www.gellifique.co.uk/index.php?id_product={$id_product}&controller=product&id_lang=1" target="_blank"><h4>Write your review</h4></a></div>
EOD;

  print ($product_html);
}

print (var_export($pp,true));
*/
