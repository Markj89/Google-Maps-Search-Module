<?php
ob_start(); // Start output buffer
/**
 *
 *	GET Vendors
 *	@author Marcus Jackson <marcusj98@gmail.com>
 *	@param 	$url
 *	@param 	$ch
 *	@since 	1.3.0
 *
**/
header("Content-Type: application/json", true);

// Include Credentials
require_once 'config/define.php';

// Variables
$url 		= SUGAR;
$errors 	= array();
$file 		= file_exists("vendor.cache");

// Lets GET JSON For the day
function getJSON() {
	
	// All Global variables start here
	global $url;
	global $errors;
	global $file;

	if ( !$file || ( $file && time() > strtotime('+2 minutes', filemtime('vendor.cache') ) ) ) {
		
		// Initialize cURL
		$ch = curl_init();

		// Set cURL options
		$get = array(
			CURLOPT_POST			=> 0,
			CURLOPT_URL 			=> $url . "?" . CREDENTIALS,
			CURLOPT_VERBOSE			=> 1,
			CURLOPT_ENCODING		=> "gzip",
			CURLOPT_SSL_VERIFYPEER	=> false,
			CURLOPT_SSL_VERIFYHOST	=> false,
			CURLOPT_RETURNTRANSFER	=> 1,
			CURLOPT_FOLLOWLOCATION 	=> true,
		);
		curl_setopt_array($ch, $get);

		// Execute cURL
		$curl = curl_exec($ch);

		// Close cURL
		curl_close($ch);

		// Break apart data given back
		$objects = json_decode($curl, true);

		// Go through unnecessary nested strings
		$data = $objects['entry_list'];

		// Put it into the cache file
		file_put_contents('vendor.cache', $data);

	} else {
		
		// Get the cache file
		$data = file_get_contents('vendor.cache');

	}

	return $data;
	
}

$vendors = getJSON();
echo json_encode($vendors);

?>