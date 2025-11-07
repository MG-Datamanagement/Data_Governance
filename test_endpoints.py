#!/usr/bin/env python3
"""
Simple test script to verify table endpoints are working.
Run this script to test the table listing and detail endpoints.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_table_endpoints():
    """Test table endpoints."""
    print("Testing MetaPortal Table Endpoints...")
    
    # Test table listing
    print("\n1. Testing table listing endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/tables")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Found {data.get('total', 0)} tables")
            print(f"Returned {len(data.get('tables', []))} tables in this page")
            
            # If there are tables, test getting details for the first one
            if data.get('tables'):
                table_id = data['tables'][0]['id']
                print(f"\n2. Testing table detail endpoint for table ID {table_id}...")
                
                detail_response = requests.get(f"{BASE_URL}/api/v1/tables/{table_id}")
                print(f"Status Code: {detail_response.status_code}")
                
                if detail_response.status_code == 200:
                    detail_data = detail_response.json()
                    print(f"Table Name: {detail_data.get('name', 'Unknown')}")
                    print(f"Description: {detail_data.get('description', 'No description')}")
                    print(f"Columns: {len(detail_data.get('columns', []))}")
                    print("✅ Table detail endpoint working!")
                else:
                    print(f"❌ Table detail endpoint failed: {detail_response.text}")
            else:
                print("No tables found to test detail endpoint")
            
            print("✅ Table listing endpoint working!")
        else:
            print(f"❌ Table listing endpoint failed: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to the server. Make sure it's running on localhost:8000")
        print("Start the server with: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error testing endpoints: {e}")
        return False
    
    # Test health endpoint
    print("\n3. Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Health Status: {data.get('status', 'Unknown')}")
            print("✅ Health endpoint working!")
        else:
            print(f"❌ Health endpoint failed: {response.text}")
    
    except Exception as e:
        print(f"❌ Error testing health endpoint: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_table_endpoints()
    sys.exit(0 if success else 1)