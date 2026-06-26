# GST Platform Python SDK
# Simple client for e-commerce integration

import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class GSTClient:
    def __init__(self, api_key: str, base_url: str = 'http://localhost:3000'):
        self.api_key = api_key
        self.base_url = base_url
        self.cache = {}
        self.cache_ttl = timedelta(hours=24)

    def _request(self, endpoint: str) -> dict:
        response = requests.get(
            f'{self.base_url}{endpoint}',
            headers={'X-API-Key': self.api_key}
        )
        response.raise_for_status()
        return response.json()

    def get_rate(self, hsn_code: str) -> dict:
        """Get GST rate by HSN code"""
        cached = self.cache.get(hsn_code)
        if cached and datetime.now() - cached['ts'] < self.cache_ttl:
            return cached['data']

        data = self._request(f'/api/v1/hsn/{hsn_code}')
        self.cache[hsn_code] = {'data': data, 'ts': datetime.now()}
        return data

    def search(self, query: str, limit: int = 5) -> list:
        """Search by product description"""
        data = self._request(f'/api/v1/search?q={query}&limit={limit}')
        return data.get('results', [])

    def calculate_gst(self, amount: float, rate: float, same_state: bool = True) -> dict:
        """Calculate GST breakdown"""
        gst_amount = (amount * rate) / 100
        
        if same_state:
            return {
                'subtotal': amount,
                'cgst': gst_amount / 2,
                'sgst': gst_amount / 2,
                'igst': 0,
                'total': amount + gst_amount
            }
        else:
            return {
                'subtotal': amount,
                'cgst': 0,
                'sgst': 0,
                'igst': gst_amount,
                'total': amount + gst_amount
            }

    def calculate_cart(self, items: List[dict], customer_state: str, seller_state: str = 'MH') -> dict:
        """Calculate cart total with GST"""
        same_state = customer_state == seller_state
        breakdown = {
            'subtotal': 0,
            'cgst': 0,
            'sgst': 0,
            'igst': 0,
            'cess': 0,
            'items': []
        }

        for item in items:
            gst_info = self.get_rate(item['hsn_code'])
            item_total = item['price'] * item['quantity']
            gst_calc = self.calculate_gst(item_total, gst_info['rate'], same_state)

            breakdown['subtotal'] += gst_calc['subtotal']
            breakdown['cgst'] += gst_calc['cgst']
            breakdown['sgst'] += gst_calc['sgst']
            breakdown['igst'] += gst_calc['igst']

            breakdown['items'].append({
                **item,
                'gst_rate': gst_info['rate'],
                'gst_amount': gst_calc['cgst'] + gst_calc['sgst'] + gst_calc['igst']
            })

        breakdown['total'] = (breakdown['subtotal'] + breakdown['cgst'] + 
                             breakdown['sgst'] + breakdown['igst'] + breakdown['cess'])
        return breakdown


# Usage Example:
# client = GSTClient('gst_your_api_key')
# rate = client.get_rate('8517')
# print(f"GST Rate: {rate['rate']}%")
