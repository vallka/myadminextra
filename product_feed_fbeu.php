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

PrestaShopLogger::addLog('myadminextra product_feed_fb');  

$db = \Db::getInstance();
$_DB_PREFIX_ = _DB_PREFIX_;

$id_shop = 2;
$id_lang = 2;

if ($_GET['lang']) {
    $id_lang = $db->getValue("SELECT id_lang FROM ps17_lang WHERE iso_code='" . pSQL($_GET['lang']) . "'");
    $lang = pSQL($_GET['lang']);
}

if (!$id_lang) {
    $id_lang = 2;
    $lang = 'es';
}

if ($lang=='de') $lang_code = 'de_DE';
else if ($lang=='it') $lang_code = 'it_IT';
else if ($lang=='ro') $lang_code = 'ro_RO';
else if ($lang=='pl') $lang_code = 'pl_PL';
else $lang_code = $lang . '_XX';




function get_products() {
    global $db,$_DB_PREFIX_,$id_shop,$id_lang;

    $request =<<<EOD
    select 
    p.id_product id
    ,name title
    ,link_rewrite
    ,COALESCE(IF(meta_description='',NULL,meta_description),IF(description_short='',NULL,description_short),NAME) description
    ,concat('https://www.gellifique.co.uk/--',link_rewrite,'(',p.id_product,').html') link
    ,id_image
    ,price
    ,(select ean13 from ps17_product where id_product=p.id_product) gtin
    ,(select name from ps17_manufacturer where id_manufacturer=(select id_manufacturer from ps17_product where id_product=p.id_product)) brand
    from 
    ps17_product_shop p
    join ps17_product_lang l on p.id_product=l.id_product and l.id_lang=$id_lang and l.id_shop=$id_shop
    left outer join ps17_image i on p.id_product=i.id_product and i.cover=1
    where p.active=1
    and p.id_shop=$id_shop
    AND NAME NOT LIKE 'In store%'
    order by p.id_product 
EOD;

    $result = $db->executeS($request);

    foreach ($result as &$p) {
        $p['title'] = mb_convert_case($p['title'],MB_CASE_TITLE);

        $p['description'] = str_replace("PRODUCT TYPE: ","",$p['description']);

        $p['description'] = str_replace("<p>","\n",$p['description']);
        $p['description'] = str_replace("<li>","\n",$p['description']);
        $p['description'] = str_replace("<br>","\n",$p['description']);
        $p['description'] = str_replace("<br/>","\n",$p['description']);
        $p['description'] = str_replace("<br />","\n",$p['description']);
        $p['description'] = trim(strip_tags($p['description']));

        $p['description'] = str_replace("\n\n","\n",$p['description']);
        $p['description'] = str_replace("\n",". ",$p['description']);
        $p['description'] = str_replace("\r","",$p['description']);
        $p['description'] = str_replace('"',"'",$p['description']);
        
        $p['description'] = substr($p['description'],0,9000);

        $p['SKU'] = $p['brand'][0] . sprintf('%05d',$p['id']);
        $p['link'] = Context::getContext()->link->getProductLink($p['id'], null, null, null, (int)$id_lang, (int)$id_shop);
        $p['image_link'] = Context::getContext()->link->getImageLink($p['link_rewrite'], (int)$p['id_image'], 'large_default');

        $images = $db->executeS("SELECT id_image FROM ps17_image_shop WHERE id_product={$p['id']} AND id_shop=$id_shop AND COALESCE(cover,0)=0");
        foreach ($images as $img) {
            $img_link = Context::getContext()->link->getImageLink($p['link_rewrite'], (int)$img['id_image'], 'large_default');
            $p['additional_image_link'] .= $img_link . ',';
        }
        $p['additional_image_link'] = trim($p['additional_image_link'],', ');
    }

    return $result;
}




$pp = get_products();

$fileName = "product_feed_fb.csv";

header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Cache-Control: private', false);
header('Content-Type: text/csv');
header('Content-Disposition: attachment;filename=' . $fileName);    


$out = fopen('php://output', 'w');

if ($id_lang==2) {
    fputcsv($out, 
        ['id','title','description','link','image_link','price','gtin','brand','availability','condition','google_product_category','additional_image_link']
    );
    foreach ($pp as $p) {
        $line[0] = $p['SKU'];
        $line[1] = $p['title'];
        $line[2] = $p['description'];
        $line[3] = $p['link'];
        $line[4] = $p['image_link'];
        $line[5] = round($p['price']*1.21,2) . ' EUR';
        $line[6] = $p['gtin'];
        $line[7] = $p['brand'];
        $line[8] = 'in stock';
        $line[9] = 'new';
        $line[10] = '2683';
        $line[11] = $p['additional_image_link'];

        fputcsv($out,$line);
    }
}
else {
    fputcsv($out, 
        ['id','override','title','description','link']
    );
    foreach ($pp as $p) {
        $line[0] = $p['SKU'];
        $line[1] = $lang_code;
        $line[2] = $p['title'];
        $line[3] = $p['description'];
        $line[4] = $p['link'];

        fputcsv($out,$line);
    }

}

fclose($out);





