<?php
header('Content-type: application/json');
header('Access-Control-Allow-Origin: *');

$data = array('status'=>'Success','order_id'=>'123');
echo json_encode($data); die;