<?php
// GST Platform PHP SDK
// Simple client for e-commerce integration

class GSTClient {
    private $apiKey;
    private $baseURL;
    private $cache = [];
    private $cacheTTL = 86400; // 24 hours

    public function __construct($apiKey, $baseURL = 'http://localhost:3000') {
        $this->apiKey = $apiKey;
        $this->baseURL = $baseURL;
    }

    private function request($endpoint) {
        $ch = curl_init($this->baseURL . $endpoint);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-Key: ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("API Error: HTTP $httpCode");
        }
        
        return json_decode($response, true);
    }

    // Get GST rate by HSN code
    public function getRate($hsnCode) {
        $cacheKey = $hsnCode;
        $cached = $this->cache[$cacheKey] ?? null;
        
        if ($cached && (time() - $cached['ts']) < $this->cacheTTL) {
            return $cached['data'];
        }

        $data = $this->request("/api/v1/hsn/$hsnCode");
        $this->cache[$cacheKey] = [
            'data' => $data,
            'ts' => time()
        ];
        
        return $data;
    }

    // Search by product description
    public function search($query, $limit = 5) {
        $data = $this->request("/api/v1/search?q=" . urlencode($query) . "&limit=$limit");
        return $data['results'] ?? [];
    }

    // Calculate GST for amount
    public function calculateGST($amount, $rate, $sameState = true) {
        $gstAmount = ($amount * $rate) / 100;
        
        if ($sameState) {
            return [
                'subtotal' => $amount,
                'cgst' => $gstAmount / 2,
                'sgst' => $gstAmount / 2,
                'igst' => 0,
                'total' => $amount + $gstAmount
            ];
        } else {
            return [
                'subtotal' => $amount,
                'cgst' => 0,
                'sgst' => 0,
                'igst' => $gstAmount,
                'total' => $amount + $gstAmount
            ];
        }
    }

    // Calculate cart total with GST
    public function calculateCart($items, $customerState, $sellerState = 'MH') {
        $sameState = $customerState === $sellerState;
        $breakdown = [
            'subtotal' => 0,
            'cgst' => 0,
            'sgst' => 0,
            'igst' => 0,
            'cess' => 0,
            'items' => []
        ];

        foreach ($items as $item) {
            $gstInfo = $this->getRate($item['hsn_code']);
            $itemTotal = $item['price'] * $item['quantity'];
            $gstCalc = $this->calculateGST($itemTotal, $gstInfo['rate'], $sameState);

            $breakdown['subtotal'] += $gstCalc['subtotal'];
            $breakdown['cgst'] += $gstCalc['cgst'];
            $breakdown['sgst'] += $gstCalc['sgst'];
            $breakdown['igst'] += $gstCalc['igst'];

            $breakdown['items'][] = array_merge($item, [
                'gst_rate' => $gstInfo['rate'],
                'gst_amount' => $gstCalc['cgst'] + $gstCalc['sgst'] + $gstCalc['igst']
            ]);
        }

        $breakdown['total'] = $breakdown['subtotal'] + $breakdown['cgst'] + 
                             $breakdown['sgst'] + $breakdown['igst'] + $breakdown['cess'];
        return $breakdown;
    }
}

// Usage Example:
// $client = new GSTClient('gst_your_api_key');
// $rate = $client->getRate('8517');
// echo "GST Rate: " . $rate['rate'] . "%";
?>
