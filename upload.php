<?php

// Define the allowed referrer
$allowedReferrer = 'https://www.gellifique.co.uk/';

// Check the referrer and exit if it's not allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !empty($_SERVER['HTTP_REFERER']) && strpos($_SERVER['HTTP_REFERER'], $allowedReferrer) !== 0) {
    header('HTTP/1.0 403 Forbidden');
    exit;
}

// Include the PrestaShop configuration file
include(dirname(__FILE__).'/../../config/config.inc.php');

// Get the CSV file data from the $_FILES superglobal
$csvData = file_get_contents($_FILES['file']['tmp_name']);
$dataArray = str_getcsv($csvData, "\n");

$resultArray = array();
foreach ($dataArray as $dataRow) {
    $rowArray = str_getcsv($dataRow, ",");
    $resultArray[] = $rowArray;
}
//echo json_encode($resultArray);
$file_type = '';

if ($resultArray[0][0]=='Reference 1' and $resultArray[0][1]=='Shipment Date' and $resultArray[0][2]=='Consignment') {
    $file_type = 'shipment';
}
else if ($resultArray[0][0]=='Collection' and $resultArray[0][1]=='Customer Ref' and $resultArray[0][2]=='Account') {
    $file_type = 'delivery';
}
else {
    echo "wrong file type";
    exit;
}



  //print_r($resultArray);

$db = Db::getInstance();
foreach ($resultArray as $record) {

    if ($record[0]=='Reference 1' or $record[0]=='Collection')
        continue;

    $order = '';        
    $delivered = false;
    if ($file_type=='shipment') {
        $tracking = str_replace(' ', '',"{$record[2]}&{$record[4]}");
        $order = $record[0];
    }
    else {
        $con = preg_replace('/\/.*$/','',$record[6]);
        $tracking = str_replace(' ', '',"{$con}&{$record[8]}");
        $order = $record[1];
        $delivered = preg_match('/^(Delivered)|(Picked up)/i',$record[5]);
    }
    print ($order);        

    $parts = preg_split('/-|_| /', $order);
    if (count($parts)==2) {
        $id = trim($parts[0],' #'); // '4034'
        $code = $parts[1]; // 'QLXFLFHOL'

        print ("pair:".$id.$code."\n");        

    }
    else if (preg_match('/[A-Z]{9}/',$order)) {
        $code = $order; // 'QLXFLFHOL'
        print ("code:".$code."\n");        

        $query = "SELECT id_order FROM " . _DB_PREFIX_ . "orders WHERE reference = '".pSQL($code)."'";

        $result = $db->executeS($query);

        print_r($result);
        
        // Check if the result is not empty and get the id_order
        if (!empty($result)) {
            $id = $result[0]['id_order'];
        } else {
            // Handle the error when the result is empty
            $id = null;
            // Log the error or throw an exception
        }
    }
    else if (preg_match('/#IN\d+/',$order)) {
        $invoice = substr($order,3); // 'QLXFLFHOL'
        print ("invoice:".$invoice."\n");        

        $query = "SELECT id_order FROM " . _DB_PREFIX_ . "orders WHERE invoice_number = ".(int)$invoice."";

        $result = $db->executeS($query);

        print_r($result);
        
        // Check if the result is not empty and get the id_order
        if (!empty($result)) {
            $id = $result[0]['id_order'];
        } else {
            // Handle the error when the result is empty
            $id = null;
            // Log the error or throw an exception
        }
    }

    echo "$file_type:result:$id,$code,$tracking:$delivered\n";

    if ($id) {
        $query = "SELECT shipping_number,current_state FROM " . _DB_PREFIX_ . "orders WHERE id_order = ".(int)$id."";

        $result = $db->executeS($query);

        print_r($result);

        if ($result[0]['shipping_number']!=$tracking) {
            $dbret= $db->execute("UPDATE ". _DB_PREFIX_ . "orders SET shipping_number='".pSQL($tracking)."'".
            " WHERE id_order=".(int)$id );
    
            $dbret= $db->execute("UPDATE ". _DB_PREFIX_ . "order_carrier SET tracking_number='".pSQL($tracking)."'".
            " WHERE id_order=".(int)$id );
        }
        if ($file_type=='delivery' and $delivered and $result[0]['current_state']!=5) {
            $dbret= $db->execute("UPDATE ". _DB_PREFIX_ . "orders SET current_state=5 WHERE id_order=".(int)$id );

            $dbret= $db->execute("insert into ps17_order_history (id_employee,id_order,id_order_state,date_add) values (0,".(int)$id.",5,now())");
        }


    }


}
    
