<?php
// Allowed hostname (api.local and api.travel are also possible here)
define ('HOSTNAME', 'http://wherein.yahooapis.com/v1/document');

// Open the Curl session
$session = curl_init(HOSTNAME);

// Put the POST data in the body
$postvars = '';
while ($element = current($_POST)) {
	$postvars .= urlencode(key($_POST)).'='.urlencode($element).'&';
	next($_POST);
}
curl_setopt ($session, CURLOPT_POST, true);
curl_setopt ($session, CURLOPT_POSTFIELDS, $postvars);

// Don't return HTTP headers. Do return the contents of the call
curl_setopt($session, CURLOPT_HEADER, false);
curl_setopt($session, CURLOPT_RETURNTRANSFER, true);

// Make the call
$xml = curl_exec($session);

// The web service returns XML. Set the Content-Type appropriately
header("Content-Type: text/xml");

echo $xml;
curl_close($session);

?>

