# Grow API
GrowAPI is a REST API used by GrowSDK to manage users and users' assets on the Grow platform.

# Security
HTTPS is required to call GrowAPI.
A rate limiting module, per calling application, will be added soon.

# Authentication
Each call to GrowAPI requires a valid OAuth2.0 Bearer token. See http://tools.ietf.org/html/rfc6749 and http://tools.ietf.org/html/rfc6750 for more information.
OAuth token entry point is defined at */oauthtoken*.
Applications calling this API will be soon required to authenticate using HMAC and their *application_id* and *application_secret*. See http://tools.ietf.org/html/draft-ietf-oauth-v2-http-mac-00 for more information.

## User authentication [/oauthtoken/{OAuthToken}]
### Request a new OAuth token [POST]
+ Request
    + Headers
    
            Authorization: Basic {base64(email:password)}
    
+ Response 200 (application/json)

        {
            "access_token": "ekJZwEhvaxJlk-PEoTa",
            "token_type": "access_token",
            "expires_in": "3600"
        }
        
### Revoke an OAuth token [DELETE]
+ Parameters
    + OAuthToken (required, string, `1`)

+ Response 204

## User information [/me]        
### Retrieve user metadata [GET]
+ Response 200 (application/json)

        {
            "UserEmail": "lionel@grow.am",
            "UserID": "x1xh1s5Tp",
            "UserVerified": false
        }

## Manage user files [/files/{FileID}]
Create or delete a file for the current user

### Create a new file for current user [POST]
+ Request (application/json)

        {
            "ParameterID": "Vgi81s5Tp",
            "SoftwareID": "sA351s5Tp",
            "MaterialID": "q4Ed3s5Tp"
        }

+ Response 201 (application/json)

        { 
            "FileID": "B6xh1s5Tp",
            "PrivKey": "MIIEpQIBAAKCAQEA3Tz2mr7SZiAMfQyuvBjM9Oi...fJdHEm2M4=" 
        }

### Deactivate a file [DELETE]
+ Parameters
    + FileID (required, string, `1`)
    
+ Response 204

## Manage access control list [/files/{FileID}/acl/{ACEID}]
On manufacturer side, retrieve access rights list for current manufacturer.

### Download list of Access Control Entries associated with given file and based on current manufacturer session [GET]
+ Parameters
    + FileID (required, string, `1`)
    
+ Response 200 (application/json)

        [{ 
            "ACEID": "6Wxh1s5Tp",
            "datefrom": "2014-06-05 13:20:57.064+00",
            "dateto": "2014-06-06 13:20:57.064+00",
            "scope": "read" 
        },
        { 
            "ACEID": "32gh1s5Tp",
            "datefrom": "2014-06-05 13:20:57.064+00",
            "dateto": "2014-06-06 13:20:57.064+00",
            "scope": "print"
        }]

## Manage access control list [/files/{FileID}/acl/{ACEID}/key]
Download the public key for decryption if allowed

### Download public decryption key for a given file and based on a given ACE ID [GET]
+ Parameters
    + FileID (required, string, `1`)
    + ACEID (required, string, `1`)
    
+ Response 200 (application/json)

        { 
            "pubKey": "MIIEpQIBAAKCAQEA3Tz2mr7SZiAMfQyuvBjM9Oi...fJdHEm2M4="
        }

## Retrieve metadata about users and assets [/softwares/{SoftwareID}]
Retrieve all public information about the given software, including royalty fees

### Retrieve all public information about the given software, including royalty fees [GET]
+ Parameters
    + SoftwareID (required, string, `1`)
    
+ Response 200 (application/json)

        { 
            "ownerID": "32gh1s5Tp",
            "description": "Lorem ipsum dolor sit amet",
            "royalty_fee": 24.25,
            "royalty_currency": "GBP",
            "royalty_unit": "mm^-3"
        }

## Retrieve metadata about users and assets [/parameters/{ParameterID}]
Retrieve all public information about the given parameter, including royalty fees

### Retrieve all public information about the given parameter, including royalty fees [GET]
+ Parameters
    + ParameterID (optional, string, `1`)
    
+ Response 200 (application/json)

        [{ 
            "ownerID": "32gh1s5Tp",
            "description": "Lorem ipsum dolor sit amet",
            "royalty_fee": 24.25,
            "royalty_currency": "GBP",
            "royalty_unit": "mm^-3"
        }]
        
## Retrieve metadata about users and assets [/materials/{MaterialID}]
Retrieve metadata about materials
        
### Retrieve all public information about the given material, including royalty fees [GET]
+ Parameters
    + MaterialID (optional, string, `1`)
    
+ Response 200 (application/json)

        [{ 
            "ownerID": "32gh1s5Tp",
            "name": "Lorem ipsun dolor sit amet"
            "description": "Lorem ipsum dolor sit amet",
            "restrictions": TODO
            "royalty_fee": 24.25,
            "royalty_currency": "GBP",
            "royalty_unit": "mm^-3"
        }]
        
## Retrieve metadata about users and assets [/manufacturers/{ManufacturerID}]
Retrieve metadata about manufacturers

### Retrieve all public information about the given manufacturer [GET]
+ Parameters
    + ManufacturerID (optional, string, `1`)
    
+ Response 200 (application/json)

        [{ 
            "name": "Lorem ipsun dolor sit amet"
            "description": "Lorem ipsum dolor sit amet",
            "location": TODO
        }]
        
## Retrieve metadata about users and assets [/manufacturers/{ManufacturerID}/machines/{MachineID}]
Retrieve metadata about machines for a given manufacturer

### Retrieve all public information about the given manufacturer [GET]
+ Parameters
    + MachineID (optional, string, `1`)
    
+ Response 200 (application/json)

        [{ 
            "ManufacturerID": "32gh1s5Tp",
            "description": "Lorem ipsum dolor sit amet",
            "location": TODO,
            "capabilities": TODO
        }]
        
## Updates information about a print [/files/{FileID}/prints/{PrintID}]
On manufacturer side, enables updates of the current design prints and their shippings

### Add a new print for a given FileID [POST]
+ Parameters
    + FileID (required, string, `1`)
    
+ Response 201 (application/json)
        
        { 
            "PrintID": "32gh1s5Tp",
        }

### Update print or shipping progress for a given FileID [PUT]
+ Parameters
    + FileID (required, string, `1`)
    + PrintID (required, string, `1`)

+ Request (application/json)

        {
            "PrintProgress": 25,
            "PrintComment": "Lorem ipsum dolor sit amet"
            "ShippingProgress": 0
            "ShippingComment": "Lorem dolor sit amet"
        }

+ Response 200

### Cancel a print [DELETE]
+ Parameters
    + FileID (required, string, `1`)
    + PrintID (required, string, `1`)
    
+ Response 204

    
