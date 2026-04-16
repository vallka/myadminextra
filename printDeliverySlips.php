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

PrestaShopLogger::addLog('printDeliverySlips');  

$db = \Db::getInstance();
$_DB_PREFIX_ = _DB_PREFIX_;


function processGenerateOrderSlipsPDF($id_order_slips_list)
{

    $order_slips = [];
    foreach ($id_order_slips_list as $id_order_slips) {
        $order_slips[] = new OrderSlip((int) $id_order_slips);
    }

    if (empty($order_slips)) {
        throw new PrestaShopException('No order slips found');
    }
    
    $pdf = new PDF($order_slips, PDF::TEMPLATE_ORDER_SLIP, Context::getContext()->smarty);
    $pdf->render();
}

function printDeliverySlips()
{
    $pp = $_GET['ids'];
    $ids = explode(',', $pp);
    
    processGenerateOrderSlipsPDF($ids);
    
    //$json_result = json_encode($pp);
    
    //header('Content-Type: application/json');
    //echo $json_result;
    
}


printDeliverySlips();




